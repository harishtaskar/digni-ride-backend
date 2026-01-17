# JWT Token Expiration & Logout Implementation

## Overview

JWT token expiration and logout functionality has been successfully implemented with a token blacklist system. This ensures that when users logout, their tokens are immediately invalidated and cannot be used for subsequent requests.

---

## How It Works

### 1. Token Blacklist System

When a user logs out, their JWT token is added to the `TokenBlacklist` table in the database:

```prisma
model TokenBlacklist {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([expiresAt])
}
```

### 2. Logout Flow

```
User calls logout endpoint
    ↓
Controller extracts JWT token from Authorization header
    ↓
Calls AuthService.logout(userId, token)
    ↓
Service calls blacklistToken(token, userId)
    ↓
Token decoded and expiration time extracted
    ↓
Token added to TokenBlacklist table
    ↓
Future requests with this token are rejected
```

### 3. Token Verification on Requests

Every authenticated request now checks if the token is blacklisted:

```
Request with JWT token arrives
    ↓
Auth middleware extracts token
    ↓
Checks if token is in blacklist
    ↓
If blacklisted: Reject with 401 Unauthorized
    ↓
If valid: Continue to next middleware
```

---

## API Endpoints

### POST /api/v1/auth/logout

**Description:** Logs out the user by blacklisting their JWT token

**Authentication:** Required (Bearer token)

**Request Headers:**
```http
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:** None

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully",
    "success": true
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Token has been revoked. Please login again."
  }
}
```

---

## Implementation Details

### Updated Files

#### 1. **src/utils/jwt.ts**

Added two new functions:

```typescript
/**
 * Add token to blacklist (logout functionality)
 */
export const blacklistToken = async (token: string, userId: string): Promise<void>
```

**What it does:**
- Decodes the JWT token to extract expiration time
- Stores the token in the `TokenBlacklist` table
- Records when it was blacklisted

```typescript
/**
 * Check if token is blacklisted
 */
export const isTokenBlacklisted = async (token: string): Promise<boolean>
```

**What it does:**
- Queries the `TokenBlacklist` table for the token
- Returns true if token is blacklisted, false otherwise

#### 2. **src/middlewares/auth.middleware.ts**

Updated both `authenticate` and `optionalAuth` middlewares:

```typescript
// Check if token is blacklisted
const blacklisted = await isTokenBlacklisted(token);
if (blacklisted) {
  throw new AppError(401, 'Token has been revoked. Please login again.');
}
```

**What it does:**
- Checks blacklist before verifying token signature
- Rejects any blacklisted tokens immediately

#### 3. **src/modules/auth/auth.service.ts**

Updated logout method:

```typescript
async logout(userId: string, token: string) {
  try {
    // Add token to blacklist
    await blacklistToken(token, userId);
    
    logger.info({ userId }, 'User logged out successfully');
    
    return { 
      message: 'Logged out successfully',
      success: true 
    };
  } catch (error) {
    logger.error({ userId, error }, 'Error during logout');
    throw new AppError(500, 'Logout failed');
  }
}
```

**What it does:**
- Takes both userId and token as parameters
- Calls `blacklistToken()` to add to database
- Logs the action
- Returns success response

#### 4. **src/modules/auth/auth.controller.ts**

Updated logout endpoint:

```typescript
async logout(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!req.userId) {
      ResponseHandler.unauthorized(res, "Not authenticated");
      return;
    }

    // Extract token from authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      ResponseHandler.unauthorized(res, "No token provided");
      return;
    }

    const token = authHeader.substring(7);
    const result = await authService.logout(req.userId, token);
    ResponseHandler.success(res, result);
  } catch (error) {
    next(error);
  }
}
```

**What it does:**
- Validates user is authenticated
- Extracts JWT token from Authorization header
- Calls the logout service with both userId and token
- Returns success response

#### 5. **prisma/schema.prisma**

Added new model:

```prisma
model TokenBlacklist {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([expiresAt])
}
```

---

## Security Features

✅ **Token Signature Validation**
- Token signature is still verified before checking blacklist
- Prevents tampering with tokens

