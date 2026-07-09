import { FastifyInstance } from "fastify"
import { errors } from "../../utils/errors"
import { getCache, setCache, invalidateCachePattern, TTL, buildCacheKey } from "../../utils/cache"
import { CreateTransactionInput, UpdateTransactionInput, TransactionQuery } from "./transactions.schema"

// ─── Helpers ─────────────────────────────────────────────────────────────────

import { calcNextRunAt } from "../../utils/date"
// ─── Auto-Categorize ─────────────────────────────────────────────────────────

export async function autoCategorizeService(
  server: FastifyInstance,
  userId: string,
  description: string
) {
  const lowerDesc = description.toLowerCase()
  let suggestedCategory = "Khác"
  
  if (lowerDesc.includes("lương") || lowerDesc.includes("salary")) suggestedCategory = "Thu nhập"
  else if (lowerDesc.includes("kfc") || lowerDesc.includes("mcdonald") || lowerDesc.includes("ăn") || lowerDesc.includes("food") || lowerDesc.includes("cafe") || lowerDesc.includes("coffee") || lowerDesc.includes("phở")) suggestedCategory = "Ăn uống"
  else if (lowerDesc.includes("netflix") || lowerDesc.includes("spotify") || lowerDesc.includes("game") || lowerDesc.includes("phim") || lowerDesc.includes("movie")) suggestedCategory = "Giải trí"
  else if (lowerDesc.includes("grab") || lowerDesc.includes("uber") || lowerDesc.includes("taxi") || lowerDesc.includes("xăng") || lowerDesc.includes("gas")) suggestedCategory = "Di chuyển"
  else if (lowerDesc.includes("shopee") || lowerDesc.includes("lazada") || lowerDesc.includes("tiki") || lowerDesc.includes("amazon") || lowerDesc.includes("mua")) suggestedCategory = "Mua sắm"
  else if (lowerDesc.includes("điện") || lowerDesc.includes("nước") || lowerDesc.includes("mạng") || lowerDesc.includes("internet")) suggestedCategory = "Tiện ích"
  
  const category = await server.prisma.category.findFirst({
    where: { userId, name: suggestedCategory }
  })
  
  if (!category) {
    return { categoryId: null, categoryName: null, type: null }
  }
  
  return { categoryId: category.id, categoryName: category.name, type: category.type }
}

// ─── Cache Helpers ────────────────────────────────────────────────────────────

function listCacheKey(userId: string, query: TransactionQuery) {
  return buildCacheKey("user", userId, "transactions", query)
}

async function invalidateUserCaches(server: FastifyInstance, userId: string) {
  await Promise.all([
    invalidateCachePattern(server.redis, `user:${userId}:transactions*`),
    invalidateCachePattern(server.redis, `user:${userId}:reports*`),
    invalidateCachePattern(server.redis, `user:${userId}:budgets*`),
    invalidateCachePattern(server.redis, `user:${userId}:spending-limits*`),
  ])
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export async function getAllTransactionsService(
  server: FastifyInstance,
  userId: string,
  query: TransactionQuery
) {
  const key = listCacheKey(userId, query)
  const cached = await getCache(server.redis, key)
  if (cached) return cached

  const { page, limit, type, categoryId, dateFrom, dateTo, search, isRecurring } = query
  const skip = (page - 1) * limit

  const where = {
    userId,
    ...(type && { type }),
    ...(categoryId && { categoryId }),
    ...(isRecurring !== undefined && { isRecurring }),
    ...(search && {
      description: { contains: search, mode: "insensitive" as const },
    }),
    ...((dateFrom || dateTo) && {
      date: {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo) }),
      },
    }),
  }

  const [data, total] = await Promise.all([
    server.prisma.transaction.findMany({
      where,
      orderBy: { date: "desc" },
      skip,
      take: limit,
      include: { category: { select: { id: true, name: true, color: true, icon: true } } },
    }),
    server.prisma.transaction.count({ where }),
  ])

  const result = {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  }

  await setCache(server.redis, key, result, TTL.SHORT)
  return result
}

export async function getTransactionByIdService(
  server: FastifyInstance,
  userId: string,
  id: string
) {
  const tx = await server.prisma.transaction.findFirst({
    where: { id, userId },
    include: { category: true },
  })
  if (!tx) throw errors.notFound("Transaction not found")
  return tx
}

export async function createTransactionService(
  server: FastifyInstance,
  userId: string,
  data: CreateTransactionInput
) {
  // Verify category belongs to user
  const category = await server.prisma.category.findFirst({
    where: { id: data.categoryId, userId },
  })
  if (!category) throw errors.notFound("Category not found")

  // Validate type matches category type
  if (category.type !== data.type) {
    throw errors.badRequest(`Category type "${category.type}" doesn't match transaction type "${data.type}"`)
  }

  // Calculate nextRunAt for recurring transactions
  const txDate = new Date(data.date)
  const nextRunAt = data.isRecurring && data.frequency
    ? calcNextRunAt(txDate, data.frequency as "daily" | "weekly" | "monthly" | "yearly")
    : null

  const tx = await server.prisma.transaction.create({
    data: {
      amount: data.amount,
      type: data.type,
      description: data.description,
      date: txDate,
      isRecurring: data.isRecurring ?? false,
      frequency: data.frequency ?? null,
      nextRunAt,
      userId,
      categoryId: data.categoryId,
    },
    include: { category: true },
  })

  // Invalidate caches AFTER successful DB write
  await invalidateUserCaches(server, userId)

  return tx
}

