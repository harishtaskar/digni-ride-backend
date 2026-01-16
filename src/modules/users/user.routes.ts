import { Router } from 'express';
import { UserController } from './user.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();
const userController = new UserController();

// Protected routes
router.get('/me', authenticate, userController.getProfile.bind(userController));
router.patch('/me', authenticate, userController.updateProfile.bind(userController));
router.get('/me/stats', authenticate, userController.getStats.bind(userController));

// Public routes
router.get('/:id', userController.getUserById.bind(userController));

export default router;
