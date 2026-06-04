import { FastifyInstance, FastifyPluginAsync } from "fastify"
import { ZodTypeProvider } from "fastify-type-provider-zod"
import {
  reportQuerySchema, monthlyTrendQuerySchema,
  summarySchema, monthlyTrendItemSchema,
  categoryBreakdownItemSchema, cashFlowItemSchema,
} from "./reports.schema"
import {
  getSummaryController, getMonthlyTrendController,
  getCategoryBreakdownController, getCashFlowController,
} from "./reports.controller"
import { authenticate } from "../../hooks/authenticate"
import { z } from "zod"

export const reportRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  const s = server.withTypeProvider<ZodTypeProvider>()
  s.addHook("preHandler", authenticate)

  // GET /api/reports/summary?period=2026-06
  s.get("/summary", {
    schema: {
      querystring: reportQuerySchema,
      response: { 200: summarySchema },
    },
  }, getSummaryController)

  // GET /api/reports/monthly-trend?months=6
  s.get("/monthly-trend", {
    schema: {
      querystring: monthlyTrendQuerySchema,
      response: { 200: z.array(monthlyTrendItemSchema) },
    },
  }, getMonthlyTrendController)

  // GET /api/reports/category-breakdown?period=2026-06
  s.get("/category-breakdown", {
    schema: {
      querystring: reportQuerySchema,
      response: { 200: z.array(categoryBreakdownItemSchema) },
    },
  }, getCategoryBreakdownController)

  // GET /api/reports/cash-flow?period=2026-06
  s.get("/cash-flow", {
    schema: {
      querystring: reportQuerySchema,
      response: { 200: z.array(cashFlowItemSchema) },
    },
  }, getCashFlowController)
}
