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
    // 1. Verify token structure and expiration
    await request.jwtVerify()

    // 2. Verify that the user actually exists in the database
    // This handles cases where a user was deleted but their token hasn't expired yet
    const user = await request.server.prisma.user.findUnique({
      where: { id: request.user.id },
      select: { id: true } // Only select ID for performance
    })

    if (!user) {
      reply.code(401).send({ 
        statusCode: 401, 
        message: "Unauthorized: User account no longer exists" 
      })
      return
    }

  } catch (err: any) {
    // 3. Provide more granular and helpful error messages
    if (err.code === 'FST_JWT_NO_AUTHORIZATION_IN_HEADER') {
      reply.code(401).send({ statusCode: 401, message: "Unauthorized: Missing token in header" })
      return
    }
    
    if (err.code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED') {
      reply.code(401).send({ statusCode: 401, message: "Unauthorized: Token has expired" })
      return
    }

    reply.code(401).send({ statusCode: 401, message: "Unauthorized: Invalid token" })
  }
}
