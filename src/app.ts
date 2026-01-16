import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

// Import routes
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import rideRoutes from './modules/rides/ride.routes';
import requestRoutes from './modules/requests/request.routes';
import feedbackRoutes from './modules/feedback/feedback.routes';

export const createApp = (): Application => {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
  });
  app.use('/api/', limiter);

  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // API routes - v1
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/rides', rideRoutes);
  app.use('/api/v1', requestRoutes);
  app.use('/api/v1/feedback', feedbackRoutes);

  // Root endpoint
  app.get('/', (_req, res) => {
    res.json({
      message: 'Digni Ride API - Motorcycle Ride Sharing Platform',
      version: '1.0.0',
      endpoints: {
        health: '/health',
        api: '/api/v1',
        auth: '/api/v1/auth',
        users: '/api/v1/users',
        rides: '/api/v1/rides',
        requests: '/api/v1/requests',
        feedback: '/api/v1/feedback',
      },
    });
  });

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
