import { JsonValue } from "@prisma/client/runtime/library";
import { getIO } from "../config/socket";
import { logger } from "../utils/logger";

/**
 * Socket event names for the application
 */
export const SOCKET_EVENTS = {
  // Ride events
  RIDE_CREATED: "ride:created",
  RIDE_CANCELLED: "ride:cancelled",
  RIDE_COMPLETED: "ride:completed",

  // Request events
  REQUEST_CREATED: "request:created",
  REQUEST_ACCEPTED: "request:accepted",
  REQUEST_REJECTED: "request:rejected",
  REQUEST_CANCELLED: "request:cancelled",
};

/**
 * Emit when a new ride is created
 * Broadcast to all connected users EXCEPT the ride creator
 */
export const emitRideCreated = (
  rideData: {
    id: string;
    rideNumber: string;
    rider: {
      id: string;
      firstName: string;
      lastName: string;
      profilePhoto?: string;
    };
    startLocation: JsonValue;
    endLocation: JsonValue;
    departureTime: string;
    availableSeats: number;
    fare: number;
    motorcycleDetails?: string;
  },
  riderId: string,
) => {
  try {
    const io = getIO();
    // Emit to all users except the ride creator
    io.except(`user:${riderId}`).emit(SOCKET_EVENTS.RIDE_CREATED, {
      timestamp: new Date().toISOString(),
      data: rideData,
    });
    logger.info(
      { rideId: rideData.id, riderId },
      "Ride created event emitted to other users",
    );
  } catch (error) {
    logger.error({ error }, "Failed to emit ride created event");
  }
};

/**
 * Emit when a ride is cancelled
 * Notify all users EXCEPT the ride creator
 */
export const emitRideCancelled = (rideId: string, riderId: string) => {
  try {
    const io = getIO();
    // Emit to all users except the ride creator
    io.except(`user:${riderId}`).emit(SOCKET_EVENTS.RIDE_CANCELLED, {
      timestamp: new Date().toISOString(),
      data: {
        rideId,
        riderId,
      },
    });
    logger.info(
      { rideId, riderId },
      "Ride cancelled event emitted to other users",
    );
  } catch (error) {
    logger.error({ error }, "Failed to emit ride cancelled event");
  }
};

/**
 * Emit when a ride is completed
 * Notify all users EXCEPT the ride creator
 */
export const emitRideCompleted = (rideId: string, riderId: string) => {
  try {
    const io = getIO();
    // Emit to all users except the ride creator
    io.except(`user:${riderId}`).emit(SOCKET_EVENTS.RIDE_COMPLETED, {
      timestamp: new Date().toISOString(),
      data: {
        rideId,
        riderId,
      },
    });
    logger.info(
      { rideId, riderId },
      "Ride completed event emitted to other users",
    );
  } catch (error) {
    logger.error({ error }, "Failed to emit ride completed event");
  }
};

/**
 * Emit when a user requests to join a ride
 * Send notification to the ride owner (rider) only
 */
export const emitRequestCreated = (
  requestData: {
    id: string;
    rideId: string;
    passenger: {
      id: string;
      firstName: string;
      lastName: string;
      profilePhoto?: string;
      rating?: number;
    };
    status: string;
  },
  riderId: string,
) => {
  try {
    const io = getIO();
    // Emit only to the ride owner (rider)
    io.to(`user:${riderId}`).emit(SOCKET_EVENTS.REQUEST_CREATED, {
      timestamp: new Date().toISOString(),
      data: requestData,
    });
    logger.info(
      { requestId: requestData.id, riderId },
      "Request created event emitted to rider only",
    );
  } catch (error) {
    logger.error({ error }, "Failed to emit request created event");
  }
};

/**
 * Emit when a rider accepts a passenger's request
 * Send notification to the passenger only
 */
export const emitRequestAccepted = (
  requestData: {
    id: string;
    rideId: string;
    status: string;
  },
  passengerId: string,
  rideDetails?: {
    id: string;
    rideNumber: string;
    startLocation: JsonValue;
    endLocation: JsonValue;
    departureTime: string;
    fare: number;
  },
) => {
  try {
    const io = getIO();
    // Emit only to the passenger whose request was accepted
    io.to(`user:${passengerId}`).emit(SOCKET_EVENTS.REQUEST_ACCEPTED, {
      timestamp: new Date().toISOString(),
      data: {
        requestId: requestData.id,
        rideId: requestData.rideId,
        status: requestData.status,
        rideDetails,
      },
    });
    logger.info(
      { requestId: requestData.id, passengerId },
      "Request accepted event emitted to passenger only",
    );
  } catch (error) {
    logger.error({ error }, "Failed to emit request accepted event");
  }
};

/**
 * Emit when a rider rejects a passenger's request
 * Send notification to the passenger only
 */
export const emitRequestRejected = (
  requestData: {
    id: string;
    rideId: string;
    status: string;
  },
  passengerId: string,
) => {
  try {
    const io = getIO();
    // Emit only to the passenger whose request was rejected
    io.to(`user:${passengerId}`).emit(SOCKET_EVENTS.REQUEST_REJECTED, {
      timestamp: new Date().toISOString(),
      data: {
        requestId: requestData.id,
        rideId: requestData.rideId,
        status: requestData.status,
      },
    });
    logger.info(
      { requestId: requestData.id, passengerId },
      "Request rejected event emitted to passenger only",
    );
  } catch (error) {
    logger.error({ error }, "Failed to emit request rejected event");
  }
};

/**
 * Emit when a passenger cancels their request
 * Notify the ride owner (rider) only
 */
export const emitRequestCancelled = (
  requestId: string,
  rideId: string,
  riderId: string,
) => {
  try {
    const io = getIO();
    // Emit only to the ride owner to notify them that a passenger cancelled their request
    io.to(`user:${riderId}`).emit(SOCKET_EVENTS.REQUEST_CANCELLED, {
      timestamp: new Date().toISOString(),
      data: {
        requestId,
        rideId,
      },
    });
    logger.info(
      { requestId, riderId },
      "Request cancelled event emitted to rider only",
    );
  } catch (error) {
    logger.error({ error }, "Failed to emit request cancelled event");
  }
};
