import { FastifyRequest, FastifyReply } from "fastify"
import { registerService, loginService, googleLoginService, refreshService, logoutService, forgotPasswordService, resetPasswordService } from "./auth.service"
import { RegisterInput, LoginInput, GoogleLoginInput, RefreshTokenInput, ForgotPasswordInput, ResetPasswordInput } from "./auth.schema"
import { handleError } from "../../utils/errors"

export async function registerController(
  request: FastifyRequest<{ Body: RegisterInput }>,
  reply: FastifyReply
) {
  try {
    const result = await registerService(request.server, request.body)
    return reply.code(201).send(result)
  } catch (err) {
    return handleError(err, reply)
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
    return handleError(err, reply)
  }
}

export async function googleLoginController(
  request: FastifyRequest<{ Body: GoogleLoginInput }>,
  reply: FastifyReply
) {
  try {
    const result = await googleLoginService(request.server, request.body.token, request.body.confirmLink)
    return reply.code(200).send(result)
  } catch (err) {
    return handleError(err, reply)
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
    return handleError(err, reply)
  }
}

export async function forgotPasswordController(
  request: FastifyRequest<{ Body: ForgotPasswordInput }>,
  reply: FastifyReply
) {
  try {
    const result = await forgotPasswordService(request.server, request.body)
    return reply.code(200).send(result)
  } catch (err) {
    return handleError(err, reply)
  }
}

export async function resetPasswordController(
  request: FastifyRequest<{ Body: ResetPasswordInput }>,
  reply: FastifyReply
) {
  try {
    const result = await resetPasswordService(request.server, request.body)
    return reply.code(200).send(result)
  } catch (err) {
    return handleError(err, reply)
  }
}

export async function logoutController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  await logoutService(request.server, request.user.id)
  return reply.code(200).send({ message: "Logged out successfully" })
}

