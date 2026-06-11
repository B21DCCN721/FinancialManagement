import { FastifyRequest, FastifyReply } from "fastify"
import {
  getAllTransactionsService, getTransactionByIdService,
  createTransactionService, updateTransactionService, deleteTransactionService,
  autoCategorizeService, stopRecurringService, processRecurringTransactionsService,
} from "./transactions.service"
import { CreateTransactionInput, UpdateTransactionInput, TransactionQuery } from "./transactions.schema"
import { handleError } from "../../utils/errors"

export async function getAllTransactionsController(
  request: FastifyRequest<{ Querystring: TransactionQuery }>,
  reply: FastifyReply
) {
  try {
    return reply.send(await getAllTransactionsService(request.server, request.user.id, request.query))
  } catch (err) { return handleError(err, reply) }
}

export async function getTransactionByIdController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    return reply.send(await getTransactionByIdService(request.server, request.user.id, request.params.id))
  } catch (err) { return handleError(err, reply) }
}

export async function createTransactionController(
  request: FastifyRequest<{ Body: CreateTransactionInput }>,
  reply: FastifyReply
) {
  try {
    return reply.code(201).send(await createTransactionService(request.server, request.user.id, request.body))
  } catch (err) { return handleError(err, reply) }
}

export async function updateTransactionController(
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateTransactionInput }>,
  reply: FastifyReply
) {
  try {
    return reply.send(await updateTransactionService(request.server, request.user.id, request.params.id, request.body))
  } catch (err) { return handleError(err, reply) }
}

export async function deleteTransactionController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    await deleteTransactionService(request.server, request.user.id, request.params.id)
    return reply.send({ message: "Transaction deleted" })
  } catch (err) { return handleError(err, reply) }
}

export const autoCategorizeController = async (
  request: FastifyRequest<{ Body: { description: string } }>,
  reply: FastifyReply
) => {
  try {
    const result = await autoCategorizeService(request.server, request.user.id, request.body.description)
    return reply.code(200).send(result)
  } catch (err) { return handleError(err, reply) }
}

/**
 * POST /api/transactions/:id/stop-recurring
 * Stop a recurring transaction (sets isRecurring=false, clears frequency & schedule).
 */
export async function stopRecurringController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    const tx = await stopRecurringService(request.server, request.user.id, request.params.id)
    return reply.send(tx)
  } catch (err) { return handleError(err, reply) }
}

/**
 * POST /api/transactions/process-recurring
 * Manually trigger recurring transaction processing (useful for testing / admin).
 */
export async function processRecurringController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    await processRecurringTransactionsService(request.server)
    return reply.send({ message: "Recurring transactions processed successfully" })
  } catch (err) { return handleError(err, reply) }
}
