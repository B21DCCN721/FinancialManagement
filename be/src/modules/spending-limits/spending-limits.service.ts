import { FastifyInstance } from "fastify"
import { errors } from "../../utils/errors"
import { getCache, setCache, invalidateCachePattern, TTL, buildCacheKey } from "../../utils/cache"
import { UpsertSpendingLimitInput, SpendingLimitQuery } from "./spending-limits.schema"

function listCacheKey(userId: string, date: string) {
  return buildCacheKey("user", userId, "spending-limits", "v1", date)
}

async function invalidateSpendingLimitCache(server: FastifyInstance, userId: string) {
  await invalidateCachePattern(server.redis, `user:${userId}:spending-limits*`)
}

function getDateRangeForType(type: "daily" | "weekly" | "monthly", dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number)
  const baseDate = new Date(year, month - 1, day, 0, 0, 0, 0)
  
  let startDate: Date
  let endDate: Date

  if (type === "daily") {
    startDate = baseDate
    endDate = new Date(year, month - 1, day, 23, 59, 59, 999)
  } else if (type === "weekly") {
    const startOfWeek = new Date(baseDate)
    const dayOfWeek = startOfWeek.getDay() // 0 = Sunday, 1 = Monday...
    const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
    startOfWeek.setDate(diff)
    startOfWeek.setHours(0, 0, 0, 0)
    startDate = startOfWeek

    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)
    endDate = endOfWeek
  } else {
    startDate = new Date(year, month - 1, 1, 0, 0, 0, 0)
    endDate = new Date(year, month, 0, 23, 59, 59, 999)
  }

  return { startDate, endDate }
}

export async function getSpendingLimitsService(
  server: FastifyInstance,
  userId: string,
  query: SpendingLimitQuery
) {
  // Default to today's date formatted as YYYY-MM-DD
  const dateStr = query.date ?? new Date().toISOString().slice(0, 10)
  const cacheKey = listCacheKey(userId, dateStr)
  
  const cached = await getCache(server.redis, cacheKey)
  if (cached) return cached

  // Fetch limits from DB
  const dbLimits = await server.prisma.spendingLimit.findMany({
    where: { userId },
  })

  const limitMap = new Map(dbLimits.map((l) => [l.type, l]))
  const types: ("daily" | "weekly" | "monthly")[] = ["daily", "weekly", "monthly"]

  const result = await Promise.all(
    types.map(async (type) => {
      const dbLimit = limitMap.get(type)
      const { startDate, endDate } = getDateRangeForType(type, dateStr)

      // Sum actual expenses in this period
      const agg = await server.prisma.transaction.aggregate({
        where: {
          userId,
          type: "expense",
          date: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      })

      const spentAmount = agg._sum.amount ?? 0
      const limitAmount = dbLimit ? dbLimit.amount : null
      const remaining = limitAmount !== null ? Math.max(0, limitAmount - spentAmount) : null
      const percentUsed = limitAmount !== null && limitAmount > 0
        ? Math.round((spentAmount / limitAmount) * 10000) / 100
        : 0

      let status: "normal" | "warning" | "exceeded" = "normal"
      if (limitAmount !== null) {
        if (percentUsed >= 100) status = "exceeded"
        else if (percentUsed >= 80) status = "warning"
      }

      return {
        id: dbLimit?.id,
        amount: limitAmount,
        type,
        userId,
        spentAmount,
        remaining,
        percentUsed,
        status,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      }
    })
  )

  await setCache(server.redis, cacheKey, result, TTL.MEDIUM)
  return result
}

export async function upsertSpendingLimitService(
  server: FastifyInstance,
  userId: string,
  data: UpsertSpendingLimitInput
) {
  const { amount, type } = data

  const spendingLimit = await server.prisma.spendingLimit.upsert({
    where: {
      userId_type: { userId, type },
    },
    update: { amount },
    create: { amount, type, userId },
  })

  await invalidateSpendingLimitCache(server, userId)
  return spendingLimit
}

export async function deleteSpendingLimitService(
  server: FastifyInstance,
  userId: string,
  type: "daily" | "weekly" | "monthly"
) {
  const existing = await server.prisma.spendingLimit.findUnique({
    where: {
      userId_type: { userId, type },
    },
  })

  if (!existing) throw errors.notFound("Spending limit not found")

  await server.prisma.spendingLimit.delete({
    where: {
      userId_type: { userId, type },
    },
  })

  await invalidateSpendingLimitCache(server, userId)
  return { message: "Spending limit deleted successfully" }
}
