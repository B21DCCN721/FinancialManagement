import { FastifyInstance } from "fastify"
import { errors } from "../../utils/errors"
import { getCache, setCache, deleteCache, invalidateCachePattern, TTL, buildCacheKey } from "../../utils/cache"
import { CreateBudgetInput, UpdateBudgetInput, BudgetQuery } from "./budgets.schema"

function listCacheKey(userId: string, period?: string) {
  return buildCacheKey("user", userId, "budgets", period ?? "all")
}

function summaryKey(userId: string, period: string) {
  return buildCacheKey("user", userId, "budgets", "summary", period)
}

async function invalidateBudgetCache(server: FastifyInstance, userId: string) {
  await invalidateCachePattern(server.redis, `user:${userId}:budgets*`)
}

export async function getAllBudgetsService(
  server: FastifyInstance,
  userId: string,
  query: BudgetQuery
) {
  const key = listCacheKey(userId, query.period)
  const cached = await getCache(server.redis, key)
  if (cached) return cached

  const budgets = await server.prisma.budget.findMany({
    where: { userId, ...(query.period && { period: query.period }) },
    include: { category: { select: { id: true, name: true, color: true, icon: true } } },
    orderBy: { createdAt: "desc" },
  })

  await setCache(server.redis, key, budgets, TTL.MEDIUM)
  return budgets
}

export async function getBudgetSummaryService(
  server: FastifyInstance,
  userId: string,
  period: string
) {
  const key = summaryKey(userId, period)
  const cached = await getCache(server.redis, key)
  if (cached) return cached

  const budgets = await server.prisma.budget.findMany({
    where: { userId, period },
    include: { category: { select: { id: true, name: true, color: true, icon: true } } },
  })

  // Calculate spent amount per budget from transactions
  const result = await Promise.all(
    budgets.map(async (budget) => {
      const [year, month] = period.split("-").map(Number)
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 1)

      const agg = await server.prisma.transaction.aggregate({
        where: {
          userId,
          categoryId: budget.categoryId,
          type: "expense",
          date: { gte: startDate, lt: endDate },
        },
        _sum: { amount: true },
      })

      const spentAmount = agg._sum.amount ?? 0
      const remaining = budget.amount - spentAmount
      const percentUsed = budget.amount > 0
        ? Math.round((spentAmount / budget.amount) * 10000) / 100
        : 0

      return {
        id: budget.id,
        amount: budget.amount,
        period: budget.period,
        categoryId: budget.categoryId,
        category: budget.category,
        spentAmount,
        remaining,
        percentUsed,
      }
    })
  )

  await setCache(server.redis, key, result, TTL.MEDIUM)
  return result
}

export async function upsertBudgetService(
  server: FastifyInstance,
  userId: string,
  data: CreateBudgetInput
) {
  // Verify category belongs to user
  const category = await server.prisma.category.findFirst({
    where: { id: data.categoryId, userId },
  })
  if (!category) throw errors.notFound("Category not found")
  if (category.type !== "expense") throw errors.badRequest("Budgets can only be set for expense categories")

  const budget = await server.prisma.budget.upsert({
    where: {
      userId_categoryId_period: {
        userId,
        categoryId: data.categoryId,
        period: data.period,
      },
    },
    update: { amount: data.amount },
    create: { ...data, userId },
    include: { category: true },
  })

  await invalidateBudgetCache(server, userId)
  return budget
}

export async function updateBudgetService(
  server: FastifyInstance,
  userId: string,
  id: string,
  data: UpdateBudgetInput
) {
  const existing = await server.prisma.budget.findFirst({ where: { id, userId } })
  if (!existing) throw errors.notFound("Budget not found")

  const updated = await server.prisma.budget.update({
    where: { id },
    data,
    include: { category: true },
  })

  await invalidateBudgetCache(server, userId)
  return updated
}

export async function deleteBudgetService(
  server: FastifyInstance,
  userId: string,
  id: string
) {
  const existing = await server.prisma.budget.findFirst({ where: { id, userId } })
  if (!existing) throw errors.notFound("Budget not found")

  await server.prisma.budget.delete({ where: { id } })
  await invalidateBudgetCache(server, userId)
}
