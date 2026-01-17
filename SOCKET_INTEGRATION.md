# Socket Events Integration

This document describes the socket events that have been integrated into the Digni Ride application for real-time notifications.

## Overview

Socket.IO is initialized on the HTTP server and allows real-time communication between the server and connected clients. Users are notified of important ride and request events as they happen.

## Socket Architecture

### Connection Setup
- Socket.IO is initialized in [src/config/socket.ts](src/config/socket.ts)
- Each socket connection allows users to join personal rooms using the pattern `user:{userId}`
- CORS is configured to allow cross-origin connections

### User Room Management
When a client connects and receives their user ID (typically after authentication), they should emit:

```javascript
// Client-side example (React, Vue, etc.)
socket.emit('user:join', userId);
```

To leave their personal room:
```javascript
socket.emit('user:leave', userId);
```

## Socket Events

All socket events are defined and emitted from [src/sockets/socket.events.ts](src/sockets/socket.events.ts)

### Ride Events

#### `ride:created`
**Broadcast to:** All connected users
**Triggered when:** A user creates a new ride
**Data payload:**
```typescript
{
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
  departureTime: string; // ISO 8601 format
  availableSeats: number;
  fare: number;
  motorcycleDetails?: string;
}
```
**Emitted from:** [src/modules/rides/ride.controller.ts](src/modules/rides/ride.controller.ts) - `createRide()` method

#### `ride:cancelled`
**Broadcast to:** All connected users (notifies passengers who requested this ride)
**Triggered when:** A ride is cancelled by the rider
**Data payload:**
```typescript
{
  rideId: string;
  riderId: string;
}
```
**Emitted from:** [src/modules/rides/ride.controller.ts](src/modules/rides/ride.controller.ts) - `cancelRide()` method

#### `ride:completed`
**Broadcast to:** All connected users
**Triggered when:** A ride is marked as completed
**Data payload:**
```typescript
{
  rideId: string;
  riderId: string;
}
```
**Emitted from:** [src/modules/rides/ride.controller.ts](src/modules/rides/ride.controller.ts) - `completeRide()` method

---

### Request Events

#### `request:created`
**Sent to:** The ride owner (rider) via `user:{riderId}` room
**Triggered when:** A passenger sends a request to join a ride
**Data payload:**
```typescript
{
  id: string; // Request ID
  rideId: string;
  passenger: {
    id: string;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
    rating?: number;
  };
  status: string; // "PENDING"
}
```
**Emitted from:** [src/modules/requests/request.controller.ts](src/modules/requests/request.controller.ts) - `createRequest()` method

#### `request:accepted`
**Sent to:** The requesting passenger via `user:{passengerId}` room
**Triggered when:** A rider accepts a passenger's request
**Data payload:**
```typescript
{
  requestId: string;
  rideId: string;
  status: string; // "ACCEPTED"
  rideDetails?: {
    id: string;
    rideNumber: string;
    startLocation: string;
    endLocation: string;
    departureTime: string; // ISO 8601 format
    fare: number;
  };
}
```
**Emitted from:** [src/modules/requests/request.controller.ts](src/modules/requests/request.controller.ts) - `acceptRequest()` method

#### `request:rejected`
**Sent to:** The requesting passenger via `user:{passengerId}` room
**Triggered when:** A rider rejects a passenger's request
**Data payload:**
```typescript
{
  requestId: string;
  rideId: string;
  status: string; // "REJECTED"
}
```
**Emitted from:** [src/modules/requests/request.controller.ts](src/modules/requests/request.controller.ts) - `rejectRequest()` method

#### `request:cancelled`
**Sent to:** The ride owner via `user:{riderId}` room
**Triggered when:** A passenger cancels their request to join a ride
**Data payload:**
```typescript
{
  requestId: string;
  rideId: string;
}
```
**Emitted from:** [src/modules/requests/request.controller.ts](src/modules/requests/request.controller.ts) - `cancelRequest()` method

---

## Client-Side Implementation Examples

### Connect and Join Personal Room
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000');

socket.on('connect', () => {
  console.log('Connected to server');
  // Join personal room after receiving userId (usually from authentication)
  socket.emit('user:join', 'user-id-123');
});
```

### Listen for Ride Events
```javascript
// Listen for new rides
socket.on('ride:created', (data) => {
  console.log('New ride created:', data);
  // Update UI to show new ride
});

// Listen for ride cancellation
socket.on('ride:cancelled', (data) => {
  console.log('Ride cancelled:', data.rideId);
  // Remove ride from UI if showing
});

// Listen for ride completion
socket.on('ride:completed', (data) => {
  console.log('Ride completed:', data.rideId);
  // Mark ride as complete in UI
});
```

### Listen for Request Events (Rider/Passenger)
```javascript
// For riders - listen for incoming requests
socket.on('request:created', (data) => {
  console.log('New request from passenger:', data);
  // Show notification and request details
});

// For passengers - listen for request status updates
socket.on('request:accepted', (data) => {
  console.log('Your request was accepted!', data.rideDetails);
  // Show ride details and confirmation
});

socket.on('request:rejected', (data) => {
  console.log('Your request was rejected');
  // Show rejection message
});

socket.on('request:cancelled', (data) => {
  console.log('Request was cancelled:', data.requestId);
});
```

### Disconnect and Leave Room
```javascript
// Leave personal room before disconnecting
socket.emit('user:leave', 'user-id-123');

// Disconnect from server
socket.disconnect();
```

---

## Error Handling

If Socket.IO is not properly initialized, you may see an error:
```
Error: Socket.IO not initialized. Call initializeSocket first.
```

This is handled gracefully - the socket events will log errors but won't crash the server.

## Testing Socket Events with Postman

You can test socket events using the Postman Collection provided. The socket server is running on the same port as the REST API (default: 3000).

WebSocket URL: `ws://localhost:3000`

## Future Enhancements

Potential socket events to implement in the future:
- `location:update` - Real-time location tracking during ride
- `chat:message` - In-app messaging between rider and passengers
- `ride:started` - Notification when ride starts
- `user:online` / `user:offline` - User availability status
- `typing:indicator` - Show when someone is typing a message
- `payment:processed` - Real-time payment confirmations

---

## Files Modified

- [src/config/socket.ts](src/config/socket.ts) - Socket initialization and connection handling
- [src/sockets/socket.events.ts](src/sockets/socket.events.ts) - Event emission functions
- [src/modules/rides/ride.controller.ts](src/modules/rides/ride.controller.ts) - Ride event emissions
- [src/modules/requests/request.controller.ts](src/modules/requests/request.controller.ts) - Request event emissions
- [src/config/env.ts](src/config/env.ts) - Added CORS_ORIGIN configuration
- [src/server.ts](src/server.ts) - HTTP server setup with Socket.IO initialization
