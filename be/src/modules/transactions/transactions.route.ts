import { FastifyInstance, FastifyPluginAsync } from "fastify"
import { ZodTypeProvider } from "fastify-type-provider-zod"
import multipart from "@fastify/multipart"
import {
  createTransactionSchema, updateTransactionSchema,
  transactionParamsSchema, transactionQuerySchema,
  transactionSchema, paginatedTransactionsSchema,
  autoCategorizeSchema, autoCategorizeResponseSchema,
  scanReceiptResponseSchema,
} from "./transactions.schema"
import {
  getAllTransactionsController, getTransactionByIdController,
  createTransactionController, updateTransactionController, deleteTransactionController,
  autoCategorizeController, stopRecurringController, processRecurringController,
  scanReceiptController,
} from "./transactions.controller"
import { authenticate } from "../../hooks/authenticate"
import { z } from "zod"

const errorSchema = z.object({ statusCode: z.number(), message: z.string() })
const msgSchema = z.object({ message: z.string() })

export const transactionRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  const s = server.withTypeProvider<ZodTypeProvider>()
  s.addHook("preHandler", authenticate)

  // GET /api/transactions?page=1&limit=20&type=expense&isRecurring=true&...
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

  // POST /api/transactions/process-recurring (manual trigger for admin/testing)
  s.post("/process-recurring", {
    schema: {
      response: { 200: msgSchema },
    },
  }, processRecurringController)

  // POST /api/transactions/scan-receipt — OCR hóa đơn bằng Google Vision
  // Dùng server.post (không dùng s.post) vì multipart không tương thích với Zod body schema
  server.post("/scan-receipt", {
    config: { rateLimit: { max: 10, timeWindow: "1 minute" } },
  }, scanReceiptController)

  // POST /api/transactions/:id/stop-recurring
  s.post("/:id/stop-recurring", {
    schema: {
      params: transactionParamsSchema,
      response: { 200: transactionSchema, 400: errorSchema, 404: errorSchema },
    },
  }, stopRecurringController)

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
