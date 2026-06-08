import { z } from "zod"

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a valid hex color e.g. #FF5733")

// ─── Request Schemas ────────────────────────────────────────────────
export const createCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(50),
  type: z.enum(["income", "expense"], { error: "Type must be 'income' or 'expense'" }),
  color: hexColor.optional(),
  icon: z.string().min(1).max(50).optional(),
})

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: hexColor.optional().nullable(),
  icon: z.string().min(1).max(50).optional().nullable(),
})

export const categoryParamsSchema = z.object({
  id: z.string().uuid("Invalid category ID"),
})

// ─── Response Schemas ────────────────────────────────────────────────
export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  color: z.string().nullable(),
  icon: z.string().nullable(),
  userId: z.string(),
  createdAt: z.union([z.date(), z.string()]),
  updatedAt: z.union([z.date(), z.string()]),
})

// ─── Types ──────────────────────────────────────────────────────────
export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
