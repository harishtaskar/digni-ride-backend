import { createServer } from "http";
import { createApp } from "./app";
import { config } from "./config/env";
import { prisma, disconnectPrisma } from "./config/prisma";
import { initializeSocket } from "./config/socket";
import { logger } from "./utils/logger";
import {
  startRideCompletionCron,
  stopRideCompletionCron,
} from "./cron/ride-completion.cron";
import type { ScheduledTask } from "node-cron";

// Test database connection
const connectDatabase = async () => {
  try {
    await prisma.$connect();
    logger.info("Database connected successfully");
  } catch (error) {
    logger.error({ error }, "Failed to connect to database");
    process.exit(1);
  }
};

// Start server
const startServer = async () => {
  await connectDatabase();

  const expressApp = createApp();
  const httpServer = createServer(expressApp);

  // Initialize Socket.IO
  initializeSocket(httpServer);

  // Start cron jobs
  let rideCompletionCronTask: ScheduledTask;
  rideCompletionCronTask = startRideCompletionCron();

  const server = httpServer.listen(config.app.port, () => {
    logger.info(
      {
        port: config.app.port,
        env: config.app.env,
      },
      `🚀 Server running on port ${config.app.port}`,
    );
    logger.info(`📍 Health check: http://localhost:${config.app.port}/health`);
    logger.info(`🔗 API: http://localhost:${config.app.port}/api/v1`);
    logger.info(`🔌 WebSocket: ws://localhost:${config.app.port}`);
  });

  // Graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully...`);

    // Stop cron jobs
    stopRideCompletionCron(rideCompletionCronTask);

    server.close(async () => {
      logger.info("HTTP server closed");

      await disconnectPrisma();

      logger.info("Shutdown complete");
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      logger.error("Forced shutdown after timeout");
      process.exit(1);
    }, 10000);
  };;

  // Handle shutdown signals
  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  // Handle uncaught errors
  process.on("unhandledRejection", (reason, promise) => {
    logger.error({ reason, promise }, "Unhandled Rejection");
  });

  process.on("uncaughtException", (error) => {
    logger.error({ error }, "Uncaught Exception");
    process.exit(1);
  });
};;

// Start the server
startServer().catch((error) => {
  logger.error({ error }, "Failed to start server");
  process.exit(1);
});
