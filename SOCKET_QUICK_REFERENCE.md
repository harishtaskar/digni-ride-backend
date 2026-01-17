# Socket Events - Quick Reference Guide

## 🚀 Quick Start

### Server Start
```bash
npm run dev
```

Expected output:
```
✓ Database connected successfully
✓ Socket.IO initialized successfully
✓ 🚀 Server running on port 3000
✓ 🔌 WebSocket: ws://localhost:3000
```

---

## 📡 Client Connection Example

```javascript
import io from 'socket.io-client';

// Connect to server
const socket = io('http://localhost:3000');

// Join personal room when authenticated
socket.on('connect', () => {
  const userId = 'your-user-id'; // From auth
  socket.emit('user:join', userId);
});

// Disconnect
socket.emit('user:leave', userId);
socket.disconnect();
```

---

## 📝 All Socket Events

### RIDE EVENTS
```
Event: ride:created
├─ Broadcast: All connected clients
├─ Trigger: POST /api/v1/rides
└─ Contains: Full ride details with rider info

Event: ride:cancelled
├─ Broadcast: All connected clients
├─ Trigger: DELETE /api/v1/rides/:id
└─ Contains: rideId, riderId

Event: ride:completed
├─ Broadcast: All connected clients
├─ Trigger: POST /api/v1/rides/:id/complete
└─ Contains: rideId, riderId
```

### REQUEST EVENTS
```
Event: request:created
├─ Target: Ride owner (user:riderId room)
├─ Trigger: POST /api/v1/rides/:rideId/request
└─ Contains: Request ID, passenger info, ride ID

Event: request:accepted
├─ Target: Requesting passenger (user:passengerId room)
├─ Trigger: POST /api/v1/requests/:requestId/accept
└─ Contains: Request ID, ride details, status

Event: request:rejected
├─ Target: Requesting passenger (user:passengerId room)
├─ Trigger: POST /api/v1/requests/:requestId/reject
└─ Contains: Request ID, ride ID, status

Event: request:cancelled
├─ Target: Ride owner (user:riderId room)
├─ Trigger: DELETE /api/v1/requests/:requestId
└─ Contains: Request ID, ride ID
```

---

## 💡 Implementation Checklist

### For Frontend Developers

- [ ] Install socket.io-client: `npm install socket.io-client`
- [ ] Create socket connection on app initialization
- [ ] Emit `user:join` with userId after authentication
- [ ] Set up event listeners for all socket events
- [ ] Update UI when events are received
- [ ] Emit `user:leave` before logout
- [ ] Add error handling for socket disconnections
- [ ] Implement reconnection logic

### Sample Listener Implementation

```javascript
// Listen for all 7 events

// Ride events
socket.on('ride:created', (data) => {
  console.log('New ride:', data);
  // Update rides list in UI
});

socket.on('ride:cancelled', (data) => {
  console.log('Ride cancelled:', data.rideId);
  // Remove from active rides
});

socket.on('ride:completed', (data) => {
  console.log('Ride completed:', data.rideId);
  // Mark as completed
});

// Request events
socket.on('request:created', (data) => {
  console.log('New request:', data);
  // Show notification to rider
});

socket.on('request:accepted', (data) => {
  console.log('Request accepted:', data);
  // Show ride confirmation to passenger
});

socket.on('request:rejected', (data) => {
  console.log('Request rejected:', data.requestId);
  // Notify passenger
});

socket.on('request:cancelled', (data) => {
  console.log('Request cancelled:', data.requestId);
  // Update requests list for rider
});

// Connection events
socket.on('connect', () => {
  console.log('Connected to server');
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
});

socket.on('error', (error) => {
  console.error('Socket error:', error);
});
```

---

## 🔗 API Endpoints → Socket Events

| API Action | Endpoint | Socket Event | Target |
|-----------|----------|--------------|--------|
| Create Ride | POST /api/v1/rides | `ride:created` | All |
| Cancel Ride | DELETE /api/v1/rides/:id | `ride:cancelled` | All |
| Complete Ride | POST /api/v1/rides/:id/complete | `ride:completed` | All |
| Request Join | POST /api/v1/rides/:rideId/request | `request:created` | Rider |
| Accept Request | POST /api/v1/requests/:requestId/accept | `request:accepted` | Passenger |
| Reject Request | POST /api/v1/requests/:requestId/reject | `request:rejected` | Passenger |
| Cancel Request | DELETE /api/v1/requests/:requestId | `request:cancelled` | Rider |

---

## 🧪 Testing Socket Events

### Using WebSocket Client

```bash
# Install wscat
npm install -g wscat

# Connect to WebSocket
wscat -c ws://localhost:3000

# In another terminal, make API calls to trigger events
curl -X POST http://localhost:3000/api/v1/rides \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startLocation": {"lat": 0, "lng": 0},
    "endLocation": {"lat": 1, "lng": 1},
    "departureTime": "2025-01-20T10:00:00Z"
  }'
```

### Using Socket.IO Client Library

See [SOCKET_INTEGRATION.md](SOCKET_INTEGRATION.md) for detailed examples.

---

## 🔧 Troubleshooting

### Socket not connecting
- Check WebSocket is enabled in frontend
- Verify CORS settings are correct
- Check server is running on correct port
- Look for errors in browser console

### Events not received
- Make sure user is in correct room (`user:join` called)
- Verify socket connection is established
- Check event listener is properly set up
- Check server logs for emission errors

### Room management
```javascript
// Join personal room (after authentication)
socket.emit('user:join', userId);

// Leave personal room (before logout)
socket.emit('user:leave', userId);

// Check if in room
socket.rooms; // Shows all rooms user is in
```

---

## 📊 Event Data Structures

### ride:created
```json
{
  "id": "uuid",
  "rideNumber": "ABC12345",
  "rider": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "profilePhoto": "url"
  },
  "startLocation": "123 Main St",
  "endLocation": "456 Park Ave",
  "departureTime": "2025-01-20T10:00:00Z",
  "availableSeats": 1,
  "fare": 0
}
```

### request:created
```json
{
  "id": "uuid",
  "rideId": "uuid",
  "passenger": {
    "id": "uuid",
    "firstName": "Jane",
    "lastName": "Smith",
    "profilePhoto": "url",
    "rating": 4.5
  },
  "status": "PENDING"
}
```

### request:accepted
```json
{
  "requestId": "uuid",
  "rideId": "uuid",
  "status": "ACCEPTED",
  "rideDetails": {
    "id": "uuid",
    "rideNumber": "ABC12345",
    "startLocation": "123 Main St",
    "endLocation": "456 Park Ave",
    "departureTime": "2025-01-20T10:00:00Z",
    "fare": 0
  }
}
```

---

## 📚 File References

- **Socket Configuration**: [src/config/socket.ts](src/config/socket.ts)
- **Event Emissions**: [src/sockets/socket.events.ts](src/sockets/socket.events.ts)
- **Ride Controller**: [src/modules/rides/ride.controller.ts](src/modules/rides/ride.controller.ts)
- **Request Controller**: [src/modules/requests/request.controller.ts](src/modules/requests/request.controller.ts)
- **Full Documentation**: [SOCKET_INTEGRATION.md](SOCKET_INTEGRATION.md)

---

## ✨ Key Points

✅ 7 socket events fully integrated  
✅ User room management implemented  
✅ Error handling and logging in place  
✅ CORS configured for socket connections  
✅ Real-time notifications working  
✅ All TypeScript types checked  
✅ Zero compilation errors  
✅ Server tested and running  

---

*Last Updated: January 17, 2026*
*Socket Integration Status: ✅ COMPLETE*
