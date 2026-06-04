import fp from "fastify-plugin"
import rateLimit from "@fastify/rate-limit"

export default fp(async (fastify) => {
  await fastify.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: "1 minute",
    redis: fastify.redis,
    keyGenerator: (request) => {
      return request.ip
    },
    errorResponseBuilder: (_request, context) => ({
      statusCode: 429,
      message: `Too many requests. Please try again after ${Math.ceil(context.ttl / 1000)} seconds.`,
      error: "Too Many Requests",
    }),
  })
}, { name: "rate-limit", dependencies: ["redis"] })

// Per-route config helpers
export const authRateLimit = {
  config: {
    rateLimit: {
      max: 10,
      timeWindow: "15 minutes",
    },
  },
}

export const strictRateLimit = {
  config: {
    rateLimit: {
      max: 5,
      timeWindow: "15 minutes",
    },
  },
}
