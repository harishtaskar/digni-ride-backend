# Address Module - Testing Guide

## Prerequisites
- Backend server running (npm run dev)
- Valid JWT token for authentication
- Postman or cURL for API testing

## Test Cases

### 1. Create Address (User 1)
**Endpoint**: `POST /api/v1/addresses`

**Headers**:
```
Authorization: Bearer <USER1_TOKEN>
Content-Type: application/json
```

**Request Body**:
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

**Expected Response** (201):
```json
{
  "id": "addr-uuid-1",
  "userId": "user1-uuid",
  "title": "Home",
  "address": { ... },
  "createdAt": "2026-01-17T...",
  "updatedAt": "2026-01-17T..."
}
```

---

### 2. Create Second Address (User 1)
**Endpoint**: `POST /api/v1/addresses`

**Headers**:
```
Authorization: Bearer <USER1_TOKEN>
```

**Request Body**:
```json
{
  "title": "Office",
  "address": {
    "street": "456 Tech Boulevard",
    "city": "San Francisco",
    "state": "CA",
    "zipCode": "94105",
    "country": "USA"
  }
}
```

**Expected Response** (201):
- Returns new address with different ID

---

### 3. Get All Addresses (User 1)
**Endpoint**: `GET /api/v1/addresses`

**Headers**:
```
Authorization: Bearer <USER1_TOKEN>
```

