import { z } from "zod"

const isoDate = z.string().datetime({ message: "Date must be a valid ISO 8601 datetime" })

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
  limit: z.coerce.number().int().min(1).max(10000).default(20),
  type: z.enum(["income", "expense"]).optional(),
  categoryId: z.string().uuid().optional(),
  dateFrom: isoDate.optional(),
  dateTo: isoDate.optional(),
  search: z.string().max(100).optional(),
  isRecurring: z.preprocess(
    (val) => {
      if (typeof val === "string") {
        if (val.toLowerCase() === "true") return true;
        if (val.toLowerCase() === "false") return false;
      }
      return val;
    },
    z.boolean().optional()
  ),
})

// ─── Response Schemas ────────────────────────────────────────────────
export const transactionSchema = z.object({
  id: z.string(),
  amount: z.number(),
  type: z.string(),
  description: z.string().nullable(),
  date: z.union([z.date(), z.string()]),
  isRecurring: z.boolean(),
  frequency: z.string().nullable(),
  nextRunAt: z.union([z.date(), z.string()]).nullable().optional(),
  lastProcessedAt: z.union([z.date(), z.string()]).nullable().optional(),
  userId: z.string(),
  categoryId: z.string(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
  category: z.object({
    id: z.string(),
    name: z.string(),
    color: z.string().nullable().optional(),
    icon: z.string().nullable().optional(),
  }).optional(),
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

export const scanReceiptResponseSchema = z.object({
  amount: z.number().nullable(),
  description: z.string().nullable(),
  date: z.string().nullable(),
  rawText: z.string(),
})

// ─── Types ──────────────────────────────────────────────────────────
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>
export type TransactionQuery = z.infer<typeof transactionQuerySchema>
