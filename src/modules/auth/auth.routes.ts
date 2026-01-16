import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../../middlewares/auth.middleware';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/login', authController.login.bind(authController));
router.post('/verify-otp', authController.verifyOtp.bind(authController));

// Protected routes
router.post('/logout', authenticate, authController.logout.bind(authController));

export default router;
