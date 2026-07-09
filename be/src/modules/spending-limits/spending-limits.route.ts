import { FastifyInstance, FastifyPluginAsync } from "fastify"
import { ZodTypeProvider } from "fastify-type-provider-zod"
import {
  upsertSpendingLimitSchema,
  spendingLimitQuerySchema,
  spendingLimitSchema,
  spendingLimitDbSchema,
} from "./spending-limits.schema"
import {
  getSpendingLimitsController,
  upsertSpendingLimitController,
  deleteSpendingLimitController,
} from "./spending-limits.controller"
import { authenticate } from "../../hooks/authenticate"
import { z } from "zod"

const errorSchema = z.object({ statusCode: z.number(), message: z.string() })
const msgSchema = z.object({ message: z.string() })

export const spendingLimitRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  const s = server.withTypeProvider<ZodTypeProvider>()
  s.addHook("preHandler", authenticate)

  // GET /api/spending-limits?date=2026-07-09
  s.get("/", {
    schema: {
      querystring: spendingLimitQuerySchema,
      response: { 200: z.array(spendingLimitSchema) },
    },
  }, getSpendingLimitsController)

  // POST /api/spending-limits (upsert by type)
  s.post("/", {
    schema: {
      body: upsertSpendingLimitSchema,
      response: { 200: spendingLimitDbSchema, 400: errorSchema },
    },
  }, upsertSpendingLimitController)

  // DELETE /api/spending-limits/:type
  s.delete("/:type", {
    schema: {
      params: z.object({
        type: z.enum(["daily", "weekly", "monthly"]),
      }),
      response: { 200: msgSchema, 404: errorSchema },
    },
  }, deleteSpendingLimitController)
}
