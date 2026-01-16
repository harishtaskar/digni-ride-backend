import { Request, Response, NextFunction } from 'express';
import { ResponseHandler } from '../utils/response';
import { AppError } from './error.middleware';
import { verifyToken } from '../utils/jwt';

export interface AuthRequest extends Request {
  userId?: string;
  userPhone?: string;
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

    if (!token) {
      throw new AppError(401, 'Invalid token');
    }

    // Verify JWT and extract userId
    const decoded = verifyToken(token);
    
    req.userId = decoded.userId;
    req.userPhone = decoded.phone;

    next();
  } catch (error) {
    if (error instanceof AppError) {
      ResponseHandler.unauthorized(res, error.message);
      return;
    }
    if (error instanceof Error) {
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
      // Verify JWT and extract userId if token is present
      const decoded = verifyToken(token);
      req.userId = decoded.userId;
      req.userPhone = decoded.phone;
    }

    next();
  } catch (error) {
    // Optional auth - continue without userId if token is invalid
    next();
  }
};
