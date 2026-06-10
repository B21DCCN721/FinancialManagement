import "dotenv/config"
import Fastify from "fastify"
import cors from "@fastify/cors"
import jwt from "@fastify/jwt"
import helmet from "@fastify/helmet"
import compress from "@fastify/compress"
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from "fastify-type-provider-zod"

import { env } from "./config/env"
import dbPlugin from "./plugins/db"
import redisPlugin from "./plugins/redis"
import rateLimitPlugin from "./plugins/rateLimit"

import { authRoutes } from "./modules/auth/auth.route"
import { userRoutes } from "./modules/users/users.route"
import { categoryRoutes } from "./modules/categories/categories.route"
import { transactionRoutes } from "./modules/transactions/transactions.route"
import { budgetRoutes } from "./modules/budgets/budgets.route"
import { goalRoutes } from "./modules/goals/goals.route"
import { reportRoutes } from "./modules/reports/reports.route"
import { AppError } from "./utils/errors"

const server = Fastify({
  logger: {
    level: env.NODE_ENV === "production" ? "warn" : "info",
    transport: env.NODE_ENV !== "production"
      ? { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss" } }
      : undefined,
  },
}).withTypeProvider<ZodTypeProvider>()

// ─── Zod Compiler ────────────────────────────────────────────────────────────
server.setValidatorCompiler(validatorCompiler)
server.setSerializerCompiler(serializerCompiler)

// ─── Global Error Handler ─────────────────────────────────────────────────────
server.setErrorHandler((error: any, _request, reply) => {
  if (error instanceof AppError) {
    return reply.code(error.statusCode).send({ statusCode: error.statusCode, message: error.message })
  }

  // Zod/Fastify validation errors
  if (error.validation) {
    return reply.code(400).send({
      statusCode: 400,
      message: "Validation error",
      errors: error.validation,
    })
  }

  // Rate limit
  if (error.statusCode === 429) {
    return reply.code(429).send({ statusCode: 429, message: error.message })
  }

  server.log.error(error)
  return reply.code(500).send({ statusCode: 500, message: "Internal Server Error" })
})

// ─── 404 handler ─────────────────────────────────────────────────────────────
server.setNotFoundHandler((_request, reply) => {
  reply.code(404).send({ statusCode: 404, message: "Route not found" })
})

// ─── Plugins ─────────────────────────────────────────────────────────────────
server.register(helmet)
server.register(compress, { global: true })
server.register(cors, {
  origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
  credentials: true,
  methods: ["GET", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
})

server.register(jwt, {
  secret: env.JWT_SECRET,
})

server.register(dbPlugin)
server.register(redisPlugin)
server.register(rateLimitPlugin)

// ─── Routes ──────────────────────────────────────────────────────────────────
server.register(authRoutes,        { prefix: "/api/auth" })
server.register(userRoutes,        { prefix: "/api/users" })
server.register(categoryRoutes,    { prefix: "/api/categories" })
server.register(transactionRoutes, { prefix: "/api/transactions" })
server.register(budgetRoutes,      { prefix: "/api/budgets" })
server.register(goalRoutes,        { prefix: "/api/goals" })
server.register(reportRoutes,      { prefix: "/api/reports" })

// ─── Health Check ────────────────────────────────────────────────────────────
server.get("/api/health", {
  config: { rateLimit: { max: 200, timeWindow: "1 minute" } },
}, async (_request, _reply) => ({
  status: "ok",
  timestamp: new Date().toISOString(),
  uptime: process.uptime(),
  env: env.NODE_ENV,
}))

// ─── Bootstrap ───────────────────────────────────────────────────────────────
const start = async () => {
  try {
    await server.listen({ port: env.PORT, host: "0.0.0.0" })

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      server.log.info(`Received ${signal}, shutting down...`)
      await server.close()
      process.exit(0)
    }

    process.on("SIGINT", () => shutdown("SIGINT"))
    process.on("SIGTERM", () => shutdown("SIGTERM"))
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()
