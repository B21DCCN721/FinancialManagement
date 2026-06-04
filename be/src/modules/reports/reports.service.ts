import { FastifyInstance } from "fastify"
import { getCache, setCache, TTL, buildCacheKey } from "../../utils/cache"

function currentPeriod() {
  return new Date().toISOString().slice(0, 7)
}

function periodToRange(period: string) {
  const [year, month] = period.split("-").map(Number)
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 1)
  return { start, end }
}

// ─── Summary ─────────────────────────────────────────────────────────────────
export async function getSummaryService(server: FastifyInstance, userId: string, period: string) {
  const key = buildCacheKey("user", userId, "reports", "summary", period)
  const cached = await getCache(server.redis, key)
  if (cached) return cached

  const { start, end } = periodToRange(period)

  const transactions = await server.prisma.transaction.findMany({
    where: { userId, date: { gte: start, lt: end } },
    select: { amount: true, type: true },
  })

  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)

  const result = {
    period,
    totalIncome,
    totalExpense,
    netBalance: totalIncome - totalExpense,
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
