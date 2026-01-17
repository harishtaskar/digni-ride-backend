import cron, { ScheduledTask } from 'node-cron';
import { prisma } from '../config/prisma';
import { logger } from '../utils/logger';
import { RideStatus } from '@prisma/client';

/**
 * Cron job to auto-complete rides when departure time is reached
 * Runs every minute
 */
export const startRideCompletionCron = () => {
  // Schedule to run every minute
  const task = cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      logger.debug({ timestamp: now }, 'Running ride completion cron job');

      // Find rides where departureTime <= current time and status is not COMPLETED
      const ridestoComplete = await prisma.ride.updateMany({
        where: {
          departureTime: {
            lte: now,
          },
          status: {
            not: RideStatus.COMPLETED,
          },
        },
        data: {
          status: RideStatus.COMPLETED,
        },
      });

      if (ridestoComplete.count > 0) {
        logger.info(
          { count: ridestoComplete.count, timestamp: now },
          'Auto-completed rides due to departure time reached',
        );
      }
    } catch (error) {
      logger.error(
        { error },
        'Error running ride completion cron job',
      );
    }
  });

  logger.info('Ride completion cron job started (runs every minute)');

  return task;
};

/**
 * Stop the ride completion cron job
 */
export const stopRideCompletionCron = (task: ScheduledTask) => {
  task.stop();
  logger.info('Ride completion cron job stopped');
};
