import { prisma } from '../../config/prisma';
import { logger } from '../../utils/logger';
import { LoginInput, VerifyOtpInput } from './auth.validation';
import { AppError } from '../../middlewares/error.middleware';

// Mock OTP storage - in production, use Redis or database
const otpStore = new Map<string, { otp: string; expiresAt: Date }>();

export class AuthService {
  /**
   * Send OTP to user's phone
   * Creates user if not exists
   */
  async login(data: LoginInput) {
    logger.info({ phone: data.phone }, 'Login request received');

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { phone: data.phone },
    });

    if (!user && data.name && data.city) {
      user = await prisma.user.create({
        data: {
          phone: data.phone,
          name: data.name,
          city: data.city,
        },
      });
      logger.info({ userId: user.id }, 'New user created');
    }

    if (!user) {
      throw new AppError(400, 'User not found. Please provide name and city for registration.');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store OTP (in production, use Redis)
    otpStore.set(data.phone, { otp, expiresAt });

    logger.info({ phone: data.phone, otp }, 'OTP generated (development only)');

    // TODO: Send OTP via SMS service (Twilio, SNS, etc.)

    return {
      message: 'OTP sent successfully',
      userId: user.id,
      // Only return OTP in development
      ...(process.env.NODE_ENV === 'development' && { otp }),
    };
  }

  /**
   * Verify OTP and return JWT token
   */
  async verifyOtp(data: VerifyOtpInput) {
    logger.info({ phone: data.phone }, 'OTP verification request');

    // Get stored OTP
    const stored = otpStore.get(data.phone);

    if (!stored) {
      throw new AppError(400, 'OTP not found or expired. Please request a new one.');
    }

    // Check expiry
    if (new Date() > stored.expiresAt) {
      otpStore.delete(data.phone);
      throw new AppError(400, 'OTP expired. Please request a new one.');
    }

    // Verify OTP
    if (stored.otp !== data.otp) {
      throw new AppError(400, 'Invalid OTP');
    }

    // Clear OTP
    otpStore.delete(data.phone);

    // Get user
    const user = await prisma.user.findUnique({
      where: { phone: data.phone },
      select: {
        id: true,
        name: true,
        phone: true,
        city: true,
        vehicleNumber: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // TODO: Generate actual JWT token
    const token = user.id; // Replace with actual JWT

    logger.info({ userId: user.id }, 'User authenticated successfully');

    return {
      token,
      user,
    };
  }

  /**
   * Mock logout (for JWT blacklisting in production)
   */
  async logout(userId: string) {
    logger.info({ userId }, 'User logged out');
    // TODO: Add token to blacklist (Redis)
    return { message: 'Logged out successfully' };
  }
}
