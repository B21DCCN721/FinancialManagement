import { FastifyInstance } from "fastify"
import { errors } from "../../utils/errors"
import { getCache, setCache, deleteCache, invalidateCachePattern, TTL, buildCacheKey } from "../../utils/cache"
import { CreateGoalInput, UpdateGoalInput, ContributeGoalInput, WithdrawGoalInput } from "./goals.schema"

function cacheKey(userId: string) {
  return buildCacheKey("user", userId, "goals")
}

import { enrichGoal } from "../../utils/goalHelpers"

export async function getAllGoalsService(server: FastifyInstance, userId: string) {
  const key = cacheKey(userId)
  const cached = await getCache(server.redis, key)
  if (cached) return cached

  const goals = await server.prisma.goal.findMany({
    where: { userId },
    orderBy: { deadline: "asc" },
  })

  const enrichedGoals = goals.map(enrichGoal)

  await setCache(server.redis, key, enrichedGoals, TTL.MEDIUM) // 5 min
  return enrichedGoals
}

export async function createGoalService(
  server: FastifyInstance,
  userId: string,
  data: CreateGoalInput
) {
  return await server.prisma.$transaction(async (tx) => {
    const goal = await tx.goal.create({
      data: {
        ...data,
        deadline: new Date(data.deadline),
        userId,
      },
    })

    await deleteCache(server.redis, cacheKey(userId))
    return enrichGoal(goal)
  })
}

export async function updateGoalService(
  server: FastifyInstance,
  userId: string,
  id: string,
  data: UpdateGoalInput
) {
  return await server.prisma.$transaction(async (tx) => {
    const existing = await tx.goal.findFirst({ where: { id, userId } })
    if (!existing) throw errors.notFound("Goal not found")

    const updated = await tx.goal.update({
      where: { id },
      data: {
        ...data,
        ...(data.deadline && { deadline: new Date(data.deadline) }),
      },
    })

    await deleteCache(server.redis, cacheKey(userId))
    return enrichGoal(updated)
  })
}

export async function contributeToGoalService(
  server: FastifyInstance,
  userId: string,
  id: string,
  data: ContributeGoalInput
) {
  return await server.prisma.$transaction(async (tx) => {
    const existing = await tx.goal.findFirst({ where: { id, userId } })
    if (!existing) throw errors.notFound("Goal not found")

    // ── Check available balance = totalIncome - totalExpense - totalGoalSavings ──
    const [incomeAgg, expenseAgg, goalsAgg] = await Promise.all([
      tx.transaction.aggregate({ where: { userId, type: "income" }, _sum: { amount: true } }),
      tx.transaction.aggregate({ where: { userId, type: "expense" }, _sum: { amount: true } }),
      tx.goal.aggregate({ where: { userId }, _sum: { currentAmount: true } }),
    ])
    const totalIncome = incomeAgg._sum.amount ?? 0
    const totalExpense = expenseAgg._sum.amount ?? 0
    const totalGoalSavings = goalsAgg._sum.currentAmount ?? 0
    const availableBalance = totalIncome - totalExpense - totalGoalSavings

    if (availableBalance <= 0) {
      throw errors.badRequest("Số dư khả dụng của bạn không đủ để nạp tiền vào mục tiêu")
    }
    if (data.amount > availableBalance) {
      throw errors.badRequest(
        `Số tiền nạp vượt quá số dư khả dụng hiện có. Số dư khả dụng: ${availableBalance.toLocaleString("vi-VN")} ₫`
      )
    }
    // ─────────────────────────────────────────────────────────────────

    const newAmount = existing.currentAmount + data.amount
    if (newAmount > existing.targetAmount) {
      throw errors.badRequest(
        `Số tiền nạp vượt quá mục tiêu. Còn thiếu: ${(existing.targetAmount - existing.currentAmount).toLocaleString("vi-VN")} ₫`
      )
    }

    const updated = await tx.goal.update({
      where: { id },
      data: { currentAmount: newAmount },
    })

    // Invalidate goals cache AND all report caches so balance updates immediately
    await Promise.all([
      deleteCache(server.redis, cacheKey(userId)),
      invalidateCachePattern(server.redis, buildCacheKey("user", userId, "reports", "*")),
    ])
    return enrichGoal(updated)
  })
}

export async function withdrawFromGoalService(
  server: FastifyInstance,
  userId: string,
  id: string,
  data: WithdrawGoalInput
) {
  return await server.prisma.$transaction(async (tx) => {
    const existing = await tx.goal.findFirst({ where: { id, userId } })
    if (!existing) throw errors.notFound("Goal not found")

    if (existing.currentAmount <= 0) {
      throw errors.badRequest("Mục tiêu này chưa có tiền tích lũy để rút")
    }
    if (data.amount > existing.currentAmount) {
      throw errors.badRequest(
        `Số tiền rút vượt quá số tiền hiện có trong mục tiêu. Hiện có: ${existing.currentAmount.toLocaleString("vi-VN")} ₫`
      )
    }

    const newAmount = existing.currentAmount - data.amount
    const updated = await tx.goal.update({
      where: { id },
      data: { currentAmount: newAmount },
    })

    // Invalidate caches so balance updates immediately
    await Promise.all([
      deleteCache(server.redis, cacheKey(userId)),
      invalidateCachePattern(server.redis, buildCacheKey("user", userId, "reports", "*")),
    ])
    return enrichGoal(updated)
  })
}

export async function deleteGoalService(
  server: FastifyInstance,
  userId: string,
  id: string
) {
  await server.prisma.$transaction(async (tx) => {
    const existing = await tx.goal.findFirst({ where: { id, userId } })
    if (!existing) throw errors.notFound("Goal not found")

    await tx.goal.delete({ where: { id } })
    await deleteCache(server.redis, cacheKey(userId))
  })
}
