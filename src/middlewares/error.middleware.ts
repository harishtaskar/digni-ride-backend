import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import { ResponseHandler } from '../utils/response';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError | ZodError | Prisma.PrismaClientKnownRequestError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error(
    {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    },
    'Error occurred'
  );

  // Zod validation errors
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ');
    return ResponseHandler.badRequest(res, `Validation error: ${errors}`);
  }

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        return ResponseHandler.conflict(res, 'A record with this value already exists');
      case 'P2025':
        return ResponseHandler.notFound(res, 'Record not found');
      case 'P2003':
        return ResponseHandler.badRequest(res, 'Foreign key constraint failed');
      default:
        return ResponseHandler.serverError(res, 'Database error occurred');
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return ResponseHandler.badRequest(res, 'Invalid data provided');
  }

  // Custom AppError
  if (err instanceof AppError) {
    return ResponseHandler.error(res, err.message, err.statusCode);
  }

  // Default server error
  return ResponseHandler.serverError(
    res,
    process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  );
};

export const notFoundHandler = (req: Request, res: Response) => {
  ResponseHandler.notFound(res, `Route ${req.originalUrl} not found`);
};
