import { FastifyInstance, FastifyPluginAsync } from "fastify"
import { ZodTypeProvider } from "fastify-type-provider-zod"
import { createCategorySchema, updateCategorySchema, categoryParamsSchema, categorySchema } from "./categories.schema"
import { getAllCategoriesController, createCategoryController, updateCategoryController, deleteCategoryController } from "./categories.controller"
import { authenticate } from "../../hooks/authenticate"
import { z } from "zod"

const errorSchema = z.object({ statusCode: z.number(), message: z.string() })
const msgSchema = z.object({ message: z.string() })

export const categoryRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  const s = server.withTypeProvider<ZodTypeProvider>()
  s.addHook("preHandler", authenticate)

  // GET /api/categories
  s.get("/", {
    schema: {
      querystring: z.object({ type: z.enum(["income", "expense"]).optional() }),
      response: { 200: z.array(categorySchema) },
    },
  }, getAllCategoriesController)

  // POST /api/categories
  s.post("/", {
    schema: {
      body: createCategorySchema,
      response: { 201: categorySchema, 409: errorSchema },
    },
  }, createCategoryController)

  // PATCH /api/categories/:id
  s.patch("/:id", {
    schema: {
      params: categoryParamsSchema,
      body: updateCategorySchema,
      response: { 200: categorySchema, 404: errorSchema },
    },
  }, updateCategoryController)

  // DELETE /api/categories/:id
  s.delete("/:id", {
    schema: {
      params: categoryParamsSchema,
      response: { 200: msgSchema, 404: errorSchema, 409: errorSchema },
    },
  }, deleteCategoryController)
}
