import { prisma } from '../../config/prisma';
import { logger } from '../../utils/logger';
import { AppError } from '../../middlewares/error.middleware';

export class UserService {
  /**
   * Get user profile by ID
   */
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        phone: true,
        city: true,
        vehicleNumber: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return user;
  }

  /**
   * Update user profile
   */
  async updateUser(userId: string, data: { name?: string; city?: string; vehicleNumber?: string }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        phone: true,
        city: true,
        vehicleNumber: true,
        updatedAt: true,
      },
    });

    logger.info({ userId }, 'User profile updated');
    return user;
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId: string) {
    const [ridesCreated, ridesJoined, feedbackStats] = await Promise.all([
      prisma.ride.count({
        where: { riderId: userId },
      }),
      prisma.ride.count({
        where: { passengerId: userId },
      }),
      prisma.feedback.aggregate({
        where: { toUserId: userId },
        _avg: { rating: true },
        _count: { rating: true },
      }),
    ]);

    return {
      ridesCreated,
      ridesJoined,
      averageRating: feedbackStats._avg.rating || 0,
      totalFeedbacks: feedbackStats._count.rating,
    };
  }
}
