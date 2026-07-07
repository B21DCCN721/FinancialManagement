import { FastifyInstance, FastifyPluginAsync } from "fastify"
import { ZodTypeProvider } from "fastify-type-provider-zod"
import { updateProfileSchema, changePasswordSchema, userProfileSchema } from "./users.schema"
import { getMeController, updateProfileController, changePasswordController, deleteAccountController, unlinkGoogleController } from "./users.controller"
import { authenticate } from "../../hooks/authenticate"
import { z } from "zod"

const msgSchema = z.object({ message: z.string() })
const errorSchema = z.object({ statusCode: z.number(), message: z.string() })

export const userRoutes: FastifyPluginAsync = async (server: FastifyInstance) => {
  const s = server.withTypeProvider<ZodTypeProvider>()

  // All routes require authentication
  s.addHook("preHandler", authenticate)

  // GET /api/users/me
  s.get("/me", {
    schema: { response: { 200: userProfileSchema } },
  }, getMeController)

  // PATCH /api/users/me
  s.patch("/me", {
    schema: {
      body: updateProfileSchema,
      response: { 200: userProfileSchema, 400: errorSchema },
    },
  }, updateProfileController)

  // PATCH /api/users/me/password
  s.patch("/me/password", {
    schema: {
      body: changePasswordSchema,
      response: { 200: msgSchema, 400: errorSchema },
    },
  }, changePasswordController)

  // DELETE /api/users/me
  s.delete("/me", {
    schema: { response: { 200: msgSchema } },
  }, deleteAccountController)

  // DELETE /api/users/me/google-link
  s.delete("/me/google-link", {
    schema: { response: { 200: msgSchema, 400: errorSchema } },
  }, unlinkGoogleController)
}
