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

function getPeriodForType(type: "daily" | "weekly" | "monthly", dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number)
  const baseDate = new Date(year, month - 1, day, 0, 0, 0, 0)

  if (type === "daily") {
    return dateStr
  } else if (type === "weekly") {
    const startOfWeek = new Date(baseDate)
    const dayOfWeek = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
    startOfWeek.setDate(diff)
    const y = startOfWeek.getFullYear()
    const m = String(startOfWeek.getMonth() + 1).padStart(2, "0")
    const d = String(startOfWeek.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  } else {
    const m = String(month).padStart(2, "0")
    return `${year}-${m}`
  }
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

function isPeriodInPast(type: "daily" | "weekly" | "monthly", period: string): boolean {
  const now = new Date()
  
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() // 0-indexed
  const currentDay = now.getDate()
  
  const todayStart = new Date(currentYear, currentMonth, currentDay, 0, 0, 0, 0)

  // Current week Monday
  const currentWeekMonday = new Date(todayStart)
  const dayOfWeek = currentWeekMonday.getDay()
  const diff = currentWeekMonday.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
  currentWeekMonday.setDate(diff)

  // Current month start
  const currentMonthStart = new Date(currentYear, currentMonth, 1, 0, 0, 0, 0)

  if (type === "daily") {
    const [y, m, d] = period.split("-").map(Number)
    const periodDate = new Date(y, m - 1, d, 0, 0, 0, 0)
    return periodDate < todayStart
  } else if (type === "weekly") {
    const [y, m, d] = period.split("-").map(Number)
    const periodMonday = new Date(y, m - 1, d, 0, 0, 0, 0)
    return periodMonday < currentWeekMonday
  } else {
    // monthly: period format YYYY-MM
    const [y, m] = period.split("-").map(Number)
    const periodMonthStart = new Date(y, m - 1, 1, 0, 0, 0, 0)
    return periodMonthStart < currentMonthStart
  }
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

  // Fetch relevant period-specific limits in one query
  const dailyPeriod = getPeriodForType("daily", dateStr)
  const weeklyPeriod = getPeriodForType("weekly", dateStr)
  const monthlyPeriod = getPeriodForType("monthly", dateStr)

  const dbLimits = await server.prisma.spendingLimit.findMany({
    where: {
      userId,
      OR: [
        { type: "daily", period: dailyPeriod },
        { type: "weekly", period: weeklyPeriod },
        { type: "monthly", period: monthlyPeriod },
      ],
    },
  })

  const limitMap = new Map(dbLimits.map((l) => [`${l.type}:${l.period}`, l]))
  const types: ("daily" | "weekly" | "monthly")[] = ["daily", "weekly", "monthly"]

  const result = await Promise.all(
    types.map(async (type) => {
      const period = getPeriodForType(type, dateStr)
      const dbLimit = limitMap.get(`${type}:${period}`)
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
  const { amount, type, period, isEdit } = data

  // Block modifications to past periods
  if (isPeriodInPast(type, period)) {
    throw errors.badRequest("Không thể chỉnh sửa hoặc tạo giới hạn chi tiêu cho thời gian đã qua.")
  }

  // Check unique record
  const existing = await server.prisma.spendingLimit.findUnique({
    where: {
      userId_type_period: { userId, type, period },
    },
  })

  if (existing) {
    if (!isEdit) {
      throw errors.badRequest("Giới hạn chi tiêu cho khoảng thời gian này đã tồn tại.")
    }
    // Update
    const updated = await server.prisma.spendingLimit.update({
      where: {
        userId_type_period: { userId, type, period },
      },
      data: { amount },
    })
    await invalidateSpendingLimitCache(server, userId)
    return updated
  } else {
    if (isEdit) {
      throw errors.notFound("Giới hạn chi tiêu không tồn tại.")
    }
    // Create new
    const created = await server.prisma.spendingLimit.create({
      data: { amount, type, period, userId },
    })
    await invalidateSpendingLimitCache(server, userId)
    return created
  }
}

export async function deleteSpendingLimitService(
  server: FastifyInstance,
  userId: string,
  type: "daily" | "weekly" | "monthly",
  period: string
) {
  // Block deleting past periods
  if (isPeriodInPast(type, period)) {
    throw errors.badRequest("Không thể xóa giới hạn chi tiêu của thời gian đã qua.")
  }

  const existing = await server.prisma.spendingLimit.findUnique({
    where: {
      userId_type_period: { userId, type, period },
    },
  })

  if (!existing) throw errors.notFound("Spending limit not found")

  await server.prisma.spendingLimit.delete({
    where: {
      userId_type_period: { userId, type, period },
    },
  })

  await invalidateSpendingLimitCache(server, userId)
  return { message: "Spending limit deleted successfully" }
}
