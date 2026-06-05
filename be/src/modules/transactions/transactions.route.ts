import { FastifyInstance, FastifyPluginAsync } from "fastify"
import { ZodTypeProvider } from "fastify-type-provider-zod"
import {
  createTransactionSchema, updateTransactionSchema,
  transactionParamsSchema, transactionQuerySchema,
  transactionSchema, paginatedTransactionsSchema,
  autoCategorizeSchema, autoCategorizeResponseSchema
} from "./transactions.schema"
import {
  getAllTransactionsController, getTransactionByIdController,
  createTransactionController, updateTransactionController, deleteTransactionController,
  autoCategorizeController
} from "./transactions.controller"
import { authenticate } from "../../hooks/authenticate"
import { z } from "zod"

const errorSchema = z.object({ statusCode: z.number(), message: z.string() })
const msgSchema = z.object({ message: z.string() })

export const transactionRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  const s = server.withTypeProvider<ZodTypeProvider>()
  s.addHook("preHandler", authenticate)

  // GET /api/transactions?page=1&limit=20&type=expense&...
  s.get("/", {
    schema: {
      querystring: transactionQuerySchema,
      response: { 200: paginatedTransactionsSchema },
    },
  }, getAllTransactionsController)

  // GET /api/transactions/:id
  s.get("/:id", {
    schema: {
      params: transactionParamsSchema,
      response: { 200: transactionSchema, 404: errorSchema },
    },
  }, getTransactionByIdController)

  // POST /api/transactions
  s.post("/", {
    schema: {
      body: createTransactionSchema,
      response: { 201: transactionSchema, 400: errorSchema, 404: errorSchema },
    },
  }, createTransactionController)

  // POST /api/transactions/auto-categorize
  s.post("/auto-categorize", {
    schema: {
      body: autoCategorizeSchema,
      response: { 200: autoCategorizeResponseSchema },
    },
  }, autoCategorizeController)

  // PATCH /api/transactions/:id
  s.patch("/:id", {
    schema: {
      params: transactionParamsSchema,
      body: updateTransactionSchema,
      response: { 200: transactionSchema, 404: errorSchema },
    },
  }, updateTransactionController)

  // DELETE /api/transactions/:id
  s.delete("/:id", {
    schema: {
      params: transactionParamsSchema,
      response: { 200: msgSchema, 404: errorSchema },
    },
  }, deleteTransactionController)
}
