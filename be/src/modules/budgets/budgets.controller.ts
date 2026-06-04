import { FastifyRequest, FastifyReply } from "fastify"
import {
  getAllBudgetsService, getBudgetSummaryService,
  upsertBudgetService, updateBudgetService, deleteBudgetService,
} from "./budgets.service"
import { CreateBudgetInput, UpdateBudgetInput, BudgetQuery } from "./budgets.schema"
import { AppError } from "../../utils/errors"

function handleError(err: unknown, reply: FastifyReply) {
  if (err instanceof AppError) return reply.code(err.statusCode).send({ statusCode: err.statusCode, message: err.message })
  throw err
}

export async function getAllBudgetsController(
  request: FastifyRequest<{ Querystring: BudgetQuery }>,
  reply: FastifyReply
) {
  try {
    return reply.send(await getAllBudgetsService(request.server, request.user.id, request.query))
  } catch (err) { return handleError(err, reply) }
}

export async function getBudgetSummaryController(
  request: FastifyRequest<{ Querystring: { period: string } }>,
  reply: FastifyReply
) {
  try {
    const period = request.query.period ?? new Date().toISOString().slice(0, 7)
    return reply.send(await getBudgetSummaryService(request.server, request.user.id, period))
  } catch (err) { return handleError(err, reply) }
}

export async function upsertBudgetController(
  request: FastifyRequest<{ Body: CreateBudgetInput }>,
  reply: FastifyReply
) {
  try {
    return reply.code(200).send(await upsertBudgetService(request.server, request.user.id, request.body))
  } catch (err) { return handleError(err, reply) }
}

export async function updateBudgetController(
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateBudgetInput }>,
  reply: FastifyReply
) {
  try {
    return reply.send(await updateBudgetService(request.server, request.user.id, request.params.id, request.body))
  } catch (err) { return handleError(err, reply) }
}

export async function deleteBudgetController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    await deleteBudgetService(request.server, request.user.id, request.params.id)
    return reply.send({ message: "Budget deleted" })
  } catch (err) { return handleError(err, reply) }
}