**Expected Response** (200):
```json
[
  {
    "id": "addr-uuid-1",
    "userId": "user1-uuid",
    "title": "Home",
    "address": { ... },
    "createdAt": "...",
    "updatedAt": "..."
  },
  {
    "id": "addr-uuid-2",
    "userId": "user1-uuid",
    "title": "Office",
    "address": { ... },
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

---

### 4. Get Specific Address (User 1)
**Endpoint**: `GET /api/v1/addresses/addr-uuid-1`

**Headers**:
```
Authorization: Bearer <USER1_TOKEN>
```

**Expected Response** (200):
```json
{
  "id": "addr-uuid-1",
  "userId": "user1-uuid",
  "title": "Home",
  "address": { ... },
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

### 5. Update Address (User 1)
**Endpoint**: `PUT /api/v1/addresses/addr-uuid-1`

**Headers**:
```
Authorization: Bearer <USER1_TOKEN>
Content-Type: application/json
```

**Request Body**:
```json
{
  "title": "Home Sweet Home"
}
```

**Expected Response** (200):
```json
{
  "id": "addr-uuid-1",
  "userId": "user1-uuid",
  "title": "Home Sweet Home",
  "address": { ... },
  "createdAt": "...",
  "updatedAt": "2026-01-17T..." // Updated timestamp
}
```

---

### 6. Delete Address (User 1)
**Endpoint**: `DELETE /api/v1/addresses/addr-uuid-1`

**Headers**:
```
Authorization: Bearer <USER1_TOKEN>
```

**Expected Response** (200):
```json
{
  "message": "Address deleted successfully"
}
```

---

## Security Tests

### 7. Cross-User Access Test (User 2 accessing User 1's address)
**Endpoint**: `GET /api/v1/addresses/addr-uuid-2`

**Headers**:
```
Authorization: Bearer <USER2_TOKEN>
```

**Expected Response** (403):
```json
{
  "error": "You can only view your own addresses"
}
```

---

### 8. Cross-User Update Test (User 2 updating User 1's address)
**Endpoint**: `PUT /api/v1/addresses/addr-uuid-2`

**Headers**:
```
Authorization: Bearer <USER2_TOKEN>
Content-Type: application/json
```

**Request Body**:
```json
{
  "title": "Hacked"
}
```

**Expected Response** (403):
```json
{
  "error": "You can only update your own addresses"
}
```

---

### 9. Cross-User Delete Test (User 2 deleting User 1's address)
**Endpoint**: `DELETE /api/v1/addresses/addr-uuid-2`

**Headers**:
```
Authorization: Bearer <USER2_TOKEN>
```

**Expected Response** (403):
```json
{
  "error": "You can only delete your own addresses"
}
```

---

## Validation Tests

### 10. Invalid Title (Empty)
**Endpoint**: `POST /api/v1/addresses`

**Request Body**:
```json
{
  "title": "",
  "address": { "street": "123 Main" }
}
```

**Expected Response** (400):
```json
{
  "error": "Title is required"
}
```

---

### 11. Invalid Title (Too Long)
**Endpoint**: `POST /api/v1/addresses`

**Request Body**:
```json
{
  "title": "This is a very long address title that exceeds the maximum allowed length of fifty characters",
  "address": { "street": "123 Main" }
}
```

**Expected Response** (400):
```json
{
  "error": "Title too long"
}
```

---

### 12. Invalid Address (Empty)
**Endpoint**: `POST /api/v1/addresses`

**Request Body**:
```json
{
  "title": "Home",
  "address": {}
}
```

**Expected Response** (400):
```json
{
  "error": "Address details cannot be empty"
}
```

---

### 13. Missing Required Fields
**Endpoint**: `POST /api/v1/addresses`

**Request Body**:
```json
{
  "title": "Home"
}
```

**Expected Response** (400):
```json
{
  "error": "Address is required"
}
```

---

## Authentication Tests

### 14. Missing Authorization Header
**Endpoint**: `GET /api/v1/addresses`

**Expected Response** (401):
```json
{
  "error": "Unauthorized"
}
```

---

### 15. Invalid Token
**Endpoint**: `GET /api/v1/addresses`

**Headers**:
```
Authorization: Bearer INVALID_TOKEN
```

**Expected Response** (401):
```json
{
  "error": "Unauthorized"
}
```

---

## Edge Cases

### 16. Non-existent Address
**Endpoint**: `GET /api/v1/addresses/non-existent-id`

**Headers**:
```
Authorization: Bearer <USER1_TOKEN>
```

**Expected Response** (404):
```json
{
  "error": "Address not found"
}
```

---

### 17. Partial Update
**Endpoint**: `PUT /api/v1/addresses/addr-uuid-1`

**Request Body**:
```json
{
  "address": {
    "street": "789 New Street"
  }
}
```

**Expected Response** (200):
- Title remains unchanged
- Only address field is updated
- updatedAt timestamp changes

---

### 18. Create Multiple Addresses with Same Title
**Endpoint**: `POST /api/v1/addresses` (twice)

**Request Body** (both calls):
```json
{
  "title": "Office",
  "address": { "city": "San Francisco" }
}
```

**Expected Response** (201 both times):
- Both addresses created successfully
- Different IDs
- Same title allowed

---

## Performance Tests

### 19. Get Addresses with Large List
- Create 100+ addresses for User 1
- Call `GET /api/v1/addresses`
- Verify response time < 1 second
- Verify all addresses returned in correct order (newest first)

---

## Data Integrity Tests

### 20. Cascade Delete
1. Create User 1 with 3 addresses
2. Delete User 1 from database
3. Verify all User 1 addresses are automatically deleted

---

## cURL Examples

### Create Address
```bash
curl -X POST http://localhost:3000/api/v1/addresses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Home",
    "address": {
      "street": "123 Main Street",
      "city": "San Francisco"
    }
  }'
```

### Get All Addresses
```bash
curl -X GET http://localhost:3000/api/v1/addresses \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Get Specific Address
```bash
curl -X GET http://localhost:3000/api/v1/addresses/ADDR_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Update Address
```bash
curl -X PUT http://localhost:3000/api/v1/addresses/ADDR_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "title": "Home Sweet Home"
  }'
```

### Delete Address
```bash
curl -X DELETE http://localhost:3000/api/v1/addresses/ADDR_ID \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Test Results Summary

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Create Address | ✓ | Pass |
| 2 | Create Second Address | ✓ | Pass |
| 3 | Get All Addresses | ✓ | Pass |
| 4 | Get Specific Address | ✓ | Pass |
| 5 | Update Address | ✓ | Pass |
| 6 | Delete Address | ✓ | Pass |
| 7 | Cross-User Get (403) | ✓ | Pass |
| 8 | Cross-User Update (403) | ✓ | Pass |
| 9 | Cross-User Delete (403) | ✓ | Pass |
| 10 | Empty Title (400) | ✓ | Pass |
| 11 | Long Title (400) | ✓ | Pass |
| 12 | Empty Address (400) | ✓ | Pass |
| 13 | Missing Fields (400) | ✓ | Pass |
| 14 | No Auth Header (401) | ✓ | Pass |
| 15 | Invalid Token (401) | ✓ | Pass |
| 16 | Non-existent ID (404) | ✓ | Pass |
| 17 | Partial Update | ✓ | Pass |
| 18 | Duplicate Titles | ✓ | Pass |
| 19 | Performance | ✓ | Pass |
| 20 | Cascade Delete | ✓ | Pass |
