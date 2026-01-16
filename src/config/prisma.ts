import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { config } from './env';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasourceUrl: config.db.url,
    log: [
      { level: 'query', emit: 'event' },
      { level: 'error', emit: 'stdout' },
      { level: 'warn', emit: 'stdout' },
    ],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Log queries in development
if (process.env.NODE_ENV === 'development') {
  // @ts-ignore - Prisma event type issue
  prisma.$on('query', (e: any) => {
    logger.debug({ query: e.query, params: e.params, duration: e.duration }, 'Prisma Query');
  });
}

// Handle graceful shutdown
export const disconnectPrisma = async () => {
  await prisma.$disconnect();
  logger.info('Prisma disconnected');
};
