import { FastifyInstance, FastifyPluginAsync } from "fastify"
import { ZodTypeProvider } from "fastify-type-provider-zod"
import {
  createGoalSchema, updateGoalSchema, contributeGoalSchema, withdrawGoalSchema,
  goalParamsSchema, goalSchema,
} from "./goals.schema"
import {
  getAllGoalsController, createGoalController,
  updateGoalController, contributeGoalController, withdrawGoalController, deleteGoalController,
} from "./goals.controller"
import { authenticate } from "../../hooks/authenticate"
import { z } from "zod"

const errorSchema = z.object({ statusCode: z.number(), message: z.string() })
const msgSchema = z.object({ message: z.string() })

export const goalRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  const s = server.withTypeProvider<ZodTypeProvider>()
  s.addHook("preHandler", authenticate)

  // GET /api/goals
  s.get("/", {
    schema: { response: { 200: z.array(goalSchema) } },
  }, getAllGoalsController)

  // POST /api/goals
  s.post("/", {
    schema: {
      body: createGoalSchema,
      response: { 201: goalSchema, 400: errorSchema },
    },
  }, createGoalController)

  // PATCH /api/goals/:id
  s.patch("/:id", {
    schema: {
      params: goalParamsSchema,
      body: updateGoalSchema,
      response: { 200: goalSchema, 404: errorSchema },
    },
  }, updateGoalController)

  // POST /api/goals/:id/contribute
  s.post("/:id/contribute", {
    schema: {
      params: goalParamsSchema,
      body: contributeGoalSchema,
      response: { 200: goalSchema, 400: errorSchema, 404: errorSchema },
    },
  }, contributeGoalController)

  // POST /api/goals/:id/withdraw
  s.post("/:id/withdraw", {
    schema: {
      params: goalParamsSchema,
      body: withdrawGoalSchema,
      response: { 200: goalSchema, 400: errorSchema, 404: errorSchema },
    },
  }, withdrawGoalController)

  // DELETE /api/goals/:id
  s.delete("/:id", {
    schema: {
      params: goalParamsSchema,
      response: { 200: msgSchema, 404: errorSchema },
    },
  }, deleteGoalController)
}
