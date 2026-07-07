import { FastifyInstance, FastifyPluginAsync } from "fastify"
import { ZodTypeProvider } from "fastify-type-provider-zod"
import {
  registerSchema, loginSchema, googleLoginSchema, refreshTokenSchema,
  authResponseSchema, refreshResponseSchema,
  forgotPasswordSchema, resetPasswordSchema
} from "./auth.schema"
import {
  registerController, loginController, googleLoginController,
  refreshController, logoutController,
  forgotPasswordController, resetPasswordController
} from "./auth.controller"
import { authenticate } from "../../hooks/authenticate"
import { authRateLimit, strictRateLimit } from "../../plugins/rateLimit"
import { z } from "zod"

const errorSchema = z.object({ statusCode: z.number(), message: z.string() })

export const authRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  const s = server.withTypeProvider<ZodTypeProvider>()

  // POST /api/auth/register
  s.post("/register", {
    ...strictRateLimit,
    schema: {
      body: registerSchema,
      response: { 201: authResponseSchema, 400: errorSchema, 409: errorSchema },
    },
  }, registerController)

  // POST /api/auth/login
  s.post("/login", {
    ...authRateLimit,
    schema: {
      body: loginSchema,
      response: { 200: authResponseSchema, 401: errorSchema },
    },
  }, loginController)

  // POST /api/auth/google
  s.post("/google", {
    ...authRateLimit,
    schema: {
      body: googleLoginSchema,
      response: { 200: authResponseSchema, 401: errorSchema },
    },
  }, googleLoginController)

  // POST /api/auth/refresh
  s.post("/refresh", {
    ...authRateLimit,
    schema: {
      body: refreshTokenSchema,
      response: { 200: refreshResponseSchema, 401: errorSchema },
    },
  }, refreshController)

  // POST /api/auth/forgot-password
  s.post("/forgot-password", {
    ...strictRateLimit, // restrict rate to prevent email spam
    schema: {
      body: forgotPasswordSchema,
      response: { 200: z.object({ message: z.string() }), 400: errorSchema },
    },
  }, forgotPasswordController)

  // POST /api/auth/reset-password
  s.post("/reset-password", {
    ...strictRateLimit,
    schema: {
      body: resetPasswordSchema,
      response: { 200: z.object({ message: z.string() }), 400: errorSchema },
    },
  }, resetPasswordController)

  // POST /api/auth/logout  (protected)
  s.post("/logout", {
    preHandler: [authenticate],
    schema: {
      response: { 200: z.object({ message: z.string() }) },
    },
  }, logoutController)


}
