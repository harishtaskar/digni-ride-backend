import { RideStatus, RideRequestStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { logger } from '../../utils/logger';
import { AppError } from '../../middlewares/error.middleware';
import { CreateRequestInput } from './request.validation';

export class RequestService {
  /**
   * Create a ride request (passenger requests to join)
   */
  async createRequest(rideId: string, passengerId: string, data: CreateRequestInput) {
    // Check if ride exists and is open
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: { rider: true },
    });

    if (!ride) {
      throw new AppError(404, 'Ride not found');
    }

    if (ride.status !== RideStatus.OPEN) {
      throw new AppError(400, 'This ride is not accepting requests');
    }

    if (ride.riderId === passengerId) {
      throw new AppError(400, 'You cannot request your own ride');
    }

    // Check if request already exists
    const existingRequest = await prisma.rideRequest.findUnique({
      where: {
        rideId_passengerId: {
          rideId,
          passengerId,
        },
      },
    });

    if (existingRequest) {
      throw new AppError(409, 'You have already requested this ride');
    }

    const request = await prisma.rideRequest.create({
      data: {
        rideId,
        passengerId,
        note: data.note,
        status: RideRequestStatus.PENDING,
      },
      include: {
        passenger: {
          select: {
            id: true,
            name: true,
            phone: true,
            city: true,
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
    });

    logger.info({ requestId: request.id, rideId, passengerId }, 'Ride request created');
    return request;
  }

  /**
   * Get requests for a ride (only rider can see)
   */
  async getRideRequests(rideId: string, riderId: string) {
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      throw new AppError(404, 'Ride not found');
    }

    if (ride.riderId !== riderId) {
      throw new AppError(403, 'Only the rider can view requests');
    }

    const requests = await prisma.rideRequest.findMany({
      where: { rideId },
      include: {
        passenger: {
          select: {
            id: true,
            name: true,
            phone: true,
            city: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return requests;
  }

  /**
   * Accept a ride request (transactional)
   * - Accept the request
   * - Reject all other requests
   * - Update ride status to MATCHED
   * - Set passenger on ride
   */
  async acceptRequest(requestId: string, riderId: string) {
    const request = await prisma.rideRequest.findUnique({
      where: { id: requestId },
      include: { ride: true },
    });

    if (!request) {
      throw new AppError(404, 'Request not found');
    }

    if (request.ride.riderId !== riderId) {
      throw new AppError(403, 'Only the rider can accept requests');
    }

    if (request.ride.status !== RideStatus.OPEN) {
      throw new AppError(400, 'This ride is not accepting requests');
    }

    if (request.status !== RideRequestStatus.PENDING) {
      throw new AppError(400, 'This request is no longer pending');
    }

    // Transactional operation
    const result = await prisma.$transaction(async (tx) => {
      // Accept the request
      const acceptedRequest = await tx.rideRequest.update({
        where: { id: requestId },
        data: { status: RideRequestStatus.ACCEPTED },
      });

      // Reject all other pending requests for this ride
      await tx.rideRequest.updateMany({
        where: {
          rideId: request.rideId,
          id: { not: requestId },
          status: RideRequestStatus.PENDING,
        },
        data: { status: RideRequestStatus.REJECTED },
      });

      // Update ride status and set passenger
      const updatedRide = await tx.ride.update({
        where: { id: request.rideId },
        data: {
          status: RideStatus.MATCHED,
          passengerId: request.passengerId,
        },
        include: {
          rider: {
            select: {
              id: true,
              name: true,
              vehicleNumber: true,
            },
          },
          passenger: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
        },
      });

      return { request: acceptedRequest, ride: updatedRide };
    });

    logger.info(
      { requestId, rideId: request.rideId, riderId, passengerId: request.passengerId },
      'Request accepted, ride matched'
    );

    return result;
  }

  /**
   * Reject a ride request
   */
  async rejectRequest(requestId: string, riderId: string) {
    const request = await prisma.rideRequest.findUnique({
      where: { id: requestId },
      include: { ride: true },
    });

    if (!request) {
      throw new AppError(404, 'Request not found');
    }

    if (request.ride.riderId !== riderId) {
      throw new AppError(403, 'Only the rider can reject requests');
    }

    if (request.status !== RideRequestStatus.PENDING) {
      throw new AppError(400, 'This request is no longer pending');
    }

    const rejectedRequest = await prisma.rideRequest.update({
      where: { id: requestId },
      data: { status: RideRequestStatus.REJECTED },
    });

    logger.info({ requestId, riderId }, 'Request rejected');
    return rejectedRequest;
  }

  /**
   * Get user's ride requests
   */
  async getUserRequests(passengerId: string) {
    const requests = await prisma.rideRequest.findMany({
      where: { passengerId },
      include: {
        ride: {
          include: {
            rider: {
              select: {
                id: true,
                name: true,
                city: true,
                vehicleNumber: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests;
  }

  /**
   * Cancel a ride request (by passenger)
   */
  async cancelRequest(requestId: string, passengerId: string) {
    const request = await prisma.rideRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new AppError(404, 'Request not found');
    }

    if (request.passengerId !== passengerId) {
      throw new AppError(403, 'You can only cancel your own requests');
    }

    if (request.status !== RideRequestStatus.PENDING) {
      throw new AppError(400, 'Only pending requests can be cancelled');
    }

    await prisma.rideRequest.delete({
      where: { id: requestId },
    });

    logger.info({ requestId, passengerId }, 'Request cancelled');
    return { message: 'Request cancelled successfully' };
  }
}
