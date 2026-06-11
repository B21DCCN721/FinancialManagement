import { FastifyRequest, FastifyReply } from "fastify"
import {
  getSummaryService, getMonthlyTrendService,
  getCategoryBreakdownService, getCashFlowService, getBalanceService,
} from "./reports.service"

function currentPeriod() {
  return new Date().toISOString().slice(0, 7)
}

export async function getSummaryController(
  request: FastifyRequest<{ Querystring: { period?: string } }>,
  reply: FastifyReply
) {
  const period = request.query.period ?? currentPeriod()
  return reply.send(await getSummaryService(request.server, request.user.id, period))
}

export async function getMonthlyTrendController(
  request: FastifyRequest<{ Querystring: { months?: number } }>,
  reply: FastifyReply
) {
  const months = Number(request.query.months ?? 6)
  return reply.send(await getMonthlyTrendService(request.server, request.user.id, months))
}

export async function getCategoryBreakdownController(
  request: FastifyRequest<{ Querystring: { period?: string } }>,
  reply: FastifyReply
) {
  const period = request.query.period ?? currentPeriod()
  return reply.send(await getCategoryBreakdownService(request.server, request.user.id, period))
}

export async function getCashFlowController(
  request: FastifyRequest<{ Querystring: { period?: string } }>,
  reply: FastifyReply
) {
  const period = request.query.period ?? currentPeriod()
  return reply.send(await getCashFlowService(request.server, request.user.id, period))
}

export async function getAiInsightsController(
  request: FastifyRequest<{ Querystring: { period?: string } }>,
  reply: FastifyReply
) {
  const period = request.query.period ?? currentPeriod()
  // dynamically import or require the ai service to avoid circular deps or keep it simple
  const { getAiInsightsService } = await import("./ai.service")
  return reply.send(await getAiInsightsService(request.server, request.user.id, period))
}

export async function getBalanceController(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    return reply.send(await getBalanceService(request.server, request.user.id))
  } catch (err) {
    const { handleError } = await import("../../utils/errors")
    return handleError(err, reply)
  }
}
