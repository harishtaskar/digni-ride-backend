import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { config } from './env';

export let io: SocketIOServer;

export const initializeSocket = (httpServer: HTTPServer): SocketIOServer => {
  logger.info('Initializing Socket.IO...');
  
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.app.corsOrigin || '*',
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
  });

  logger.info('Socket.IO initialized successfully');

  // Middleware to authenticate socket connections (optional, can be expanded later)
  io.use((socket: Socket, next) => {
    logger.debug(`Socket middleware check for socket ID: ${socket.id}`);
    next();
  });

  // Connection event handler
  io.on("connection", (socket: Socket) => {
    logger.info(`New socket connection: ${socket.id}`);

    // Handle user joining their personal room
    socket.on("user:join", (userId: string) => {
      socket.join(`user:${userId}`);
      logger.info(
        { socketId: socket.id, userId },
        "User joined their personal room",
      );
    });

    // Handle user leaving their personal room
    socket.on("user:leave", (userId: string) => {
      socket.leave(`user:${userId}`);
      logger.info(
        { socketId: socket.id, userId },
        "User left their personal room",
      );
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });

    // Handle errors
    socket.on("error", (error: Error) => {
      logger.error({ error, socketId: socket.id }, "Socket error");
    });
  });

  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initializeSocket first.');
  }
  return io;
};
