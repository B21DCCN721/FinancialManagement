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
  return await server.prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: {
        name: data.name,
      },
      select: {
        id: true, email: true, name: true,
        avatarUrl: true, authProvider: true,
        createdAt: true, updatedAt: true,
      },
    })
    await deleteCache(server.redis, profileCacheKey(userId))
    return user
  })
}

export async function changePasswordService(
  server: FastifyInstance,
  userId: string,
  data: ChangePasswordInput
) {
  await server.prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } })
    if (!user) throw errors.notFound("User not found")

    if (user.authProvider === "google") {
      throw errors.badRequest("Tài khoản này được đăng ký bằng Google. Vui lòng đăng nhập bằng Google.")
    }

    const valid = await verifyPassword(data.currentPassword, user.password)
    if (!valid) throw errors.badRequest("Current password is incorrect")

    const hashed = await hashPassword(data.newPassword)
    await tx.user.update({
      where: { id: userId },
      data: { password: hashed, refreshToken: null }, // force re-login on password change
    })
    await deleteCache(server.redis, profileCacheKey(userId))
  })
}

export async function deleteAccountService(server: FastifyInstance, userId: string) {
  try {
    await server.prisma.$transaction(async (tx) => {
      await tx.user.delete({ where: { id: userId } })
      await deleteCache(server.redis, profileCacheKey(userId))
    })
  } catch (error: any) {
    if (error.code === "P2025") {
      throw errors.notFound("User not found")
    }
    throw error
  }
}

export async function unlinkGoogleService(server: FastifyInstance, userId: string) {
  await server.prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId } })
    if (!user) throw errors.notFound("User not found")

    if (user.authProvider !== "linked") {
      throw errors.badRequest("Tài khoản của bạn chưa được liên kết với Google hoặc chỉ sử dụng Google.")
    }

    await tx.user.update({
      where: { id: userId },
      data: { providerId: null, authProvider: "local" },
    })

    await deleteCache(server.redis, profileCacheKey(userId))
  })
}
