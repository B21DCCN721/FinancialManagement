import { FastifyRequest, FastifyReply } from "fastify"
import { getMeService, updateProfileService, changePasswordService, deleteAccountService } from "./users.service"
import { UpdateProfileInput, ChangePasswordInput } from "./users.schema"
import { AppError } from "../../utils/errors"

function handleError(err: unknown, reply: FastifyReply) {
  if (err instanceof AppError) {
    return reply.code(err.statusCode).send({ statusCode: err.statusCode, message: err.message })
  }
  throw err
}

export async function getMeController(request: FastifyRequest, reply: FastifyReply) {
  try {
    const result = await getMeService(request.server, request.user.id)
    return reply.send(result)
  } catch (err) { return handleError(err, reply) }
}

export async function updateProfileController(
  request: FastifyRequest<{ Body: UpdateProfileInput }>,
  reply: FastifyReply
) {
  try {
    const result = await updateProfileService(request.server, request.user.id, request.body)
    return reply.send(result)
  } catch (err) { return handleError(err, reply) }
}

export async function changePasswordController(
  request: FastifyRequest<{ Body: ChangePasswordInput }>,
  reply: FastifyReply
) {
  try {
    await changePasswordService(request.server, request.user.id, request.body)
    return reply.send({ message: "Password changed successfully. Please log in again." })
  } catch (err) { return handleError(err, reply) }
}

export async function deleteAccountController(request: FastifyRequest, reply: FastifyReply) {
  try {
    await deleteAccountService(request.server, request.user.id)
    return reply.code(200).send({ message: "Account deleted successfully" })
  } catch (err) { return handleError(err, reply) }
}
