import { PrismaClient } from "@prisma/client"
import { FastifyInstance } from "fastify"
import { hashPassword, verifyPassword } from "../../utils/hash"
import { errors } from "../../utils/errors"
import { RegisterInput, LoginInput } from "./auth.schema"

/**
 * Register a new user.
 */
export async function registerService(
  server: FastifyInstance,
  data: RegisterInput
) {
  const prisma: PrismaClient = server.prisma

  // Check duplicate email
  const existing = await prisma.user.findUnique({ where: { email: data.email } })
  if (existing) throw errors.conflict("Email already in use")

  const hashed = await hashPassword(data.password)
  const displayName = data.name ?? ([data.firstName, data.lastName].filter(Boolean).join(" ") || null)

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashed,
      firstName: data.firstName ?? null,
      lastName: data.lastName ?? null,
      name: displayName,
    },
  })

  const { accessToken, refreshToken } = await issueTokens(server, user.id, user.email)

  // Persist hashed refresh token
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: await hashPassword(refreshToken) },
  })

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
    },
  }
}

/**
 * Login with email + password.
 */
export async function loginService(
  server: FastifyInstance,
  data: LoginInput
) {
  const prisma: PrismaClient = server.prisma

  const user = await prisma.user.findUnique({ where: { email: data.email } })
  if (!user) throw errors.unauthorized("Invalid email or password")

  const valid = await verifyPassword(data.password, user.password)
  if (!valid) throw errors.unauthorized("Invalid email or password")

  const { accessToken, refreshToken } = await issueTokens(server, user.id, user.email)

  // Persist hashed refresh token (rotation)
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken: await hashPassword(refreshToken) },
  })

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
    },
  }
}

/**
 * Issue a new access token using a valid refresh token.
 */
export async function refreshService(
  server: FastifyInstance,
  token: string
) {
  let payload: { id: string; email: string }
  try {
    payload = server.jwt.verify<{ id: string; email: string }>(token)
  } catch {
    throw errors.unauthorized("Invalid or expired refresh token")
  }

  const prisma: PrismaClient = server.prisma
  const user = await prisma.user.findUnique({ where: { id: payload.id } })
  if (!user || !user.refreshToken) throw errors.unauthorized("Session expired, please log in again")

  const valid = await verifyPassword(token, user.refreshToken)
  if (!valid) throw errors.unauthorized("Invalid refresh token")

  const accessToken = server.jwt.sign(
    { id: user.id, email: user.email },
    { expiresIn: "15m" }
  )

  return { accessToken }
}

/**
 * Logout – clears the stored refresh token.
 */
export async function logoutService(server: FastifyInstance, userId: string) {
  await server.prisma.user.update({
    where: { id: userId },
    data: { refreshToken: null },
  })
}

// ─── Internal helpers ────────────────────────────────────────────────
async function issueTokens(server: FastifyInstance, id: string, email: string) {
  const accessToken = server.jwt.sign({ id, email }, { expiresIn: "15m" })
  const refreshToken = server.jwt.sign({ id, email }, { expiresIn: "7d" })
  return { accessToken, refreshToken }
}
