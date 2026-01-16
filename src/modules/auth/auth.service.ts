import { prisma } from '../../config/prisma';
import { logger } from '../../utils/logger';
import { generateToken } from '../../utils/jwt';
import { LoginInput, VerifyOtpInput } from './auth.validation';
import { AppError } from '../../middlewares/error.middleware';

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

    // Store OTP in database
    await prisma.otp.upsert({
      where: { phone: data.phone },
      update: {
        code: otp,
        expiresAt,
      },
      create: {
        phone: data.phone,
        code: otp,
        expiresAt,
      },
    });

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

    // Get stored OTP from database
    const storedOtp = await prisma.otp.findUnique({
      where: { phone: data.phone },
    });

    if (!storedOtp) {
      throw new AppError(
        400,
        "OTP not found or expired. Please request a new one.",
      );
    }

    // Check expiry
    if (new Date() > storedOtp.expiresAt) {
      await prisma.otp.delete({ where: { phone: data.phone } });
      throw new AppError(400, "OTP expired. Please request a new one.");
    }

    // Verify OTP
    if (storedOtp.code !== data.otp) {
      throw new AppError(400, "Invalid OTP");
    }

    // Clear OTP after successful verification
    await prisma.otp.delete({ where: { phone: data.phone } });

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

    // Generate JWT token
    const token = generateToken(user.id, user.phone);

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
