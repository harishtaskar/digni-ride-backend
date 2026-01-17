import { prisma } from '../../config/prisma';
import { logger } from '../../utils/logger';
import { generateToken } from '../../utils/jwt';
import { LoginInput, VerifyOtpInput } from "./auth.validation";
import { AppError } from '../../middlewares/error.middleware';

export class AuthService {
  /**
   * Send OTP to user's phone for login/registration
   * Creates user if not exists
   */
  async login(data: LoginInput) {
    logger.info({ phone: data.phone }, "Login request received");

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { phone: data.phone },
    });

    let isRegistered = false;

    if (user) {
      // User exists, check if profile is complete
      isRegistered = !!(user.name && user.city);
    } else {
      // Create new user with just phone number
      user = await prisma.user.create({
        data: {
          phone: data.phone,
          name: "",
          city: "",
        },
      });
      logger.info(
        { userId: user.id },
        "New user created (pending registration)",
      );
    }

    // Generate and store OTP
    const { otp, expiresAt } = this.generateOtp();
    await this.storeOtp(data.phone, otp, expiresAt);

    logger.info({ phone: data.phone, otp }, "OTP generated (development only)");

    return {
      message: "OTP sent successfully",
      userId: user.id,
      otp,
      isRegistered,
    };
  }

  private generateOtp() {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    return { otp, expiresAt };
  }

  private async storeOtp(phone: string, otp: string, expiresAt: Date) {
    await prisma.otp.upsert({
      where: { phone },
      update: {
        code: otp,
        expiresAt,
      },
      create: {
        phone,
        code: otp,
        expiresAt,
      },
    });
  }

  /**
   * Verify OTP and return JWT token
   */
  async verifyOtp(data: VerifyOtpInput) {
    logger.info({ phone: data.phone }, "OTP verification request");

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
      throw new AppError(404, "User not found");
    }

    // Generate JWT token
    const token = generateToken(user.id, user.phone);

    logger.info({ userId: user.id }, "User authenticated successfully");

    return {
      token,
      user,
      isRegistered: !!(user.name && user.city),
    };
  }

  /**
   * Mock logout (for JWT blacklisting in production)
   */
  async logout(userId: string) {
    logger.info({ userId }, "User logged out");
    // TODO: Add token to blacklist (Redis)
    return { message: "Logged out successfully" };
  }
}
