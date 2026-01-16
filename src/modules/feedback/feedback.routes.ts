import { Router } from 'express';
import { FeedbackController } from './feedback.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();
const feedbackController = new FeedbackController();

// Protected routes
router.post('/', authenticate, feedbackController.createFeedback.bind(feedbackController));
router.get('/me', authenticate, feedbackController.getMyFeedback.bind(feedbackController));

// Public routes
router.get('/user/:userId', feedbackController.getUserFeedback.bind(feedbackController));
router.get('/ride/:rideId', feedbackController.getRideFeedback.bind(feedbackController));

export default router;
