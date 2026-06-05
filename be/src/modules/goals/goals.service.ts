import { FastifyInstance } from "fastify"
import { errors } from "../../utils/errors"
import { getCache, setCache, deleteCache, TTL, buildCacheKey } from "../../utils/cache"
import { CreateGoalInput, UpdateGoalInput, ContributeGoalInput } from "./goals.schema"

function cacheKey(userId: string) {
  return buildCacheKey("user", userId, "goals")
}

export async function getAllGoalsService(server: FastifyInstance, userId: string) {
  const key = cacheKey(userId)
  const cached = await getCache(server.redis, key)
  if (cached) return cached

  const goals = await server.prisma.goal.findMany({
    where: { userId },
    orderBy: { deadline: "asc" },
  })

  const enrichedGoals = goals.map((goal) => {
    const progressPercentage = goal.targetAmount > 0
      ? Math.round((goal.currentAmount / goal.targetAmount) * 10000) / 100
      : 0
    return {
      ...goal,
      progressPercentage,
      isCompleted: goal.currentAmount >= goal.targetAmount,
    }
  })

  await setCache(server.redis, key, enrichedGoals, TTL.MEDIUM) // 5 min
  return enrichedGoals
}

export async function createGoalService(
  server: FastifyInstance,
  userId: string,
  data: CreateGoalInput
) {
  const goal = await server.prisma.goal.create({
    data: {
      ...data,
      deadline: new Date(data.deadline),
      userId,
    },
  })

  await deleteCache(server.redis, cacheKey(userId))
  return goal
}

export async function updateGoalService(
  server: FastifyInstance,
  userId: string,
  id: string,
  data: UpdateGoalInput
) {
  const existing = await server.prisma.goal.findFirst({ where: { id, userId } })
  if (!existing) throw errors.notFound("Goal not found")

  const updated = await server.prisma.goal.update({
    where: { id },
    data: {
      ...data,
      ...(data.deadline && { deadline: new Date(data.deadline) }),
    },
  })

  await deleteCache(server.redis, cacheKey(userId))
  return updated
}

export async function contributeToGoalService(
  server: FastifyInstance,
  userId: string,
  id: string,
  data: ContributeGoalInput
) {
  const existing = await server.prisma.goal.findFirst({ where: { id, userId } })
  if (!existing) throw errors.notFound("Goal not found")

  const newAmount = existing.currentAmount + data.amount
  if (newAmount > existing.targetAmount) {
    throw errors.badRequest(
      `Contribution exceeds the target. Remaining: ${existing.targetAmount - existing.currentAmount}`
    )
  }

  const updated = await server.prisma.goal.update({
    where: { id },
    data: { currentAmount: newAmount },
  })

  await deleteCache(server.redis, cacheKey(userId))
  return updated
}

export async function deleteGoalService(
  server: FastifyInstance,
  userId: string,
  id: string
) {
  const existing = await server.prisma.goal.findFirst({ where: { id, userId } })
  if (!existing) throw errors.notFound("Goal not found")

  await server.prisma.goal.delete({ where: { id } })
  await deleteCache(server.redis, cacheKey(userId))
}
