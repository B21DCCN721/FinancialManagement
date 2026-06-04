import fp from "fastify-plugin"
import Redis from "ioredis"
import { env } from "../config/env"

export default fp(async (fastify) => {
  const redis = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    enableReadyCheck: true,
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => Math.min(times * 100, 3000),
  })

  await redis.connect()

  fastify.decorate("redis", redis)

  fastify.addHook("onClose", async (server) => {
    await server.redis.quit()
  })
}, { name: "redis" })
