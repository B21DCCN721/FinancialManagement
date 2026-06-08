import { z } from "zod"

const periodRegex = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Period must be YYYY-MM")

export const reportQuerySchema = z.object({
  period: periodRegex.optional(),
})

export const monthlyTrendQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(24).default(6),
})

export const summarySchema = z.object({
  period: z.string(),
  totalIncome: z.number(),
  totalExpense: z.number(),
  netBalance: z.number(),
  transactionCount: z.number(),
})

export const monthlyTrendItemSchema = z.object({
  period: z.string(),
  income: z.number(),
  expense: z.number(),
  net: z.number(),
})

export const categoryBreakdownItemSchema = z.object({
  categoryId: z.string(),
  categoryName: z.string(),
  categoryColor: z.string().nullable(),
  categoryIcon: z.string().nullable(),
  type: z.string(),
  totalAmount: z.number(),
  transactionCount: z.number(),
  percentage: z.number(),
})

export const cashFlowItemSchema = z.object({
  date: z.string(),
  income: z.number(),
  expense: z.number(),
  net: z.number(),
})

export const aiInsightsSchema = z.object({
  period: z.string(),
  generatedAt: z.string(),
  insights: z.string(),
})
