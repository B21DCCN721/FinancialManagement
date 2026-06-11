import { z } from "zod"

const periodRegex = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Period must be YYYY-MM format e.g. 2026-06")

// ─── Request Schemas ────────────────────────────────────────────────
export const createBudgetSchema = z.object({
  amount: z.number().positive("Budget amount must be positive"),
  categoryId: z.string().uuid("Invalid category ID"),
  period: periodRegex,
})

export const updateBudgetSchema = z.object({
  amount: z.number().positive().optional(),
})

export const budgetParamsSchema = z.object({
  id: z.string().uuid("Invalid budget ID"),
})

export const budgetQuerySchema = z.object({
  period: periodRegex.optional(),
})

// ─── Response Schemas ────────────────────────────────────────────────
export const budgetSchema = z.object({
  id: z.string(),
  amount: z.number(),
  period: z.string(),
  userId: z.string(),
  categoryId: z.string(),
  category: z.object({
    id: z.string(),
    name: z.string(),
    color: z.string().nullable(),
    icon: z.string().nullable(),
  }).optional(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
})

export const budgetWithSpendingSchema = z.object({
  id: z.string(),
  amount: z.number(),
  period: z.string(),
  categoryId: z.string(),
  category: z.object({
    id: z.string(),
    name: z.string(),
    color: z.string().nullable(),
    icon: z.string().nullable(),
  }),
  spentAmount: z.number(),
  remaining: z.number(),
  percentUsed: z.number(),
  status: z.enum(["normal", "warning", "exceeded"]),
})

// ─── Types ──────────────────────────────────────────────────────────
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>
export type BudgetQuery = z.infer<typeof budgetQuerySchema>
