# Address Management API Endpoints

## Overview
The Address API allows users to manage their saved addresses. Each user can create, retrieve, update, and delete their own addresses.

## Base URL
```
/api/v1/addresses
```

## Authentication
All endpoints require authentication. Include the JWT token in the `Authorization` header:
```
Authorization: Bearer <JWT_TOKEN>
```

---

## Endpoints

### 1. Create Address
**POST** `/api/v1/addresses`

Create a new address for the logged-in user.

**Request Body:**
```json
{
  "title": "Home",
  "address": {
    "street": "123 Main Street",
    "city": "San Francisco",
    "state": "CA",
    "zipCode": "94102",
    "country": "USA",
    "latitude": 37.7749,
    "longitude": -122.4194
  }
}
```

**Response (201 Created):**
```json
{
  "id": "addr-uuid-1234",
  "userId": "user-uuid-5678",
  "title": "Home",
  "address": {
    "street": "123 Main Street",
    "city": "San Francisco",
    "state": "CA",
    "zipCode": "94102",
    "country": "USA",
    "latitude": 37.7749,
    "longitude": -122.4194
  },
  "createdAt": "2026-01-17T10:30:00.000Z",
  "updatedAt": "2026-01-17T10:30:00.000Z"
}
```

---

### 2. Get All Addresses
**GET** `/api/v1/addresses`

Retrieve all addresses belonging to the logged-in user.

**Query Parameters:**
None

**Response (200 OK):**
```json
[
  {
    "id": "addr-uuid-1234",
    "userId": "user-uuid-5678",
    "title": "Home",
    "address": { ... },
    "createdAt": "2026-01-17T10:30:00.000Z",
    "updatedAt": "2026-01-17T10:30:00.000Z"
  },
  {
    "id": "addr-uuid-5678",
    "userId": "user-uuid-5678",
    "title": "Office",
    "address": { ... },
    "createdAt": "2026-01-17T10:35:00.000Z",
    "updatedAt": "2026-01-17T10:35:00.000Z"
  }
]
```

---

### 3. Get Address by ID
**GET** `/api/v1/addresses/:id`

Retrieve a specific address by its ID. Users can only access their own addresses.

**Path Parameters:**
- `id` (string, required): The unique identifier of the address

**Response (200 OK):**
```json
{
  "id": "addr-uuid-1234",
  "userId": "user-uuid-5678",
  "title": "Home",
  "address": { ... },
  "createdAt": "2026-01-17T10:30:00.000Z",
  "updatedAt": "2026-01-17T10:30:00.000Z"
}
```

**Error Responses:**
- 404 Not Found: Address not found
- 403 Forbidden: You can only view your own addresses

---

### 4. Update Address
**PUT** `/api/v1/addresses/:id`

Update a specific address. Users can only update their own addresses.

**Path Parameters:**
- `id` (string, required): The unique identifier of the address

**Request Body:**
```json
{
  "title": "Home Office",
  "address": {
    "street": "123 Main Street",
    "city": "San Francisco",
    "state": "CA",
    "zipCode": "94102",
    "country": "USA",
    "latitude": 37.7749,
    "longitude": -122.4194
  }
}
```

**Response (200 OK):**
```json
{
  "id": "addr-uuid-1234",
  "userId": "user-uuid-5678",
  "title": "Home Office",
  "address": { ... },
  "createdAt": "2026-01-17T10:30:00.000Z",
  "updatedAt": "2026-01-17T10:40:00.000Z"
}
```

**Error Responses:**
- 404 Not Found: Address not found
- 403 Forbidden: You can only update your own addresses

---

### 5. Delete Address
**DELETE** `/api/v1/addresses/:id`

Delete a specific address. Users can only delete their own addresses.

**Path Parameters:**
- `id` (string, required): The unique identifier of the address

**Response (200 OK):**
```json
{
  "message": "Address deleted successfully"
}
```

**Error Responses:**
- 404 Not Found: Address not found
- 403 Forbidden: You can only delete your own addresses

---

## Validation Rules

### Title
- Required field
- Minimum length: 1 character
- Maximum length: 50 characters
- Examples: "Home", "Office", "Office 2", "Parent's House"

### Address
- Required field
- Must be a JSON object with at least one key-value pair
- Can contain any relevant fields:
  - `street`: Street address
  - `city`: City name
  - `state`: State/Province
  - `zipCode`: Postal code
  - `country`: Country name
  - `latitude`: Latitude coordinate (for map display)
  - `longitude`: Longitude coordinate (for map display)
  - Any other custom fields

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Title is required"
}
```

### 401 Unauthorized
```json
{
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "error": "You can only view/update/delete your own addresses"
}
```

### 404 Not Found
```json
{
  "error": "Address not found"
}
```

---

## User Scoping

- Users can only create addresses for themselves
- Users can only retrieve their own addresses
- Users can only update their own addresses
- Users can only delete their own addresses
- Attempting to access another user's address will return a 403 Forbidden error

---

## Example Usage

### Create an address
```bash
curl -X POST http://localhost:3000/api/v1/addresses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Home",
    "address": {
      "street": "123 Main Street",
      "city": "San Francisco",
      "state": "CA",
      "zipCode": "94102",
      "country": "USA"
    }
  }'
```

### Get all addresses
```bash
curl -X GET http://localhost:3000/api/v1/addresses \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update an address
```bash
curl -X PUT http://localhost:3000/api/v1/addresses/addr-uuid-1234 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title": "Home Office"
  }'
```

### Delete an address
```bash
curl -X DELETE http://localhost:3000/api/v1/addresses/addr-uuid-1234 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```
