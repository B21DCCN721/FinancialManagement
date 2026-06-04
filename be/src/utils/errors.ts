export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string
  ) {
    super(message)
    this.name = "AppError"
  }
}

export const errors = {
  badRequest: (message = "Bad request") => new AppError(400, message),
  unauthorized: (message = "Unauthorized") => new AppError(401, message),
  forbidden: (message = "Forbidden") => new AppError(403, message),
  notFound: (message = "Not found") => new AppError(404, message),
  conflict: (message = "Conflict") => new AppError(409, message),
  internal: (message = "Internal server error") => new AppError(500, message),
}
