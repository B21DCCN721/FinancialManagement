import fp from "fastify-plugin"
import { PrismaClient } from "@prisma/client"
import { env } from "../config/env"

export default fp(async (fastify) => {
  const prisma = new PrismaClient({
    log: env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
  })

  try {
    await prisma.$connect()
    fastify.log.info("Database connected successfully")
  } catch (err) {
    fastify.log.error({ err }, "Failed to connect to the database")
    throw err
  }

  fastify.decorate("prisma", prisma)

  fastify.addHook("onClose", async (server) => {
    try {
      await server.prisma.$disconnect()
      server.log.info("Database connection closed gracefully")
    } catch (err) {
      server.log.error({ err }, "Error closing Database connection")
    }
  })
}, { name: "prisma" })
