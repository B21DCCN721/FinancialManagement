import { FastifyRequest, FastifyReply } from "fastify"

/**
 * Reusable preHandler hook to verify JWT on protected routes.
 * Usage: { preHandler: [authenticate] }
 */
export async function authenticate(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    await request.jwtVerify()
  } catch {
    reply.code(401).send({ statusCode: 401, message: "Unauthorized: invalid or expired token" })
  }
}
