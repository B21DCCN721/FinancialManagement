import { FastifyRequest, FastifyReply } from "fastify"
import {
  getAllCategoriesService, createCategoryService,
  updateCategoryService, deleteCategoryService,
} from "./categories.service"
import { CreateCategoryInput, UpdateCategoryInput } from "./categories.schema"
import { AppError } from "../../utils/errors"

function handleError(err: unknown, reply: FastifyReply) {
  if (err instanceof AppError) return reply.code(err.statusCode).send({ statusCode: err.statusCode, message: err.message })
  throw err
}

export async function getAllCategoriesController(request: FastifyRequest, reply: FastifyReply) {
  try {
    return reply.send(await getAllCategoriesService(request.server, request.user.id))
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
