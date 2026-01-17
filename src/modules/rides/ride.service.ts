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

    // Add hasRequested field for each ride if user is authenticated
    const ridesWithRequests = rides.map((ride) => ({
      ...ride,
      hasRequested: false,
      _count: undefined,
    }));

    // If user is authenticated, check which rides they've requested
    if (userId) {
      const userRequestedRides = await prisma.rideRequest.findMany({
        where: {
          rideId: { in: rides.map((r) => r.id) },
          passengerId: userId,
        },
        select: { rideId: true },
      });

      const requestedRideIds = new Set(
        userRequestedRides.map((r) => r.rideId),
      );

      return {
        rides: ridesWithRequests.map((ride) => ({
          ...ride,
          hasRequested: requestedRideIds.has(ride.id),
        })),
        pagination: {
          total,
          limit: query.limit || 20,
          offset: query.offset || 0,
        },
      };
    }

    return {
      rides: ridesWithRequests,
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
  async getRideById(rideId: string, userId?: string) {
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

    // Check if current user has requested this ride
    let hasRequested = false;
    if (userId) {
      const existingRequest = await prisma.rideRequest.findUnique({
        where: {
          rideId_passengerId: {
            rideId,
            passengerId: userId,
          },
        },
      });
      hasRequested = !!existingRequest;
    }

    return {
      ...ride,
      hasRequested,
      _count: undefined,
    };
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
    if (type === "created") {
      // For created rides, filter by riderId
      const where: Prisma.RideWhereInput = { riderId: userId };

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
          _count: {
            select: {
              requests: true,
            },
          },
        },
        orderBy: { departureTime: "desc" },
      });

      // Map the response to include requestCount field
      return rides.map((ride) => ({
        ...ride,
        requestCount: ride._count.requests,
        _count: undefined, // Remove _count from response
      }));
    } else {
      // For joined rides, find all rides where user has a RideRequest (any status)
      const rideRequests = await prisma.rideRequest.findMany({
        where: { passengerId: userId },
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
          },
        },
        orderBy: { createdAt: "desc" },
      });

      // Extract ride data and map requestCount
      return rideRequests.map((request) => {
        const ride = request.ride;
        return {
          ...ride,
          requestCount: ride._count.requests,
          _count: undefined, // Remove _count from response
        };
      });
    }
  }
}
