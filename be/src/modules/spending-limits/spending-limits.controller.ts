import { FastifyRequest, FastifyReply } from "fastify"
import {
  getSpendingLimitsService,
  upsertSpendingLimitService,
  deleteSpendingLimitService,
} from "./spending-limits.service"
import { UpsertSpendingLimitInput, SpendingLimitQuery } from "./spending-limits.schema"
import { handleError } from "../../utils/errors"

export async function getSpendingLimitsController(
  request: FastifyRequest<{ Querystring: SpendingLimitQuery }>,
  reply: FastifyReply
) {
  try {
    const limits = await getSpendingLimitsService(request.server, request.user.id, request.query)
    return reply.send(limits)
  } catch (err) {
    return handleError(err, reply)
  }
}

export async function upsertSpendingLimitController(
  request: FastifyRequest<{ Body: UpsertSpendingLimitInput }>,
  reply: FastifyReply
) {
  try {
    const limit = await upsertSpendingLimitService(request.server, request.user.id, request.body)
    return reply.send(limit)
  } catch (err) {
    return handleError(err, reply)
  }
}

export async function deleteSpendingLimitController(
  request: FastifyRequest<{ Params: { type: "daily" | "weekly" | "monthly" }; Querystring: { period: string } }>,
  reply: FastifyReply
) {
  try {
    const res = await deleteSpendingLimitService(
      request.server,
      request.user.id,
      request.params.type,
      request.query.period
    )
    return reply.send(res)
  } catch (err) {
    return handleError(err, reply)
  }
}
