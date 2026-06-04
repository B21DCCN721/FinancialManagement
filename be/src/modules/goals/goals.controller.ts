import { FastifyRequest, FastifyReply } from "fastify"
import {
  getAllGoalsService, createGoalService,
  updateGoalService, contributeToGoalService, deleteGoalService,
} from "./goals.service"
import { CreateGoalInput, UpdateGoalInput, ContributeGoalInput } from "./goals.schema"
import { AppError } from "../../utils/errors"

function handleError(err: unknown, reply: FastifyReply) {
  if (err instanceof AppError) return reply.code(err.statusCode).send({ statusCode: err.statusCode, message: err.message })
  throw err
}

export async function getAllGoalsController(request: FastifyRequest, reply: FastifyReply) {
  try {
    return reply.send(await getAllGoalsService(request.server, request.user.id))
  } catch (err) { return handleError(err, reply) }
}

export async function createGoalController(
  request: FastifyRequest<{ Body: CreateGoalInput }>,
  reply: FastifyReply
) {
  try {
    return reply.code(201).send(await createGoalService(request.server, request.user.id, request.body))
  } catch (err) { return handleError(err, reply) }
}

export async function updateGoalController(
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateGoalInput }>,
  reply: FastifyReply
) {
  try {
    return reply.send(await updateGoalService(request.server, request.user.id, request.params.id, request.body))
  } catch (err) { return handleError(err, reply) }
}

export async function contributeGoalController(
  request: FastifyRequest<{ Params: { id: string }; Body: ContributeGoalInput }>,
  reply: FastifyReply
) {
  try {
    return reply.send(await contributeToGoalService(request.server, request.user.id, request.params.id, request.body))
  } catch (err) { return handleError(err, reply) }
}

export async function deleteGoalController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    await deleteGoalService(request.server, request.user.id, request.params.id)
    return reply.send({ message: "Goal deleted" })
  } catch (err) { return handleError(err, reply) }
}
