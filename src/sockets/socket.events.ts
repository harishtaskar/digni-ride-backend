import { getIO } from '../config/socket';
import { logger } from '../utils/logger';

/**
 * Socket event names for the application
 */
export const SOCKET_EVENTS = {
  // Ride events
  RIDE_CREATED: 'ride:created',
  RIDE_CANCELLED: 'ride:cancelled',
  RIDE_COMPLETED: 'ride:completed',

  // Request events
  REQUEST_CREATED: 'request:created',
  REQUEST_ACCEPTED: 'request:accepted',
  REQUEST_REJECTED: 'request:rejected',
  REQUEST_CANCELLED: 'request:cancelled',
};

/**
 * Emit when a new ride is created
 * Broadcast to all connected users
 */
export const emitRideCreated = (rideData: {
  id: string;
  rideNumber: string;
  rider: {
    id: string;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
  };
  startLocation: string;
  endLocation: string;
  departureTime: string;
  availableSeats: number;
  fare: number;
  motorcycleDetails?: string;
}) => {
  try {
    const io = getIO();
    io.emit(SOCKET_EVENTS.RIDE_CREATED, {
      timestamp: new Date().toISOString(),
      data: rideData,
    });
    logger.info({ rideId: rideData.id }, 'Ride created event emitted');
  } catch (error) {
    logger.error({ error }, 'Failed to emit ride created event');
  }
};

/**
 * Emit when a ride is cancelled
 * Notify all passengers who requested to join this ride
 */
export const emitRideCancelled = (rideId: string, riderId: string) => {
  try {
    const io = getIO();
    io.emit(SOCKET_EVENTS.RIDE_CANCELLED, {
      timestamp: new Date().toISOString(),
      data: {
        rideId,
        riderId,
      },
    });
    logger.info({ rideId }, 'Ride cancelled event emitted');
  } catch (error) {
    logger.error({ error }, 'Failed to emit ride cancelled event');
  }
};

/**
 * Emit when a ride is completed
 */
export const emitRideCompleted = (rideId: string, riderId: string) => {
  try {
    const io = getIO();
    io.emit(SOCKET_EVENTS.RIDE_COMPLETED, {
      timestamp: new Date().toISOString(),
      data: {
        rideId,
        riderId,
      },
    });
    logger.info({ rideId }, 'Ride completed event emitted');
  } catch (error) {
    logger.error({ error }, 'Failed to emit ride completed event');
  }
};

/**
 * Emit when a user requests to join a ride
 * Send notification to the ride owner (rider)
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
  riderId: string
) => {
  try {
    const io = getIO();
    // Emit to the ride owner
    io.to(`user:${riderId}`).emit(SOCKET_EVENTS.REQUEST_CREATED, {
      timestamp: new Date().toISOString(),
      data: requestData,
    });
    logger.info(
      { requestId: requestData.id, riderId },
      'Request created event emitted to rider'
    );
  } catch (error) {
    logger.error({ error }, 'Failed to emit request created event');
  }
};

/**
 * Emit when a rider accepts a passenger's request
 * Send notification to the passenger
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
    startLocation: string;
    endLocation: string;
    departureTime: string;
    fare: number;
  }
) => {
  try {
    const io = getIO();
    // Emit to the passenger who sent the request
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
      'Request accepted event emitted to passenger'
    );
  } catch (error) {
    logger.error({ error }, 'Failed to emit request accepted event');
  }
};

/**
 * Emit when a rider rejects a passenger's request
 * Send notification to the passenger
 */
export const emitRequestRejected = (
  requestData: {
    id: string;
    rideId: string;
    status: string;
  },
  passengerId: string
) => {
  try {
    const io = getIO();
    // Emit to the passenger who sent the request
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
      'Request rejected event emitted to passenger'
    );
  } catch (error) {
    logger.error({ error }, 'Failed to emit request rejected event');
  }
};

/**
 * Emit when a passenger cancels their request
 */
export const emitRequestCancelled = (
  requestId: string,
  rideId: string,
  riderId: string
) => {
  try {
    const io = getIO();
    // Emit to the ride owner
    io.to(`user:${riderId}`).emit(SOCKET_EVENTS.REQUEST_CANCELLED, {
      timestamp: new Date().toISOString(),
      data: {
        requestId,
        rideId,
      },
    });
    logger.info(
      { requestId, riderId },
      'Request cancelled event emitted to rider'
    );
  } catch (error) {
    logger.error({ error }, 'Failed to emit request cancelled event');
  }
};
