import { Response, NextFunction } from 'express';
import { RequestService } from './request.service';
import { createRequestSchema } from './request.validation';
import { ResponseHandler } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';
import {
  emitRequestCreated,
  emitRequestAccepted,
  emitRequestRejected,
  emitRequestCancelled,
} from "../../sockets/socket.events";

const requestService = new RequestService();

export class RequestController {
  /**
   * POST /api/v1/rides/:rideId/request
   * Create a ride request
   */
  async createRequest(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.userId) {
        ResponseHandler.unauthorized(res);
        return;
      }
      const { rideId } = req.params as { rideId: string };
      const data = createRequestSchema.parse(req.body);
      const request = await requestService.createRequest(
        rideId,
        req.userId,
        data,
      );

      // Emit socket event to notify the ride owner about the new request
      const rideData = request.ride as any;
      emitRequestCreated(
        {
          id: request.id,
          rideId: request.rideId,
          passenger: {
            id: request.passenger.id,
            firstName: request.passenger.name?.split(" ")[0] || "Unknown",
            lastName: request.passenger.name?.split(" ")[1] || "",
          },
          status: request.status,
        },
        rideData.riderId,
      );

      ResponseHandler.created(res, request, "Request sent successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/rides/:rideId/requests
   * Get all requests for a ride (rider only)
   */
  async getRideRequests(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.userId) {
        ResponseHandler.unauthorized(res);
        return;
      }
      const { rideId } = req.params as { rideId: string };
      const requests = await requestService.getRideRequests(rideId, req.userId);
      ResponseHandler.success(res, requests);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/requests/:requestId/accept
   * Accept a ride request
   */
  async acceptRequest(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.userId) {
        ResponseHandler.unauthorized(res);
        return;
      }
      const { requestId } = req.params as { requestId: string };
      const result = await requestService.acceptRequest(requestId, req.userId);

      // Emit socket event to notify the passenger
      const resultData = result as any;
      emitRequestAccepted(
        {
          id: resultData.request.id,
          rideId: resultData.request.rideId,
          status: resultData.request.status,
        },
        resultData.request.passengerId,
        {
          id: resultData.ride.id,
          rideNumber: resultData.ride.id.substring(0, 8).toUpperCase(),
          startLocation: String(resultData.ride.startLocation),
          endLocation: String(resultData.ride.endLocation),
          departureTime: resultData.ride.departureTime.toISOString(),
          fare: 0,
        },
      );

      ResponseHandler.success(res, result, "Request accepted successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/requests/:requestId/reject
   * Reject a ride request
   */
  async rejectRequest(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.userId) {
        ResponseHandler.unauthorized(res);
        return;
      }
      const { requestId } = req.params as { requestId: string };
      const request = await requestService.rejectRequest(requestId, req.userId);

      // Emit socket event to notify the passenger
      emitRequestRejected(
        {
          id: request.id,
          rideId: request.rideId,
          status: request.status,
        },
        request.passengerId,
      );

      ResponseHandler.success(res, request, "Request rejected");
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/requests/me
   * Get user's ride requests
   */
  async getMyRequests(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.userId) {
        ResponseHandler.unauthorized(res);
        return;
      }
      const requests = await requestService.getUserRequests(req.userId);
      ResponseHandler.success(res, requests);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/requests/:requestId
   * Cancel a ride request
   */
  async cancelRequest(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.userId) {
        ResponseHandler.unauthorized(res);
        return;
      }
      const { requestId } = req.params as { requestId: string };
      const result = await requestService.cancelRequest(requestId, req.userId);

      // Emit socket event to notify the ride owner
      const resultData = result as any;
      emitRequestCancelled(
        resultData.id,
        resultData.rideId,
        resultData.ride.riderId,
      );

      ResponseHandler.success(res, result);
    } catch (error) {
      next(error);
    }
  }
}
