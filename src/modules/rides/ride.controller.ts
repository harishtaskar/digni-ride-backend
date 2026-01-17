import { Response, NextFunction } from "express";
import { RideService } from "./ride.service";
import { createRideSchema, getRidesQuerySchema } from "./ride.validation";
import { ResponseHandler } from "../../utils/response";
import { AuthRequest } from "../../middlewares/auth.middleware";
import {
  emitRideCreated,
  emitRideCancelled,
  emitRideCompleted,
} from "../../sockets/socket.events";

const rideService = new RideService();

export class RideController {
  /**
   * POST /api/v1/rides
   * Create a new ride
   */
  async createRide(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.userId) {
        ResponseHandler.unauthorized(res);
        return;
      }
      const data = createRideSchema.parse(req.body);
      const ride = await rideService.createRide(req.userId, data);

      // Emit socket event for new ride creation
      emitRideCreated({
        id: ride.id,
        rideNumber: ride.id.substring(0, 8).toUpperCase(),
        rider: {
          id: ride.rider.id,
          firstName: ride.rider.name?.split(" ")[0] || "Unknown",
          lastName: ride.rider.name?.split(" ")[1] || "",
        },
        startLocation: String(ride.startLocation),
        endLocation: String(ride.endLocation),
        departureTime: ride.departureTime.toISOString(),
        availableSeats: 1,
        fare: 0,
      });

      ResponseHandler.created(res, ride, "Ride created successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/rides
   * Get rides with filters
   */
  async getRides(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = getRidesQuerySchema.parse(req.query);
      const result = await rideService.getRides(query, req.userId);
      ResponseHandler.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/rides/:id
   * Get ride by ID
   */
  async getRideById(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const { id } = req.params as { id: string };
      const ride = await rideService.getRideById(id, req.userId);
      ResponseHandler.success(res, ride);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/rides/:id/complete
   * Complete a ride
   */
  async completeRide(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.userId) {
        ResponseHandler.unauthorized(res);
        return;
      }
      const { id } = req.params as { id: string };
      const ride = await rideService.completeRide(id, req.userId);

      // Emit socket event for ride completion
      emitRideCompleted(ride.id, ride.riderId);

      ResponseHandler.success(res, ride, "Ride completed successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/rides/:id
   * Cancel a ride
   */
  async cancelRide(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.userId) {
        ResponseHandler.unauthorized(res);
        return;
      }
      const { id } = req.params as { id: string };
      const result = await rideService.cancelRide(id, req.userId);

      // Emit socket event for ride cancellation
      emitRideCancelled(id, req.userId);

      ResponseHandler.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/rides/me/created
   * Get user's created rides
   */
  async getMyCreatedRides(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.userId) {
        ResponseHandler.unauthorized(res);
        return;
      }
      const rides = await rideService.getUserRides(req.userId, "created");
      ResponseHandler.success(res, rides);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/rides/me/joined
   * Get user's joined rides
   */
  async getMyJoinedRides(
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      if (!req.userId) {
        ResponseHandler.unauthorized(res);
        return;
      }
      const rides = await rideService.getUserRides(req.userId, "joined");
      ResponseHandler.success(res, rides);
    } catch (error) {
      next(error);
    }
  }
}
