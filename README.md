# Digni Ride - Backend API

A production-ready motorcycle ride-sharing platform backend built with Node.js, TypeScript, Express, PostgreSQL, and Prisma.

## 🚀 Features

- **Phone-based Authentication** - OTP login system (mock implementation for hackathon)
- **Ride Management** - Create, browse, and manage motorcycle rides
- **Request System** - Passengers can request to join rides
- **Transactional Operations** - Accept requests with automatic rejection of other pending requests
- **Feedback System** - Rate and review completed rides
- **User Profiles** - Manage user information and statistics

## 🛠️ Tech Stack

- **Runtime:** Node.js with TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Validation:** Zod
- **Logging:** Pino
- **Security:** Helmet, CORS, Rate Limiting

## 📁 Project Structure

```
src/
├── app.ts                 # Express app configuration
├── server.ts              # Server entry point
├── config/                # Configuration files
│   ├── env.ts            # Environment validation
│   └── prisma.ts         # Prisma client setup
├── middlewares/           # Express middlewares
│   ├── auth.middleware.ts
│   └── error.middleware.ts
├── modules/               # Feature modules
│   ├── auth/             # Authentication
│   ├── users/            # User management
│   ├── rides/            # Ride management
│   ├── requests/         # Ride requests
│   └── feedback/         # Feedback system
└── utils/                 # Utility functions
    ├── logger.ts
    └── response.ts
prisma/
├── schema.prisma          # Database schema
└── migrations/            # Database migrations
```

## 🚦 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- pnpm (or npm)

### Installation

1. **Clone the repository**
   ```bash
   cd digni-ride
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   # or
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and configure your database connection:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/digni_ride?schema=public"
   JWT_SECRET="your-super-secret-jwt-key-minimum-32-characters-long"
   ```

4. **Generate Prisma Client**
   ```bash
   pnpm prisma:generate
   ```

5. **Run database migrations**
   ```bash
   pnpm prisma:migrate
   ```

6. **Start the development server**
   ```bash
   pnpm dev
   ```

The server will start at `http://localhost:3000`

## 📡 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Send OTP to phone
- `POST /api/v1/auth/verify-otp` - Verify OTP and get token
- `POST /api/v1/auth/logout` - Logout (protected)

### Users
- `GET /api/v1/users/me` - Get current user profile (protected)
- `PATCH /api/v1/users/me` - Update profile (protected)
- `GET /api/v1/users/me/stats` - Get user statistics (protected)
- `GET /api/v1/users/:id` - Get user by ID

### Rides
- `POST /api/v1/rides` - Create a ride (protected)
- `GET /api/v1/rides` - Get rides with filters
- `GET /api/v1/rides/:id` - Get ride by ID
- `POST /api/v1/rides/:id/complete` - Complete a ride (protected)
- `DELETE /api/v1/rides/:id` - Cancel a ride (protected)
- `GET /api/v1/rides/me/created` - Get my created rides (protected)
- `GET /api/v1/rides/me/joined` - Get my joined rides (protected)

### Ride Requests
- `POST /api/v1/rides/:rideId/request` - Request to join ride (protected)
- `GET /api/v1/rides/:rideId/requests` - Get ride requests (protected)
- `POST /api/v1/requests/:requestId/accept` - Accept request (protected)
- `POST /api/v1/requests/:requestId/reject` - Reject request (protected)
- `GET /api/v1/requests/me` - Get my requests (protected)
- `DELETE /api/v1/requests/:requestId` - Cancel request (protected)

### Feedback
- `POST /api/v1/feedback` - Create feedback (protected)
- `GET /api/v1/feedback/me` - Get my feedback (protected)
- `GET /api/v1/feedback/user/:userId` - Get user's feedback
- `GET /api/v1/feedback/ride/:rideId` - Get ride feedback

### Health Check
- `GET /health` - Server health status

## 🔒 Authentication

The API uses a mock JWT-based authentication system. In development:

1. Call `/api/v1/auth/login` with phone number
2. Receive OTP in response (only in development mode)
3. Call `/api/v1/auth/verify-otp` with OTP
4. Use returned token in Authorization header: `Bearer <token>`

**Note:** For production, implement actual JWT token generation and SMS OTP delivery.

## 🗃️ Database Schema

### User
- Phone-based authentication
- City and vehicle information
- Relationships to rides, requests, and feedback

### Ride
- Start/end locations (JSON with lat, lng, address)
- Departure time
- Status: OPEN → MATCHED → COMPLETED
- One rider, one passenger (pillion seat)

### RideRequest
- Links passenger to ride
- Status: PENDING → ACCEPTED/REJECTED
- Unique constraint: one request per user per ride

### Feedback
- Rating (1-5) and optional comment
- User role (RIDER/PASSENGER)
- Only for completed rides

## 🧪 Development Scripts

```bash
# Development
pnpm dev              # Start dev server with hot reload

# Database
pnpm prisma:generate  # Generate Prisma Client
pnpm prisma:migrate   # Run migrations
pnpm prisma:studio    # Open Prisma Studio
pnpm db:push          # Push schema changes (dev only)

# Build & Production
pnpm build            # Build TypeScript
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run ESLint
pnpm format           # Format with Prettier
```

## 🏗️ Architecture Principles

### Clean Architecture
- **Separation of Concerns:** Routes → Controllers → Services → Database
- **No Business Logic in Controllers:** Controllers only handle HTTP
- **Service Layer:** All business logic lives in services
- **Validation:** Zod schemas for input validation

### Database Best Practices
- UUID primary keys
- Indexes on frequently queried fields
- Cascading deletes where appropriate
- Transactional operations for critical writes

### Error Handling
- Centralized error middleware
- Custom AppError class
- Zod validation errors
- Prisma error handling
- Development vs production error messages

### Logging
- Structured logging with Pino
- Pretty logs in development
- JSON logs in production
- Request/response logging

## 🔐 Security Features

- **Helmet:** Security headers
- **CORS:** Configurable origin
- **Rate Limiting:** 100 requests per 15 minutes
- **Input Validation:** Zod schemas
- **SQL Injection Protection:** Prisma ORM
- **Environment Variables:** Validated on startup

## 📝 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | development |
| `PORT` | Server port | 3000 |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | JWT secret key (min 32 chars) | - |
| `JWT_EXPIRES_IN` | Token expiration | 7d |
| `OTP_EXPIRY_MINUTES` | OTP validity duration | 5 |
| `LOG_LEVEL` | Logging level | info |
| `CORS_ORIGIN` | CORS origin | * |

## 🚧 TODO for Production

- [ ] Implement actual JWT token generation
- [ ] Integrate SMS OTP service (Twilio/SNS)
- [ ] Add Redis for OTP storage
- [ ] Implement token blacklist for logout
- [ ] Add unit and integration tests
- [ ] Setup CI/CD pipeline
- [ ] Add API documentation (Swagger)
- [ ] Implement WebSocket for real-time updates
- [ ] Add geospatial queries for location-based search
- [ ] Setup monitoring and alerting

## 📄 License

ISC

## 👥 Authors

Digni Ride Team - Hackathon 2026

---

**Built with ❤️ for making motorcycle ride-sharing safer and more accessible**
