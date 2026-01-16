# Digni Ride API - Endpoint Documentation

## Base URL
```
http://localhost:3000/api/v1
```

## Authentication
Protected endpoints require `Authorization: Bearer <token>` header.

---

## 📱 Authentication Endpoints

### 1. Login / Send OTP
**POST** `/auth/login`

Request body:
```json
{
  "phone": "9876543210",
  "name": "John Doe",      // Required for new users
  "city": "Bangalore"      // Required for new users
}
```

Response (Development):
```json
{
  "success": true,
  "data": {
    "message": "OTP sent successfully",
    "userId": "uuid",
    "otp": "123456"  // Only in development
  }
}
```

### 2. Verify OTP
**POST** `/auth/verify-otp`

Request body:
```json
{
  "phone": "9876543210",
  "otp": "123456"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "jwt-token-here",
    "user": {
      "id": "uuid",
      "name": "John Doe",
      "phone": "9876543210",
      "city": "Bangalore",
      "vehicleNumber": null
    }
  }
}
```

---

## 👤 User Endpoints

### 3. Get My Profile
**GET** `/users/me` 🔒

Response:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "phone": "9876543210",
    "city": "Bangalore",
    "vehicleNumber": "KA01AB1234",
    "createdAt": "2026-01-17T...",
    "updatedAt": "2026-01-17T..."
  }
}
```

### 4. Update Profile
**PATCH** `/users/me` 🔒

Request body:
```json
{
  "name": "John Smith",
  "city": "Mumbai",
  "vehicleNumber": "MH02CD5678"
}
```

### 5. Get User Stats
**GET** `/users/me/stats` 🔒

Response:
```json
{
  "success": true,
  "data": {
    "ridesCreated": 5,
    "ridesJoined": 3,
    "averageRating": 4.5,
    "totalFeedbacks": 8
  }
}
```

---

## 🏍️ Ride Endpoints

### 6. Create Ride
**POST** `/rides` 🔒

Request body:
```json
{
  "startLocation": {
    "lat": 12.9716,
    "lng": 77.5946,
    "address": "MG Road, Bangalore"
  },
  "endLocation": {
    "lat": 13.0827,
    "lng": 80.2707,
    "address": "Marina Beach, Chennai"
  },
  "departureTime": "2026-01-20T09:00:00Z",
  "note": "Highway ride, prefer experienced riders"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "riderId": "uuid",
    "startLocation": {...},
    "endLocation": {...},
    "departureTime": "2026-01-20T09:00:00Z",
    "status": "OPEN",
    "rider": {
      "id": "uuid",
      "name": "John Doe",
      "vehicleNumber": "KA01AB1234"
    }
  }
}
```

### 7. Get Rides (Browse)
**GET** `/rides?city=Bangalore&status=OPEN&limit=20`

Query parameters:
- `city` (optional): Filter by city
- `status` (optional): OPEN, MATCHED, COMPLETED
- `departureFrom` (optional): ISO datetime
- `departureTo` (optional): ISO datetime
- `limit` (optional): Default 20, max 100
- `offset` (optional): For pagination

Response:
```json
{
  "success": true,
  "data": {
    "rides": [...],
    "pagination": {
      "total": 50,
      "limit": 20,
      "offset": 0
    }
  }
}
```

### 8. Get Ride by ID
**GET** `/rides/:id`

### 9. Complete Ride
**POST** `/rides/:id/complete` 🔒

Only rider can complete. Ride must be MATCHED.

### 10. Cancel Ride
**DELETE** `/rides/:id` 🔒

Only rider can cancel. Ride must be OPEN.

### 11. Get My Created Rides
**GET** `/rides/me/created` 🔒

### 12. Get My Joined Rides
**GET** `/rides/me/joined` 🔒

---

## 📮 Request Endpoints

### 13. Request to Join Ride
**POST** `/rides/:rideId/request` 🔒

Request body:
```json
{
  "note": "I'm heading the same way, would love to join!"
}
```

### 14. Get Ride Requests
**GET** `/rides/:rideId/requests` 🔒

Only rider can view requests for their ride.

### 15. Accept Request
**POST** `/requests/:requestId/accept` 🔒

Only rider can accept. Automatically:
- Sets request to ACCEPTED
- Rejects all other pending requests
- Updates ride status to MATCHED
- Sets passenger on ride

### 16. Reject Request
**POST** `/requests/:requestId/reject` 🔒

Only rider can reject.

### 17. Get My Requests
**GET** `/requests/me` 🔒

View all ride requests you've made.

### 18. Cancel Request
**DELETE** `/requests/:requestId` 🔒

Passenger can cancel their own pending request.

---

## ⭐ Feedback Endpoints

### 19. Submit Feedback
**POST** `/feedback` 🔒

Request body:
```json
{
  "rideId": "uuid",
  "toUserId": "uuid",
  "rating": 5,
  "comment": "Great ride! Very safe and punctual."
}
```

Rules:
- Only for COMPLETED rides
- Only participants can give feedback
- One feedback per user per ride
- Can only rate the other party (rider rates passenger, vice versa)

### 20. Get My Feedback
**GET** `/feedback/me` 🔒

Response:
```json
{
  "success": true,
  "data": {
    "feedback": [...],
    "stats": {
      "totalFeedbacks": 10,
      "averageRating": 4.5,
      "ratingDistribution": {
        "5": 6,
        "4": 3,
        "3": 1,
        "2": 0,
        "1": 0
      }
    }
  }
}
```

### 21. Get User Feedback
**GET** `/feedback/user/:userId`

Public endpoint to view any user's feedback.

### 22. Get Ride Feedback
**GET** `/feedback/ride/:rideId`

View all feedback for a specific ride.

---

## 🔄 Typical User Flows

### Flow 1: Rider Creates a Ride
1. Login → Verify OTP → Get token
2. Update profile with vehicle number
3. Create ride with start/end locations
4. Wait for passenger requests
5. Accept a request (auto-rejects others)
6. Complete the ride
7. Give feedback to passenger

### Flow 2: Passenger Joins a Ride
1. Login → Verify OTP → Get token
2. Browse available rides
3. Request to join a ride
4. Wait for rider to accept
5. Complete the ride
6. Give feedback to rider

---

## 🔒 Protected Endpoints Legend
- 🔒 = Requires authentication (Bearer token)
- No lock = Public endpoint

---

## Error Response Format
```json
{
  "success": false,
  "error": "Error message here"
}
```

Common status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request / Validation Error
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (duplicate)
- `500` - Server Error
