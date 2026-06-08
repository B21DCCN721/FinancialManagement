import { z } from "zod"

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color e.g. #FF5733")

// ─── Request Schemas ────────────────────────────────────────────────
export const createGoalSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(500).optional(),
  targetAmount: z.number().positive("Target amount must be positive"),
  currentAmount: z.number().min(0).default(0),
  deadline: z.string().datetime({ message: "Deadline must be a valid ISO datetime" }),
  color: hexColor.optional(),
  icon: z.string().min(1).max(50).optional(),
}).refine(
  (data) => new Date(data.deadline) > new Date(),
  { message: "Deadline must be in the future", path: ["deadline"] }
)

export const updateGoalSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  targetAmount: z.number().positive().optional(),
  deadline: z.string().datetime().optional(),
  color: hexColor.optional().nullable(),
  icon: z.string().min(1).max(50).optional().nullable(),
})

export const contributeGoalSchema = z.object({
  amount: z.number().positive("Contribution amount must be positive"),
})

export const goalParamsSchema = z.object({
  id: z.string().uuid("Invalid goal ID"),
})

// ─── Response Schemas ────────────────────────────────────────────────
export const goalSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  targetAmount: z.number(),
  currentAmount: z.number(),
  deadline: z.union([z.date(), z.string()]),
  color: z.string().nullable(),
  icon: z.string().nullable(),
  userId: z.string(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
  progressPercentage: z.number(),
  isCompleted: z.boolean(),
})

// ─── Types ──────────────────────────────────────────────────────────
export type CreateGoalInput = z.infer<typeof createGoalSchema>
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>
export type ContributeGoalInput = z.infer<typeof contributeGoalSchema>
