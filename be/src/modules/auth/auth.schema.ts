import { z } from "zod"

// ─── Request Schemas ────────────────────────────────────────────────
export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  name: z.string().min(1, "Name is required").max(100),
  confirmLink: z.boolean().optional(),
})

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

export const googleLoginSchema = z.object({
  token: z.string().min(1, "Google/Firebase token is required"),
  confirmLink: z.boolean().optional(),
})

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
})

export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "OTP must be 6 characters"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
})

// ─── Response Schemas ────────────────────────────────────────────────
const userPublicSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string().nullable(),
  authProvider: z.string(),
  createdAt: z.union([z.date(), z.string()]),
})

export const authResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  user: userPublicSchema,
})

export const refreshResponseSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
})

// ─── Types ──────────────────────────────────────────────────────────
export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>
