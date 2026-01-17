import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import {
  loginSchema,
  registerSchema,
  verifyOtpSchema,
} from "./auth.validation";
import { ResponseHandler } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';

const authService = new AuthService();

export class AuthController {
  /**
   * POST /api/v1/auth/login
   * Send OTP to existing user's phone
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = loginSchema.parse(req.body);
      const result = await authService.login(data);
      ResponseHandler.success(res, result, "OTP sent successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/register
   * Register new user and send OTP
   */
  async register(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = registerSchema.parse(req.body);
      const result = await authService.register(data);
      ResponseHandler.success(
        res,
        result,
        "User registered and OTP sent successfully",
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/verify-otp
   * Verify OTP and return JWT token
   */
  async verifyOtp(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const data = verifyOtpSchema.parse(req.body);
      const result = await authService.verifyOtp(data);
      ResponseHandler.success(res, result, "Authentication successful");
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/logout
   * Logout user (blacklist token)
   */
  async logout(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.userId) {
        ResponseHandler.unauthorized(res, "Not authenticated");
        return;
      }
      const result = await authService.logout(req.userId);
      ResponseHandler.success(res, result);
    } catch (error) {
      next(error);
    }
  }
}
