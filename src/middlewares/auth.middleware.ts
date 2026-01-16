import { Request, Response, NextFunction } from 'express';
import { ResponseHandler } from '../utils/response';
import { AppError } from './error.middleware';

// Mock auth middleware - replace with actual JWT verification
export interface AuthRequest extends Request {
  userId?: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'No token provided');
    }

    const token = authHeader.substring(7);

    // TODO: Implement actual JWT verification
    // For now, we'll use a simple mock implementation
    if (!token) {
      throw new AppError(401, 'Invalid token');
    }

    // Mock: Extract userId from token
    // In production, verify JWT and extract userId
    req.userId = token; // Replace with actual decoded userId

    next();
  } catch (error) {
    if (error instanceof AppError) {
      ResponseHandler.unauthorized(res, error.message);
      return;
    }
    ResponseHandler.unauthorized(res, 'Authentication failed');
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      // Mock: Extract userId from token
      req.userId = token; // Replace with actual decoded userId
    }

    next();
  } catch (error) {
    next();
  }
};
