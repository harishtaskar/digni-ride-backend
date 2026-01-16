import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { UserService } from './user.service';
import { ResponseHandler } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';

const userService = new UserService();

const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  city: z.string().min(2).optional(),
  vehicleNumber: z.string().optional(),
});

export class UserController {
  /**
   * GET /api/v1/users/me
   * Get current user profile
   */
  async getProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.userId) {
        ResponseHandler.unauthorized(res);
        return;
      }
      const user = await userService.getUserById(req.userId);
      ResponseHandler.success(res, user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/users/me
   * Update current user profile
   */
  async updateProfile(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.userId) {
        ResponseHandler.unauthorized(res);
        return;
      }
      const data = updateUserSchema.parse(req.body);
      const user = await userService.updateUser(req.userId, data);
      ResponseHandler.success(res, user, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/users/me/stats
   * Get user statistics
   */
  async getStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.userId) {
        ResponseHandler.unauthorized(res);
        return;
      }
      const stats = await userService.getUserStats(req.userId);
      ResponseHandler.success(res, stats);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/users/:id
   * Get user by ID (public info only)
   */
  async getUserById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const user = await userService.getUserById(id);
      ResponseHandler.success(res, user);
    } catch (error) {
      next(error);
    }
  }
}
