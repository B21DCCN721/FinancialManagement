import { FastifyInstance } from "fastify"
import { errors } from "../../utils/errors"
import { getCache, setCache, deleteCache, invalidateCachePattern, TTL, buildCacheKey } from "../../utils/cache"
import { CreateTransactionInput, UpdateTransactionInput, TransactionQuery } from "./transactions.schema"

function listCacheKey(userId: string, query: TransactionQuery) {
  return buildCacheKey("user", userId, "transactions", query)
}

function invalidateUserTransactionCache(server: FastifyInstance, userId: string) {
  return invalidateCachePattern(server.redis, `user:${userId}:transactions*`)
}

export async function getAllTransactionsService(
  server: FastifyInstance,
  userId: string,
  query: TransactionQuery
) {
  const key = listCacheKey(userId, query)
  const cached = await getCache(server.redis, key)
  if (cached) return cached

  const { page, limit, type, categoryId, dateFrom, dateTo, search } = query
  const skip = (page - 1) * limit

  const where = {
    userId,
    ...(type && { type }),
    ...(categoryId && { categoryId }),
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

  await setCache(server.redis, key, result, TTL.SHORT) // 2 min cache
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

  const tx = await server.prisma.transaction.create({
    data: {
      ...data,
      date: new Date(data.date),
      userId,
    },
    include: { category: true },
  })

  await invalidateUserTransactionCache(server, userId)
  // Also invalidate reports and budget summary caches
  await invalidateCachePattern(server.redis, `user:${userId}:reports*`)
  await invalidateCachePattern(server.redis, `user:${userId}:budgets*`)

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

  const updated = await server.prisma.transaction.update({
    where: { id },
    data: {
      ...data,
      ...(data.date && { date: new Date(data.date) }),
    },
    include: { category: true },
  })

  await invalidateUserTransactionCache(server, userId)
  await invalidateCachePattern(server.redis, `user:${userId}:reports*`)
  await invalidateCachePattern(server.redis, `user:${userId}:budgets*`)

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

  await invalidateUserTransactionCache(server, userId)
  await invalidateCachePattern(server.redis, `user:${userId}:reports*`)
  await invalidateCachePattern(server.redis, `user:${userId}:budgets*`)
}
