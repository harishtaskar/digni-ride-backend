import { RideStatus, UserRole } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { logger } from '../../utils/logger';
import { AppError } from '../../middlewares/error.middleware';
import { CreateFeedbackInput } from './feedback.validation';

export class FeedbackService {
  /**
   * Create feedback for a completed ride
   */
  async createFeedback(fromUserId: string, data: CreateFeedbackInput) {
    // Get ride details
    const ride = await prisma.ride.findUnique({
      where: { id: data.rideId },
      include: {
        rider: true,
        passenger: true,
      },
    });

    if (!ride) {
      throw new AppError(404, 'Ride not found');
    }

    // Validate ride is completed
    if (ride.status !== RideStatus.COMPLETED) {
      throw new AppError(400, 'Feedback can only be given for completed rides');
    }

    // Validate user is part of the ride
    if (ride.riderId !== fromUserId && ride.passengerId !== fromUserId) {
      throw new AppError(403, 'You can only give feedback for rides you participated in');
    }

    // Validate toUserId is the other party
    const validToUserId =
      fromUserId === ride.riderId ? ride.passengerId : ride.riderId;

    if (data.toUserId !== validToUserId) {
      throw new AppError(400, 'You can only give feedback to the other party in the ride');
    }

    // Determine user role
    const userRole = fromUserId === ride.riderId ? UserRole.RIDER : UserRole.PASSENGER;

    // Check if feedback already exists
    const existingFeedback = await prisma.feedback.findUnique({
      where: {
        rideId_fromUserId: {
          rideId: data.rideId,
          fromUserId,
        },
      },
    });

    if (existingFeedback) {
      throw new AppError(409, 'You have already given feedback for this ride');
    }

    // Create feedback
    const feedback = await prisma.feedback.create({
      data: {
        rideId: data.rideId,
        fromUserId,
        toUserId: data.toUserId,
        userRole,
        rating: data.rating,
        comment: data.comment,
      },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
          },
        },
        toUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    logger.info(
      { feedbackId: feedback.id, rideId: data.rideId, fromUserId, toUserId: data.toUserId },
      'Feedback created'
    );

    return feedback;
  }

  /**
   * Get feedback received by a user
   */
  async getUserFeedback(userId: string) {
    const feedback = await prisma.feedback.findMany({
      where: { toUserId: userId },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
          },
        },
        ride: {
          select: {
            id: true,
            startLocation: true,
            endLocation: true,
            departureTime: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate average rating
    const avgRating =
      feedback.length > 0
        ? feedback.reduce((sum: number, f: any) => sum + f.rating, 0) /
          feedback.length
        : 0;

    return {
      feedback,
      stats: {
        totalFeedbacks: feedback.length,
        averageRating: Number(avgRating.toFixed(2)),
        ratingDistribution: {
          5: feedback.filter((f: any) => f.rating === 5).length,
          4: feedback.filter((f: any) => f.rating === 4).length,
          3: feedback.filter((f: any) => f.rating === 3).length,
          2: feedback.filter((f: any) => f.rating === 2).length,
          1: feedback.filter((f: any) => f.rating === 1).length,
        },
      },
    };
  }

  /**
   * Get feedback for a specific ride
   */
  async getRideFeedback(rideId: string) {
    const feedback = await prisma.feedback.findMany({
      where: { rideId },
      include: {
        fromUser: {
          select: {
            id: true,
            name: true,
          },
        },
        toUser: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return feedback;
  }
}
