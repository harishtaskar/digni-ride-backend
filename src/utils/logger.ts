import pino from 'pino';
import { config } from '../config/env';

export const logger = pino({
  level: config.log.level,
  transport:
    config.app.env === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});
