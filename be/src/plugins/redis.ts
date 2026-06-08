import fp from "fastify-plugin"
import Redis from "ioredis"
import { env } from "../config/env"

export default fp(async (fastify) => {
  const redis = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    enableReadyCheck: true,
    maxRetriesPerRequest: 3,
    connectTimeout: 10000, // Timeout after 10s if can't connect
    keepAlive: 10000, // Keep alive to prevent connection drops
    retryStrategy: (times) => {
      // Exponential backoff with a cap of 5000ms
      return Math.min(times * 200, 5000);
    },
  })

  // Add event listeners for better observability
  redis.on("error", (err) => {
    fastify.log.error({ err }, "Redis connection error")
  })

  redis.on("ready", () => {
    fastify.log.info("Redis connection ready")
  })

  redis.on("reconnecting", () => {
    fastify.log.warn("Redis reconnecting")
  })

  await redis.connect()

  fastify.decorate("redis", redis)

  fastify.addHook("onClose", async (server) => {
    try {
      await server.redis.quit()
      server.log.info("Redis connection closed gracefully")
    } catch (err) {
      server.log.error({ err }, "Error closing Redis connection")
    }
  })
}, { name: "redis" })
