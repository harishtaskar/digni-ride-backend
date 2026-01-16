import { Request, Response, NextFunction } from 'express';
import { FeedbackService } from './feedback.service';
import { createFeedbackSchema } from './feedback.validation';
import { ResponseHandler } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';

const feedbackService = new FeedbackService();

export class FeedbackController {
  /**
   * POST /api/v1/feedback
   * Create feedback for a ride
   */
  async createFeedback(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.userId) {
        ResponseHandler.unauthorized(res);
        return;
      }
      const data = createFeedbackSchema.parse(req.body);
      const feedback = await feedbackService.createFeedback(req.userId, data);
      ResponseHandler.created(res, feedback, 'Feedback submitted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/feedback/user/:userId
   * Get feedback received by a user
   */
  async getUserFeedback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { userId } = req.params as { userId: string };
      const result = await feedbackService.getUserFeedback(userId);
      ResponseHandler.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/feedback/me
   * Get feedback received by current user
   */
  async getMyFeedback(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.userId) {
        ResponseHandler.unauthorized(res);
        return;
      }
      const result = await feedbackService.getUserFeedback(req.userId);
      ResponseHandler.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/feedback/ride/:rideId
   * Get feedback for a specific ride
   */
  async getRideFeedback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { rideId } = req.params as { rideId: string };
      const feedback = await feedbackService.getRideFeedback(rideId);
      ResponseHandler.success(res, feedback);
    } catch (error) {
      next(error);
    }
  }
}
