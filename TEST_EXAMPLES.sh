# API Testing Examples (using curl)

## Setup
export BASE_URL="http://localhost:3000/api/v1"
export TOKEN=""  # Will be set after login

## 1. Health Check
curl http://localhost:3000/health | jq

## 2. Login (Send OTP)
curl -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "name": "John Rider",
    "city": "Bangalore"
  }' | jq

## 3. Verify OTP (use OTP from previous response in dev mode)
curl -X POST $BASE_URL/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9876543210",
    "otp": "123456"
  }' | jq

# Set the token from response
export TOKEN="paste-token-here"

## 4. Get My Profile
curl -X GET $BASE_URL/users/me \
  -H "Authorization: Bearer $TOKEN" | jq

## 5. Update Profile (Add Vehicle Number)
curl -X PATCH $BASE_URL/users/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleNumber": "KA01AB1234"
  }' | jq

## 6. Create a Ride
curl -X POST $BASE_URL/rides \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
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
    "departureTime": "2026-01-25T09:00:00Z",
    "note": "Long highway ride to Chennai"
  }' | jq

# Save ride ID
export RIDE_ID="paste-ride-id-here"

## 7. Browse Rides
curl -X GET "$BASE_URL/rides?status=OPEN&limit=10" | jq

## 8. Get Specific Ride
curl -X GET $BASE_URL/rides/$RIDE_ID | jq

## 9. Register Second User (Passenger)
curl -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9123456789",
    "name": "Jane Passenger",
    "city": "Bangalore"
  }' | jq

curl -X POST $BASE_URL/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "9123456789",
    "otp": "123456"
  }' | jq

# Set passenger token
export PASSENGER_TOKEN="paste-passenger-token-here"

## 10. Request to Join Ride (as Passenger)
curl -X POST $BASE_URL/rides/$RIDE_ID/request \
  -H "Authorization: Bearer $PASSENGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "note": "Going to Chennai for work, would love to join!"
  }' | jq

# Save request ID
export REQUEST_ID="paste-request-id-here"

## 11. View Ride Requests (as Rider)
curl -X GET $BASE_URL/rides/$RIDE_ID/requests \
  -H "Authorization: Bearer $TOKEN" | jq

## 12. Accept Request (as Rider)
curl -X POST $BASE_URL/requests/$REQUEST_ID/accept \
  -H "Authorization: Bearer $TOKEN" | jq

## 13. View Matched Ride
curl -X GET $BASE_URL/rides/$RIDE_ID | jq

## 14. Complete Ride (as Rider)
curl -X POST $BASE_URL/rides/$RIDE_ID/complete \
  -H "Authorization: Bearer $TOKEN" | jq

## 15. Give Feedback (as Rider to Passenger)
curl -X POST $BASE_URL/feedback \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rideId": "'$RIDE_ID'",
    "toUserId": "paste-passenger-user-id",
    "rating": 5,
    "comment": "Great passenger! Very punctual and pleasant."
  }' | jq

## 16. Give Feedback (as Passenger to Rider)
curl -X POST $BASE_URL/feedback \
  -H "Authorization: Bearer $PASSENGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "rideId": "'$RIDE_ID'",
    "toUserId": "paste-rider-user-id",
    "rating": 5,
    "comment": "Excellent rider! Safe and smooth ride."
  }' | jq

## 17. View User Stats
curl -X GET $BASE_URL/users/me/stats \
  -H "Authorization: Bearer $TOKEN" | jq

## 18. View My Feedback
curl -X GET $BASE_URL/feedback/me \
  -H "Authorization: Bearer $TOKEN" | jq

## 19. View My Created Rides
curl -X GET $BASE_URL/rides/me/created \
  -H "Authorization: Bearer $TOKEN" | jq

## 20. View My Joined Rides
curl -X GET $BASE_URL/rides/me/joined \
  -H "Authorization: Bearer $PASSENGER_TOKEN" | jq
