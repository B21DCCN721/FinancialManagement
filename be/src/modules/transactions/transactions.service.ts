import { FastifyInstance } from "fastify"
import { errors } from "../../utils/errors"
import { getCache, setCache, deleteCache, invalidateCachePattern, TTL, buildCacheKey } from "../../utils/cache"
import { CreateTransactionInput, UpdateTransactionInput, TransactionQuery } from "./transactions.schema"

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
  return await server.prisma.$transaction(async (prismaTx) => {
    // Verify category belongs to user
    const category = await prismaTx.category.findFirst({
      where: { id: data.categoryId, userId },
    })
    if (!category) throw errors.notFound("Category not found")

    // Validate type matches category type
    if (category.type !== data.type) {
      throw errors.badRequest(`Category type "${category.type}" doesn't match transaction type "${data.type}"`)
    }

    const tx = await prismaTx.transaction.create({
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
  })
}

export async function updateTransactionService(
  server: FastifyInstance,
  userId: string,
  id: string,
  data: UpdateTransactionInput
) {
  return await server.prisma.$transaction(async (prismaTx) => {
    const existing = await prismaTx.transaction.findFirst({ where: { id, userId } })
    if (!existing) throw errors.notFound("Transaction not found")

    const updated = await prismaTx.transaction.update({
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
  })
}

export async function deleteTransactionService(
  server: FastifyInstance,
  userId: string,
  id: string
) {
  await server.prisma.$transaction(async (prismaTx) => {
    const existing = await prismaTx.transaction.findFirst({ where: { id, userId } })
    if (!existing) throw errors.notFound("Transaction not found")

    await prismaTx.transaction.delete({ where: { id } })

    await invalidateUserTransactionCache(server, userId)
    await invalidateCachePattern(server.redis, `user:${userId}:reports*`)
    await invalidateCachePattern(server.redis, `user:${userId}:budgets*`)
  })
}
