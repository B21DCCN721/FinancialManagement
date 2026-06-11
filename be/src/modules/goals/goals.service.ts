import { FastifyInstance } from "fastify"
import { errors } from "../../utils/errors"
import { getCache, setCache, deleteCache, TTL, buildCacheKey } from "../../utils/cache"
import { CreateGoalInput, UpdateGoalInput, ContributeGoalInput } from "./goals.schema"

function cacheKey(userId: string) {
  return buildCacheKey("user", userId, "goals")
}

// ─── Helper ─────────────────────────────────────────────────────────
function enrichGoal(goal: { targetAmount: number; currentAmount: number; [key: string]: any }) {
  const progressPercentage =
    goal.targetAmount > 0
      ? Math.round((goal.currentAmount / goal.targetAmount) * 10000) / 100
      : 0
  return {
    ...goal,
    progressPercentage,
    isCompleted: goal.currentAmount >= goal.targetAmount,
  }
}

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

    // ── Check user's all-time net balance ────────────────────────────
    const [incomeAgg, expenseAgg] = await Promise.all([
      tx.transaction.aggregate({ where: { userId, type: "income" }, _sum: { amount: true } }),
      tx.transaction.aggregate({ where: { userId, type: "expense" }, _sum: { amount: true } }),
    ])
    const totalIncome = incomeAgg._sum.amount ?? 0
    const totalExpense = expenseAgg._sum.amount ?? 0
    const netBalance = totalIncome - totalExpense

    if (netBalance <= 0) {
      throw errors.badRequest("Số dư ròng của bạn không đủ để nạp tiền vào mục tiêu")
    }
    if (data.amount > netBalance) {
      throw errors.badRequest(
        `Số tiền nạp vượt quá số dư ròng hiện có. Số dư khả dụng: ${netBalance.toLocaleString("vi-VN")} ₫`
      )
    }
    // ─────────────────────────────────────────────────────────────────

    const newAmount = existing.currentAmount + data.amount
    if (newAmount > existing.targetAmount) {
      throw errors.badRequest(
        `Contribution exceeds the target. Remaining: ${existing.targetAmount - existing.currentAmount}`
      )
    }

    const updated = await tx.goal.update({
      where: { id },
      data: { currentAmount: newAmount },
    })

    await deleteCache(server.redis, cacheKey(userId))
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
