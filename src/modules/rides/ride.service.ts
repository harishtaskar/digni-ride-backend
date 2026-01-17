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
    const limit = query.limit || 20;
    const offset = query.offset || 0;
    const status = query.status || RideStatus.OPEN;

    // Build conditional SQL fragments
    let orderClause = Prisma.sql`r."createdAt" DESC`;
    let distanceSelect = Prisma.empty;
    if (query.lat !== undefined && query.lng !== undefined) {
      distanceSelect = Prisma.sql`,
        ST_Distance(
          ST_SetSRID(ST_MakePoint(
            CAST(r."startLocation"->>'lng' AS FLOAT), 
            CAST(r."startLocation"->>'lat' AS FLOAT)
          ), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${query.lng}, ${query.lat}), 4326)::geography
        ) as distance`;

      orderClause = Prisma.sql`${
        userId ? Prisma.sql`(rr.id IS NOT NULL) DESC,` : Prisma.empty
      } distance ASC, r."createdAt" DESC`;
    } else if (userId) {
      orderClause = Prisma.sql`(rr.id IS NOT NULL) DESC, r."createdAt" DESC`;
    }

    let departureCondition = Prisma.empty;
    if (query.departureFrom) {
      departureCondition = Prisma.sql`${departureCondition} AND r."departureTime" >= ${new Date(query.departureFrom)}`;
    }
    if (query.departureTo) {
      departureCondition = Prisma.sql`${departureCondition} AND r."departureTime" <= ${new Date(query.departureTo)}`;
    }

    let riderCondition = Prisma.empty;
    if (userId) {
      riderCondition = Prisma.sql`AND r."riderId" != ${userId}`;
    }

    // Execute raw query for sorted IDs and total count
    const [idResults, countResults] = await Promise.all([
      prisma.$queryRaw<{ id: string }[]>`
        SELECT r.id ${distanceSelect}
        FROM "Ride" r
        ${
          userId
            ? Prisma.sql`LEFT JOIN "RideRequest" rr ON rr."rideId" = r.id AND rr."passengerId" = ${userId}`
            : Prisma.empty
        }
        WHERE r.status = ${status}::"RideStatus"
        ${departureCondition}
        ${riderCondition}
        ORDER BY ${orderClause}
        LIMIT ${limit} OFFSET ${offset}
      `,
      prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*) as count
        FROM "Ride" r
        WHERE r.status = ${status}::"RideStatus"
        ${departureCondition}
        ${riderCondition}
      `,
    ]);

    const rideIds = idResults.map((r) => r.id);
    const total = Number(countResults[0].count);

    if (rideIds.length === 0) {
      return {
        rides: [],
        pagination: { total, limit, offset },
      };
    }

    // Fetch full ride details for the sorted IDs
    const rides = await prisma.ride.findMany({
      where: { id: { in: rideIds } },
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
    });

    // Re-sort rides to match the order from the raw SQL query
    const rideMap = new Map(rides.map((r) => [r.id, r]));
    const sortedRides = rideIds
      .map((id) => rideMap.get(id))
      .filter((r): r is NonNullable<typeof r> => r !== undefined);

    // Add hasRequested field
    let requestedRideIds = new Set<string>();
    if (userId) {
      const userRequestedRides = await prisma.rideRequest.findMany({
        where: {
          rideId: { in: rideIds },
          passengerId: userId,
        },
        select: { rideId: true },
      });
      requestedRideIds = new Set(userRequestedRides.map((r) => r.rideId));
    }

    return {
      rides: sortedRides.map((ride) => ({
        ...ride,
        hasRequested: requestedRideIds.has(ride.id),
        _count: undefined,
      })),
      pagination: {
        total,
        limit,
        offset,
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
          requestStatus: request.status,
          requestCount: ride._count.requests,
          _count: undefined, // Remove _count from response
        };
      });
    }
  }
}
