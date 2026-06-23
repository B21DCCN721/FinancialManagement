import { FastifyInstance } from "fastify"
import { getCache, setCache, TTL, buildCacheKey } from "../../utils/cache"

import { currentPeriod, periodToRange } from "../../utils/date"

// ─── Summary ─────────────────────────────────────────────────────────────────
export async function getSummaryService(server: FastifyInstance, userId: string, period: string) {
  const key = buildCacheKey("user", userId, "reports", "summary", period)
  const cached = await getCache(server.redis, key)
  if (cached) return cached

  const { start, end } = periodToRange(period)

  const [transactions, goalsAgg] = await Promise.all([
    server.prisma.transaction.findMany({
      where: { userId, date: { gte: start, lt: end } },
      select: { amount: true, type: true },
    }),
    server.prisma.goal.aggregate({
      where: { userId },
      _sum: { currentAmount: true },
    }),
  ])

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)
  const totalGoalSavings = goalsAgg._sum.currentAmount ?? 0

  const result = {
    period,
    totalIncome,
    totalExpense,
    totalGoalSavings,
    netBalance: totalIncome - totalExpense - totalGoalSavings,
    transactionCount: transactions.length,
  }

  await setCache(server.redis, key, result, TTL.LONG) // 10 min
  return result
}

// ─── Monthly Trend ────────────────────────────────────────────────────────────
export async function getMonthlyTrendService(server: FastifyInstance, userId: string, months: number) {
  const key = buildCacheKey("user", userId, "reports", "trend", months)
  const cached = await getCache(server.redis, key)
  if (cached) return cached

  const endDate = new Date()
  endDate.setDate(1)
  endDate.setMonth(endDate.getMonth() + 1) // start of next month
  const startDate = new Date(endDate)
  startDate.setMonth(startDate.getMonth() - months)

  const transactions = await server.prisma.transaction.findMany({
    where: { userId, date: { gte: startDate, lt: endDate } },
    select: { amount: true, type: true, date: true },
  })

  // Build month buckets
  const buckets: Record<string, { income: number; expense: number }> = {}
  for (let i = 0; i < months; i++) {
    const d = new Date(startDate)
    d.setMonth(d.getMonth() + i)
    const p = d.toISOString().slice(0, 7)
    buckets[p] = { income: 0, expense: 0 }
  }

  for (const tx of transactions) {
    const p = tx.date.toISOString().slice(0, 7)
    if (buckets[p]) {
      if (tx.type === "income") buckets[p].income += tx.amount
      else buckets[p].expense += tx.amount
    }
  }

  const result = Object.entries(buckets)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, { income, expense }]) => ({
      period,
      income: Math.round(income * 100) / 100,
      expense: Math.round(expense * 100) / 100,
      net: Math.round((income - expense) * 100) / 100,
    }))

  await setCache(server.redis, key, result, TTL.LONG)
  return result
}

// ─── Category Breakdown ───────────────────────────────────────────────────────
export async function getCategoryBreakdownService(server: FastifyInstance, userId: string, period: string) {
  const key = buildCacheKey("user", userId, "reports", "categories", period)
  const cached = await getCache(server.redis, key)
  if (cached) return cached

  const { start, end } = periodToRange(period)

  const transactions = await server.prisma.transaction.findMany({
    where: { userId, date: { gte: start, lt: end } },
    select: { amount: true, type: true, categoryId: true, category: { select: { name: true, color: true, icon: true } } },
  })

  const grouped: Record<string, {
    categoryId: string; categoryName: string; categoryColor: string | null;
    categoryIcon: string | null; type: string; totalAmount: number; transactionCount: number
  }> = {}

  for (const tx of transactions) {
    const k = `${tx.categoryId}:${tx.type}`
    if (!grouped[k]) {
      grouped[k] = {
        categoryId: tx.categoryId,
        categoryName: tx.category.name,
        categoryColor: tx.category.color,
        categoryIcon: tx.category.icon,
        type: tx.type,
        totalAmount: 0,
        transactionCount: 0,
      }
    }
    grouped[k].totalAmount += tx.amount
    grouped[k].transactionCount++
  }

  // Calculate percentages per type
  const items = Object.values(grouped)
  const expenseTotal = items.filter((i) => i.type === "expense").reduce((s, i) => s + i.totalAmount, 0)
  const incomeTotal = items.filter((i) => i.type === "income").reduce((s, i) => s + i.totalAmount, 0)

  const result = items
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .map((item) => ({
      ...item,
      totalAmount: Math.round(item.totalAmount * 100) / 100,
      percentage: (() => {
        const total = item.type === "expense" ? expenseTotal : incomeTotal
        return total > 0 ? Math.round((item.totalAmount / total) * 10000) / 100 : 0
      })(),
    }))

  await setCache(server.redis, key, result, TTL.LONG)
  return result
}

// ─── Cash Flow ────────────────────────────────────────────────────────────────
export async function getCashFlowService(server: FastifyInstance, userId: string, period: string) {
  const key = buildCacheKey("user", userId, "reports", "cashflow", period)
  const cached = await getCache(server.redis, key)
  if (cached) return cached

  const { start, end } = periodToRange(period)

  const transactions = await server.prisma.transaction.findMany({
    where: { userId, date: { gte: start, lt: end } },
    select: { amount: true, type: true, date: true },
    orderBy: { date: "asc" },
  })

  const dailyMap: Record<string, { income: number; expense: number }> = {}
  for (const tx of transactions) {
    const day = tx.date.toISOString().slice(0, 10)
    if (!dailyMap[day]) dailyMap[day] = { income: 0, expense: 0 }
    if (tx.type === "income") dailyMap[day].income += tx.amount
    else dailyMap[day].expense += tx.amount
  }

  const result = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, { income, expense }]) => ({
      date,
      income: Math.round(income * 100) / 100,
      expense: Math.round(expense * 100) / 100,
      net: Math.round((income - expense) * 100) / 100,
    }))

  await setCache(server.redis, key, result, TTL.LONG)
  return result
}

// ─── All-Time Balance ──────────────────────────────────────────────────────────
export async function getBalanceService(server: FastifyInstance, userId: string) {
  const key = buildCacheKey("user", userId, "reports", "balance")
  const cached = await getCache<{ totalIncome: number; totalExpense: number; totalGoalSavings: number; netBalance: number }>(server.redis, key)
  if (cached) return cached

  const [incomeAgg, expenseAgg, goalsAgg] = await Promise.all([
    server.prisma.transaction.aggregate({
      where: { userId, type: "income" },
      _sum: { amount: true },
    }),
    server.prisma.transaction.aggregate({
      where: { userId, type: "expense" },
      _sum: { amount: true },
    }),
    server.prisma.goal.aggregate({
      where: { userId },
      _sum: { currentAmount: true },
    }),
  ])

  const totalIncome = incomeAgg._sum.amount ?? 0
  const totalExpense = expenseAgg._sum.amount ?? 0
  const totalGoalSavings = goalsAgg._sum.currentAmount ?? 0
  const result = {
    totalIncome,
    totalExpense,
    totalGoalSavings,
    netBalance: totalIncome - totalExpense - totalGoalSavings,
  }

  await setCache(server.redis, key, result, TTL.SHORT) // 1 min
  return result
}
