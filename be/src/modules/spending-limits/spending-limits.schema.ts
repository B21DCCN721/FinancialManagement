import { z } from "zod"

export const upsertSpendingLimitSchema = z.object({
  amount: z.number().positive("Limit amount must be positive"),
  type: z.enum(["daily", "weekly", "monthly"]),
})

export const spendingLimitQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format").optional(),
})

export const spendingLimitSchema = z.object({
  id: z.string().optional(),
  amount: z.number().nullable(),
  type: z.enum(["daily", "weekly", "monthly"]),
  userId: z.string(),
  spentAmount: z.number(),
  remaining: z.number().nullable(),
  percentUsed: z.number(),
  status: z.enum(["normal", "warning", "exceeded"]),
  startDate: z.string(),
  endDate: z.string(),
})

export const spendingLimitDbSchema = z.object({
  id: z.string(),
  amount: z.number(),
  type: z.enum(["daily", "weekly", "monthly"]),
  userId: z.string(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
})


export type UpsertSpendingLimitInput = z.infer<typeof upsertSpendingLimitSchema>
export type SpendingLimitQuery = z.infer<typeof spendingLimitQuerySchema>
