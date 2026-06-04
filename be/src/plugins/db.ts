import fp from "fastify-plugin"
import { PrismaClient } from "@prisma/client"

export default fp(async (fastify) => {
  const prisma = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"],
  })

  await prisma.$connect()
  fastify.decorate("prisma", prisma)

  fastify.addHook("onClose", async (server) => {
    await server.prisma.$disconnect()
  })
}, { name: "prisma" })
