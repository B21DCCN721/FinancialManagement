import { PrismaClient } from "@prisma/client"
import Redis from "ioredis"
import "@fastify/jwt"

declare module "fastify" {
  interface FastifyInstance {
    prisma: PrismaClient
    redis: Redis
  }
}

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { id: string; email: string }
    user: { id: string; email: string }
  }
}

