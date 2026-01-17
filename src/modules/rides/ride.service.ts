import { Prisma, RideStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import { logger } from '../../utils/logger';
import { AppError } from '../../middlewares/error.middleware';
import { CreateRideInput, GetRidesQuery } from './ride.validation';

export class RideService {
  /**
   * Create a new ride
   */
  async createRide(riderId: string, data: CreateRideInput) {
    // Check if user exists and has vehicle number
    const user = await prisma.user.findUnique({
      where: { id: riderId },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    if (!user.vehicleNumber) {
      throw new AppError(400, 'Vehicle number is required to create a ride');
    }

    const ride = await prisma.ride.create({
      data: {
        riderId,
        startLocation: data.startLocation,
        endLocation: data.endLocation,
        departureTime: new Date(data.departureTime),
        note: data.note,
        status: RideStatus.OPEN,
      },
      include: {
        rider: {
          select: {
            id: true,
            name: true,
            phone: true,
            vehicleNumber: true,
          },
        },
      },
    });

    logger.info({ rideId: ride.id, riderId }, 'Ride created');
    return ride;
  }

  /**
   * Get rides with filters
   */
  async getRides(query: GetRidesQuery, userId?: string) {
    const where: Prisma.RideWhereInput = {
      status: query.status || RideStatus.OPEN,
    };

    // Filter by location (Geospatial)
    if (query.lat !== undefined && query.lng !== undefined) {
      // Find rides starting within 2000 meters (2km)
      // Extract lat/lng from startLocation JSON field
      const result = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id
        FROM "Ride"
        WHERE ST_DWithin(
          ST_SetSRID(ST_MakePoint(
            CAST("startLocation"->>'lng' AS FLOAT), 
            CAST("startLocation"->>'lat' AS FLOAT)
          ), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${query.lng}, ${query.lat}), 4326)::geography,
          2000
        )
      `;
      
      const rideIds = result.map((r) => r.id);
      
      // If filtering by location, only include rides in range
      where.id = { in: rideIds };
    }

    // Filter by departure time range
    if (query.departureFrom || query.departureTo) {
      where.departureTime = {
        ...(query.departureFrom && { gte: new Date(query.departureFrom) }),
        ...(query.departureTo && { lte: new Date(query.departureTo) }),
      };
    }

    // Exclude user's own rides when browsing
    if (userId) {
      where.riderId = { not: userId };
    }

    const [rides, total] = await Promise.all([
      prisma.ride.findMany({
        where,
        include: {
          rider: {
            select: {
              id: true,
              name: true,
              city: true,
              vehicleNumber: true,
            },
          },
          passenger: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              requests: true,
            },
          },
        },
        orderBy: { departureTime: 'asc' },
        take: query.limit || 20,
        skip: query.offset || 0,
      }),
      prisma.ride.count({ where }),
    ]);

    return {
      rides,
      pagination: {
        total,
        limit: query.limit || 20,
        offset: query.offset || 0,
      },
    };
  }

  /**
   * Get ride by ID
   */
  async getRideById(rideId: string) {
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
      include: {
        rider: {
          select: {
            id: true,
            name: true,
            phone: true,
            city: true,
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
        _count: {
          select: {
            requests: true,
          },
        },
      },
    });

    if (!ride) {
      throw new AppError(404, 'Ride not found');
    }

    return ride;
  }

  /**
   * Complete a ride (only by rider)
   */
  async completeRide(rideId: string, riderId: string) {
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      throw new AppError(404, 'Ride not found');
    }

    if (ride.riderId !== riderId) {
      throw new AppError(403, 'Only the rider can complete this ride');
    }

    if (ride.status !== RideStatus.MATCHED) {
      throw new AppError(400, 'Only matched rides can be completed');
    }

    const updatedRide = await prisma.ride.update({
      where: { id: rideId },
      data: { status: RideStatus.COMPLETED },
      include: {
        rider: {
          select: {
            id: true,
            name: true,
          },
        },
        passenger: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    logger.info({ rideId, riderId }, 'Ride completed');
    return updatedRide;
  }

  /**
   * Cancel a ride (only by rider, only if OPEN)
   */
  async cancelRide(rideId: string, riderId: string) {
    const ride = await prisma.ride.findUnique({
      where: { id: rideId },
    });

    if (!ride) {
      throw new AppError(404, 'Ride not found');
    }

    if (ride.riderId !== riderId) {
      throw new AppError(403, 'Only the rider can cancel this ride');
    }

    if (ride.status !== RideStatus.OPEN) {
      throw new AppError(400, 'Only open rides can be cancelled');
    }

    await prisma.ride.delete({
      where: { id: rideId },
    });

    logger.info({ rideId, riderId }, 'Ride cancelled');
    return { message: 'Ride cancelled successfully' };
  }

  /**
   * Get user's rides (created or joined)
   */
  async getUserRides(userId: string, type: 'created' | 'joined') {
    const where: Prisma.RideWhereInput =
      type === 'created' ? { riderId: userId } : { passengerId: userId };

    const rides = await prisma.ride.findMany({
      where,
      include: {
        rider: {
          select: {
            id: true,
            name: true,
            city: true,
            vehicleNumber: true,
          },
        },
        passenger: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { departureTime: 'desc' },
    });

    return rides;
  }
}
