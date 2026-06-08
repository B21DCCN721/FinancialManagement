import { PrismaClient } from "@prisma/client"
import { FastifyInstance } from "fastify"
import { verifyPassword, hashPassword } from "../../utils/hash"
import { errors } from "../../utils/errors"
import { RegisterInput, LoginInput } from "./auth.schema"
import { createClerkClient, verifyToken } from "@clerk/backend"
import crypto from "crypto"
import { sendMail } from "../../utils/mailer"
import { ForgotPasswordInput, ResetPasswordInput } from "./auth.schema"

const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })

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

  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
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
    await tx.user.update({
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
        authProvider: user.authProvider,
        createdAt: user.createdAt,
      },
    }
  })
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
      authProvider: user.authProvider,
      createdAt: user.createdAt,
    },
  }
}

/**
 * Login with Google / Clerk token
 */
export async function googleLoginService(
  server: FastifyInstance,
  token: string
) {
  const prisma: PrismaClient = server.prisma

  if (!process.env.CLERK_SECRET_KEY) {
    throw errors.internal("CLERK_SECRET_KEY is not configured on the server")
  }

  let providerId: string
  try {
    // Xác thực token do Clerk trả về từ frontend
    const verified = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY })
    providerId = verified.sub
  } catch (err) {
    server.log.error(err, "Clerk token verification failed")
    throw errors.unauthorized("Invalid Google authentication token")
  }

  // Lấy thông tin user từ Clerk
  const clerkUser = await clerk.users.getUser(providerId)
  const email = clerkUser.emailAddresses[0]?.emailAddress
  if (!email) throw errors.badRequest("Google account does not have an email")

  const firstName = clerkUser.firstName
  const lastName = clerkUser.lastName
  const name = [firstName, lastName].filter(Boolean).join(" ") || email.split("@")[0]
  const avatarUrl = clerkUser.imageUrl

  return await prisma.$transaction(async (tx) => {
    // Tìm user theo providerId hoặc email
    let user = await tx.user.findFirst({
      where: {
        OR: [
          { providerId },
          { email }
        ]
      }
    })

    if (user) {
      // Nếu user đã tồn tại nhưng chưa có providerId (tức là trước đây đk bằng email thường), thì update lại
      if (!user.providerId || user.authProvider !== "google") {
        user = await tx.user.update({
          where: { id: user.id },
          data: {
            providerId,
            authProvider: "google",
            avatarUrl: user.avatarUrl ?? avatarUrl, // Cập nhật avatar nếu rỗng
          }
        })
      }
    } else {
      // Tạo user mới nếu chưa tồn tại
      // random password cho tk google
      const randomPassword = crypto.randomBytes(32).toString("hex")
      const hashed = await hashPassword(randomPassword)

      user = await tx.user.create({
        data: {
          email,
          password: hashed,
          firstName,
          lastName,
          name,
          avatarUrl,
          authProvider: "google",
          providerId,
        }
      })
    }

    const { accessToken, refreshToken } = await issueTokens(server, user.id, user.email)

    // Persist hashed refresh token (rotation)
    await tx.user.update({
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
        authProvider: user.authProvider,
        createdAt: user.createdAt,
      },
    }
  })
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
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: payload.id } })
    if (!user || !user.refreshToken) throw errors.unauthorized("Session expired, please log in again")

    const valid = await verifyPassword(token, user.refreshToken)
    if (!valid) throw errors.unauthorized("Invalid refresh token")

    const { accessToken, refreshToken } = await issueTokens(server, user.id, user.email)

    // Rotate token: Persist new hashed refresh token, invalidating the old one
    await tx.user.update({
      where: { id: user.id },
      data: { refreshToken: await hashPassword(refreshToken) },
    })

    return { accessToken, refreshToken }
  })
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

/**
 * Forgot Password - Send OTP via Email
 */
export async function forgotPasswordService(
  server: FastifyInstance,
  data: ForgotPasswordInput
) {
  const prisma: PrismaClient = server.prisma
  const user = await prisma.user.findUnique({ where: { email: data.email } })

  if (!user) {
    // Để tránh dò email, không throw lỗi trực tiếp mà trả về thành công giả
    return { message: "Nếu email tồn tại trong hệ thống, mã OTP đã được gửi." }
  }

  if (user.authProvider !== "local") {
    throw errors.badRequest("Tài khoản này được đăng ký bằng Google. Vui lòng đăng nhập bằng Google.")
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordOtp: otp, // Tùy chọn: Bạn có thể hash OTP ở đây nếu muốn bảo mật cao hơn
      resetPasswordExpiresAt: expiresAt,
    },
  })

  // Send Email
  await sendMail({
    to: user.email,
    subject: "Yêu cầu khôi phục mật khẩu - Financial Management",
    html: `
      <h2>Khôi phục mật khẩu</h2>
      <p>Xin chào ${user.name || "bạn"},</p>
      <p>Bạn vừa yêu cầu khôi phục mật khẩu. Dưới đây là mã OTP của bạn (có hiệu lực trong 15 phút):</p>
      <h3 style="background: #f4f4f4; padding: 10px; display: inline-block; letter-spacing: 2px;">${otp}</h3>
      <p>Nếu bạn không yêu cầu, vui lòng bỏ qua email này.</p>
    `,
  })

  return { message: "Mã OTP đã được gửi đến email của bạn." }
}

/**
 * Reset Password - Verify OTP and Set New Password
 */
export async function resetPasswordService(
  server: FastifyInstance,
  data: ResetPasswordInput
) {
  const prisma: PrismaClient = server.prisma
  return await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { email: data.email } })

    if (!user) throw errors.badRequest("Email không tồn tại hoặc OTP không hợp lệ")

    if (!user.resetPasswordOtp || !user.resetPasswordExpiresAt) {
      throw errors.badRequest("Chưa có yêu cầu lấy lại mật khẩu nào cho tài khoản này")
    }

    if (user.resetPasswordExpiresAt < new Date()) {
      throw errors.badRequest("Mã OTP đã hết hạn")
    }

    if (user.resetPasswordOtp !== data.otp) {
      throw errors.badRequest("Mã OTP không chính xác")
    }

    // Xoá OTP & cập nhật mật khẩu
    const hashed = await hashPassword(data.newPassword)
    await tx.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        resetPasswordOtp: null,
        resetPasswordExpiresAt: null,
        refreshToken: null, // Bắt đăng nhập lại
      },
    })

    return { message: "Mật khẩu đã được đặt lại thành công" }
  })
}

/**
 * Delete Account - Permanently remove user and all associated data
 */
export async function deleteAccountService(
  server: FastifyInstance,
  userId: string
) {
  const prisma: PrismaClient = server.prisma
  
  // Xóa tài khoản (Prisma onDelete: Cascade sẽ tự dọn các bảng liên quan)
  await prisma.user.delete({
    where: { id: userId },
  })
}

// ─── Internal helpers ────────────────────────────────────────────────
async function issueTokens(server: FastifyInstance, id: string, email: string) {
  const accessToken = server.jwt.sign({ id, email }, { expiresIn: "15m" })
  const refreshToken = server.jwt.sign({ id, email }, { expiresIn: "7d" })
  return { accessToken, refreshToken }
}
