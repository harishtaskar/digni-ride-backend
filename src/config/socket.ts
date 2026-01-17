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
  io.on('connection', (socket: Socket) => {
    logger.info(`New socket connection: ${socket.id}`);

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });

    // Handle errors
    socket.on('error', (error: Error) => {
      logger.error({ error, socketId: socket.id }, 'Socket error');
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
