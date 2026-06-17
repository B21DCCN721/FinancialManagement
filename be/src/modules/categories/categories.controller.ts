import { FastifyRequest, FastifyReply } from "fastify"
import {
  getAllCategoriesService, createCategoryService,
  updateCategoryService, deleteCategoryService,
} from "./categories.service"
import { CreateCategoryInput, UpdateCategoryInput } from "./categories.schema"
import { handleError } from "../../utils/errors"

export async function getAllCategoriesController(
  request: FastifyRequest<{ Querystring: { type?: "income" | "expense" } }>,
  reply: FastifyReply
) {
  try {
    const { type } = request.query
    return reply.send(await getAllCategoriesService(request.server, request.user.id, type))
  } catch (err) { return handleError(err, reply) }
}

export async function createCategoryController(
  request: FastifyRequest<{ Body: CreateCategoryInput }>,
  reply: FastifyReply
) {
  try {
    return reply.code(201).send(await createCategoryService(request.server, request.user.id, request.body))
  } catch (err) { return handleError(err, reply) }
}

export async function updateCategoryController(
  request: FastifyRequest<{ Params: { id: string }; Body: UpdateCategoryInput }>,
  reply: FastifyReply
) {
  try {
    return reply.send(await updateCategoryService(request.server, request.user.id, request.params.id, request.body))
  } catch (err) { return handleError(err, reply) }
}

export async function deleteCategoryController(
  request: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) {
  try {
    await deleteCategoryService(request.server, request.user.id, request.params.id)
    return reply.send({ message: "Category deleted" })
  } catch (err) { return handleError(err, reply) }
}
