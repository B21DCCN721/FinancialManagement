import { FastifyRequest, FastifyReply } from "fastify"
import { registerService, loginService, refreshService, logoutService } from "./auth.service"
import { RegisterInput, LoginInput, RefreshTokenInput } from "./auth.schema"
import { AppError } from "../../utils/errors"

export async function registerController(
  request: FastifyRequest<{ Body: RegisterInput }>,
  reply: FastifyReply
) {
  try {
    const result = await registerService(request.server, request.body)
    return reply.code(201).send(result)
  } catch (err) {
    if (err instanceof AppError) {
      return reply.code(err.statusCode).send({ statusCode: err.statusCode, message: err.message })
    }
    throw err
  }
}

export async function loginController(
  request: FastifyRequest<{ Body: LoginInput }>,
  reply: FastifyReply
) {
  try {
    const result = await loginService(request.server, request.body)
    return reply.code(200).send(result)
  } catch (err) {
    if (err instanceof AppError) {
      return reply.code(err.statusCode).send({ statusCode: err.statusCode, message: err.message })
    }
    throw err
  }
}

export async function refreshController(
  request: FastifyRequest<{ Body: RefreshTokenInput }>,
  reply: FastifyReply
) {
  try {
    const result = await refreshService(request.server, request.body.refreshToken)
    return reply.code(200).send(result)
  } catch (err) {
    if (err instanceof AppError) {
      return reply.code(err.statusCode).send({ statusCode: err.statusCode, message: err.message })
    }
    throw err
  }
}

export async function logoutController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  await logoutService(request.server, request.user.id)
  return reply.code(200).send({ message: "Logged out successfully" })
}
