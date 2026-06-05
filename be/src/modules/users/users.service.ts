import { FastifyInstance } from "fastify"
import { errors } from "../../utils/errors"
import { hashPassword, verifyPassword } from "../../utils/hash"
import { getCache, setCache, deleteCache, TTL, buildCacheKey } from "../../utils/cache"
import { UpdateProfileInput, ChangePasswordInput } from "./users.schema"

function profileCacheKey(userId: string) {
  return buildCacheKey("user", userId, "profile")
}

export async function getMeService(server: FastifyInstance, userId: string) {
  const key = profileCacheKey(userId)
  const cached = await getCache(server.redis, key)
  if (cached) return cached

  const user = await server.prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, email: true, name: true,
      firstName: true, lastName: true,
      avatarUrl: true, authProvider: true,
      createdAt: true, updatedAt: true,
    },
  })
  if (!user) throw errors.notFound("User not found")

  await setCache(server.redis, key, user, TTL.MEDIUM)
  return user
}

export async function updateProfileService(
  server: FastifyInstance,
  userId: string,
  data: UpdateProfileInput
) {
  const user = await server.prisma.user.update({
    where: { id: userId },
    data: {
      ...data,
      name: data.name ?? ([data.firstName, data.lastName].filter(Boolean).join(" ") || undefined),
    },
    select: {
      id: true, email: true, name: true,
      firstName: true, lastName: true,
      avatarUrl: true, authProvider: true,
      createdAt: true, updatedAt: true,
    },
  })
  await deleteCache(server.redis, profileCacheKey(userId))
  return user
}

export async function changePasswordService(
  server: FastifyInstance,
  userId: string,
  data: ChangePasswordInput
) {
  const user = await server.prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw errors.notFound("User not found")

  const valid = await verifyPassword(data.currentPassword, user.password)
  if (!valid) throw errors.badRequest("Current password is incorrect")

  const hashed = await hashPassword(data.newPassword)
  await server.prisma.user.update({
    where: { id: userId },
    data: { password: hashed, refreshToken: null }, // force re-login on password change
  })
  await deleteCache(server.redis, profileCacheKey(userId))
}

export async function deleteAccountService(server: FastifyInstance, userId: string) {
  await server.prisma.user.delete({ where: { id: userId } })
  await deleteCache(server.redis, profileCacheKey(userId))
}