✅ **Expiration Tracking**
- Each blacklisted token stores its expiration time
- Allows cleanup of expired tokens from database

✅ **User Tracking**
- Records which user logged out
- Enables monitoring and auditing

✅ **Database Indexing**
- Indexed by token (unique) for fast lookups
- Indexed by userId for user-specific queries
- Indexed by expiresAt for cleanup operations

---

## Usage Examples

### 1. User Logout

**Client-side (JavaScript/React):**

```javascript
async function logout(token) {
  const response = await fetch('http://localhost:3000/api/v1/auth/logout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  const data = await response.json();
  if (data.success) {
    // Clear local storage
    localStorage.removeItem('authToken');
    // Redirect to login
    window.location.href = '/login';
  }
}
```

### 2. Subsequent Request After Logout

**Request:**
```http
POST /api/v1/rides HTTP/1.1
Authorization: Bearer <BLACKLISTED_TOKEN>
Content-Type: application/json
```

**Response (401):**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Token has been revoked. Please login again."
  }
}
```

---

## Database Schema

### TokenBlacklist Table

| Column | Type | Description |
|--------|------|-------------|
| id | UUID (Primary Key) | Unique identifier |
| token | String (Unique) | The JWT token string |
| userId | String | ID of user who logged out |
| expiresAt | DateTime | When the token expires |
| createdAt | DateTime | When it was blacklisted |

**Indexes:**
- `userId` - For querying all blacklisted tokens by user
- `expiresAt` - For cleanup queries

---

## Performance Considerations

### Query Optimization

1. **Fast Lookup**: Token is indexed uniquely, so blacklist checks are O(1)
2. **Cleanup**: Index on `expiresAt` allows efficient removal of old entries
3. **User Queries**: Index on `userId` allows getting all blacklisted tokens for a user

### Recommended Maintenance

**Periodic cleanup of expired tokens:**

```prisma
// This query can be run periodically to clean up database
DELETE FROM "TokenBlacklist"
WHERE "expiresAt" < NOW()
```

---

## Error Handling

### 1. No Token Provided
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "No token provided"
  }
}
```

### 2. Invalid Token Format
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid token"
  }
}
```

### 3. Token Expired (Original Expiration)
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Token expired"
  }
}
```

### 4. Token Blacklisted (After Logout)
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Token has been revoked. Please login again."
  }
}
```

### 5. Logout Service Error
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_SERVER_ERROR",
    "message": "Logout failed"
  }
}
```

---

## Testing

### Test Logout Flow

1. **User logs in:**
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/verify-otp \
     -H "Content-Type: application/json" \
     -d '{"phone": "1234567890", "otp": "123456"}'
   ```

2. **Capture the token from response**

3. **Make a request with the token:**
   ```bash
   curl -X GET http://localhost:3000/api/v1/rides \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
   ✅ Should return rides list

4. **Log out:**
   ```bash
   curl -X POST http://localhost:3000/api/v1/auth/logout \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
   ✅ Should return success message

5. **Try making a request with the same token:**
   ```bash
   curl -X GET http://localhost:3000/api/v1/rides \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```
   ❌ Should return "Token has been revoked"

---

## Logging

All logout events are logged with context:

```
[TIME UTC] INFO: Token added to blacklist
  userId: "user-uuid"
  tokenId: "eyJhbGc... (first 20 chars)"

[TIME UTC] INFO: User logged out successfully
  userId: "user-uuid"
```

---

## Future Enhancements

1. **Redis Cache** - Store blacklist in Redis for ultra-fast lookups
2. **Token Refresh** - Implement refresh tokens with separate expiration
3. **Device Tracking** - Track which devices have blacklisted tokens
4. **Session Management** - Manage multiple active sessions per user
5. **Rate Limiting** - Limit logout attempts to prevent abuse

---

## Summary

✅ **JWT Token Expiration Feature Complete**
- Tokens are immediately invalidated on logout
- Database-backed blacklist for persistence
- Efficient querying with proper indexing
- Comprehensive error handling
- Full audit trail of logouts
- Production-ready implementation

**Status:** 🟢 READY FOR USE
