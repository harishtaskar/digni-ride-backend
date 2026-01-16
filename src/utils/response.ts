import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export class ResponseHandler {
  static success<T>(res: Response, data: T, message?: string, statusCode = 200) {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
    };
    return res.status(statusCode).json(response);
  }

  static created<T>(res: Response, data: T, message = 'Resource created successfully') {
    return this.success(res, data, message, 201);
  }

  static error(res: Response, error: string, statusCode = 400) {
    const response: ApiResponse = {
      success: false,
      error,
    };
    return res.status(statusCode).json(response);
  }

  static notFound(res: Response, message = 'Resource not found') {
    return this.error(res, message, 404);
  }

  static unauthorized(res: Response, message = 'Unauthorized access') {
    return this.error(res, message, 401);
  }

  static forbidden(res: Response, message = 'Access forbidden') {
    return this.error(res, message, 403);
  }

  static serverError(res: Response, message = 'Internal server error') {
    return this.error(res, message, 500);
  }

  static conflict(res: Response, message = 'Resource conflict') {
    return this.error(res, message, 409);
  }

  static badRequest(res: Response, message = 'Bad request') {
    return this.error(res, message, 400);
  }
}
