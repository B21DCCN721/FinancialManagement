import { FastifyInstance } from "fastify"
import { errors } from "../../utils/errors"
import { getCache, setCache, deleteCache, invalidateCachePattern, TTL, buildCacheKey } from "../../utils/cache"
import { CreateCategoryInput, UpdateCategoryInput } from "./categories.schema"

function cacheKey(userId: string) {
  return buildCacheKey("user", userId, "categories")
}

export async function getAllCategoriesService(server: FastifyInstance, userId: string) {
  const key = cacheKey(userId)
  const cached = await getCache(server.redis, key)
  if (cached) return cached

  const categories = await server.prisma.category.findMany({
    where: { userId },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  })

  await setCache(server.redis, key, categories, TTL.LONG) // 10 min cache
  return categories
}

export async function createCategoryService(
  server: FastifyInstance,
  userId: string,
  data: CreateCategoryInput
) {
  return await server.prisma.$transaction(async (tx) => {
    // Check duplicate name+type per user
    const existing = await tx.category.findFirst({
      where: { userId, name: { equals: data.name, mode: "insensitive" }, type: data.type },
    })
    if (existing) throw errors.conflict(`Category "${data.name}" already exists for type "${data.type}"`)

    const category = await tx.category.create({
      data: { ...data, userId },
    })

    await deleteCache(server.redis, cacheKey(userId))
    return category
  })
}

export async function updateCategoryService(
  server: FastifyInstance,
  userId: string,
  id: string,
  data: UpdateCategoryInput
) {
  return await server.prisma.$transaction(async (tx) => {
    const existing = await tx.category.findFirst({ where: { id, userId } })
    if (!existing) throw errors.notFound("Category not found")

    const updated = await tx.category.update({
      where: { id },
      data,
    })

    await deleteCache(server.redis, cacheKey(userId))
    return updated
  })
}

export async function deleteCategoryService(
  server: FastifyInstance,
  userId: string,
  id: string
) {
  await server.prisma.$transaction(async (tx) => {
    const existing = await tx.category.findFirst({ where: { id, userId } })
    if (!existing) throw errors.notFound("Category not found")

    // Check if category is used in transactions
    const txCount = await tx.transaction.count({ where: { categoryId: id } })
    if (txCount > 0) {
      throw errors.conflict(
        `Cannot delete: ${txCount} transaction(s) are linked to this category. Reassign them first.`
      )
    }

    await tx.category.delete({ where: { id } })
    await deleteCache(server.redis, cacheKey(userId))
  })
}