export async function updateTransactionService(
  server: FastifyInstance,
  userId: string,
  id: string,
  data: UpdateTransactionInput
) {
  const existing = await server.prisma.transaction.findFirst({ where: { id, userId } })
  if (!existing) throw errors.notFound("Transaction not found")

  // Build update payload with explicit fields to keep Prisma types safe
  const isRecurring = data.isRecurring !== undefined ? data.isRecurring : existing.isRecurring
  const isTurningOffRecurring = data.isRecurring === false

  // Determine new nextRunAt if still recurring and date/frequency changed
  let nextRunAt: Date | null | undefined = undefined // undefined = don't touch the field
  if (isTurningOffRecurring) {
    nextRunAt = null
  } else if (isRecurring && (data.date || data.frequency)) {
    const baseDate = data.date ? new Date(data.date) : existing.date
    const freq = (data.frequency ?? existing.frequency) as "daily" | "weekly" | "monthly" | "yearly" | null
    if (freq) {
      nextRunAt = calcNextRunAt(baseDate, freq)
    }
  }

  const updated = await server.prisma.transaction.update({
    where: { id },
    data: {
      ...(data.amount !== undefined && { amount: data.amount }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.date !== undefined && { date: new Date(data.date) }),
      ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
      isRecurring,
      // Clear frequency and schedule when turning off recurring
      frequency: isTurningOffRecurring ? null : (data.frequency !== undefined ? data.frequency : existing.frequency),
      ...(nextRunAt !== undefined && { nextRunAt }),
      ...(isTurningOffRecurring && { lastProcessedAt: null }),
    },
    include: { category: true },
  })

  // Invalidate caches AFTER successful DB write
  await invalidateUserCaches(server, userId)

  return updated
}

export async function deleteTransactionService(
  server: FastifyInstance,
  userId: string,
  id: string
) {
  const existing = await server.prisma.transaction.findFirst({ where: { id, userId } })
  if (!existing) throw errors.notFound("Transaction not found")

  await server.prisma.transaction.delete({ where: { id } })

  // Invalidate caches AFTER successful DB write
  await invalidateUserCaches(server, userId)
}

// ─── Stop Recurring ───────────────────────────────────────────────────────────

/**
 * Stop a recurring transaction: sets isRecurring=false, clears frequency/nextRunAt/lastProcessedAt.
 */
export async function stopRecurringService(
  server: FastifyInstance,
  userId: string,
  id: string
) {
  const existing = await server.prisma.transaction.findFirst({ where: { id, userId } })
  if (!existing) throw errors.notFound("Transaction not found")
  if (!existing.isRecurring) throw errors.badRequest("Transaction is not recurring")

  const updated = await server.prisma.transaction.update({
    where: { id },
    data: {
      isRecurring: false,
      frequency: null,
      nextRunAt: null,
      lastProcessedAt: null,
    },
    include: { category: true },
  })

  await invalidateUserCaches(server, userId)

  return updated
}

// ─── Recurring Processor ──────────────────────────────────────────────────────

/**
 * Process all due recurring transactions:
 * - Find all recurring transactions where nextRunAt <= now
 * - Create a new transaction entry (duplicate with new date = nextRunAt)
 * - Update nextRunAt to the next cycle
 * - Update lastProcessedAt to now
 */
export async function processRecurringTransactionsService(server: FastifyInstance) {
  const now = new Date()

  const dueTxs = await server.prisma.transaction.findMany({
    where: {
      isRecurring: true,
      nextRunAt: { lte: now },
      frequency: { not: null },
    },
  })

  server.log.info(`[Scheduler] Processing ${dueTxs.length} due recurring transactions`)

  for (const tx of dueTxs) {
    try {
      const freq = tx.frequency as "daily" | "weekly" | "monthly" | "yearly"
      const newDate = tx.nextRunAt ?? now
      const nextRunAt = calcNextRunAt(newDate, freq)

      await server.prisma.$transaction(async (prismaTx) => {
        // Create new transaction entry for this cycle
        await prismaTx.transaction.create({
          data: {
            amount: tx.amount,
            type: tx.type,
            description: tx.description,
            date: newDate,
            isRecurring: false, // generated entries are NOT recurring themselves
            frequency: null,
            nextRunAt: null,
            userId: tx.userId,
            categoryId: tx.categoryId,
          },
        })

        // Advance the recurring template to next cycle
        await prismaTx.transaction.update({
          where: { id: tx.id },
          data: {
            lastProcessedAt: now,
            nextRunAt,
          },
        })
      })

      // Invalidate caches AFTER successful DB transaction
      await invalidateUserCaches(server, tx.userId)

      server.log.info(`[Scheduler] Processed recurring tx ${tx.id} for user ${tx.userId}, next run: ${nextRunAt.toISOString()}`)
    } catch (err) {
      server.log.error(`[Scheduler] Failed to process recurring tx ${tx.id}: ${err}`)
    }
  }
}
