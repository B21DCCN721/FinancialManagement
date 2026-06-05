import { z } from "zod"

const isoDate = z.string().datetime({ message: "Date must be a valid ISO 8601 datetime" })
const periodRegex = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Period must be YYYY-MM format")

// ─── Request Schemas ────────────────────────────────────────────────
export const createTransactionSchema = z.object({
  amount: z.number().positive("Amount must be a positive number"),
  type: z.enum(["income", "expense"]),
  description: z.string().max(500).optional(),
  date: isoDate,
  isRecurring: z.boolean().default(false),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]).optional().nullable(),
  categoryId: z.string().uuid("Invalid category ID"),
}).refine(
  (data) => !data.isRecurring || data.frequency,
  { message: "Frequency is required when isRecurring is true", path: ["frequency"] }
)

export const updateTransactionSchema = z.object({
  amount: z.number().positive().optional(),
  type: z.enum(["income", "expense"]).optional(),
  description: z.string().max(500).optional().nullable(),
  date: isoDate.optional(),
  isRecurring: z.boolean().optional(),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]).optional().nullable(),
  categoryId: z.string().uuid().optional(),
})

export const transactionParamsSchema = z.object({
  id: z.string().uuid("Invalid transaction ID"),
})

export const autoCategorizeSchema = z.object({
  description: z.string().min(1, "Description is required"),
})

export const transactionQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(["income", "expense"]).optional(),
  categoryId: z.string().uuid().optional(),
  dateFrom: isoDate.optional(),
  dateTo: isoDate.optional(),
  search: z.string().max(100).optional(),
})

// ─── Response Schemas ────────────────────────────────────────────────
export const transactionSchema = z.object({
  id: z.string(),
  amount: z.number(),
  type: z.string(),
  description: z.string().nullable(),
  date: z.date(),
  isRecurring: z.boolean(),
  frequency: z.string().nullable(),
  userId: z.string(),
  categoryId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const paginatedTransactionsSchema = z.object({
  data: z.array(transactionSchema),
  pagination: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  }),
})

export const autoCategorizeResponseSchema = z.object({
  categoryId: z.string().uuid().nullable(),
  categoryName: z.string().nullable(),
  type: z.string().nullable(),
})

// ─── Types ──────────────────────────────────────────────────────────
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
export type TransactionQuery = z.infer<typeof transactionQuerySchema>
