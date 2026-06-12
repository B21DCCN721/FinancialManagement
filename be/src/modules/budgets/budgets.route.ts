import { FastifyInstance, FastifyPluginAsync } from "fastify"
import { ZodTypeProvider } from "fastify-type-provider-zod"
import {
  createBudgetSchema, updateBudgetSchema, budgetParamsSchema,
  budgetQuerySchema, budgetSchema, budgetWithSpendingSchema,
} from "./budgets.schema"
import {
  getAllBudgetsController, getBudgetSummaryController,
  upsertBudgetController, updateBudgetController, deleteBudgetController,
} from "./budgets.controller"
import { authenticate } from "../../hooks/authenticate"
import { z } from "zod"

const errorSchema = z.object({ statusCode: z.number(), message: z.string() })
const msgSchema = z.object({ message: z.string() })
const periodQuerySchema = z.object({
  period: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).optional(),
})

export const budgetRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  const s = server.withTypeProvider<ZodTypeProvider>()
  s.addHook("preHandler", authenticate)

  // GET /api/budgets?period=2026-06
  s.get("/", {
    schema: {
      querystring: budgetQuerySchema,
      response: { 200: z.array(budgetSchema) },
    },
  }, getAllBudgetsController)

  // GET /api/budgets/summary?period=2026-06
  s.get("/summary", {
    schema: {
      querystring: budgetQuerySchema,
      response: { 200: z.array(budgetWithSpendingSchema) },
    },
  }, getBudgetSummaryController)

  // POST /api/budgets  (upsert by userId+categoryId+period)
  s.post("/", {
    schema: {
      body: createBudgetSchema,
      response: { 200: budgetSchema, 400: errorSchema, 404: errorSchema },
    },
  }, upsertBudgetController)

  // PATCH /api/budgets/:id
  s.patch("/:id", {
    schema: {
      params: budgetParamsSchema,
      body: updateBudgetSchema,
      response: { 200: budgetSchema, 404: errorSchema },
    },
  }, updateBudgetController)

  // DELETE /api/budgets/:id
  s.delete("/:id", {
    schema: {
      params: budgetParamsSchema,
      response: { 200: msgSchema, 404: errorSchema },
    },
  }, deleteBudgetController)
}
