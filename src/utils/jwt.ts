import jwt, { JwtPayload } from 'jsonwebtoken';
import { config } from '../config/env';
import { logger } from './logger';

export interface TokenPayload extends JwtPayload {
  userId: string;
  phone: string;
}

/**
 * Generate JWT token for a user
 */
export const generateToken = (userId: string, phone: string): string => {
  try {
    const secret = config.jwt.secret;
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const options: any = { expiresIn: config.jwt.expiresIn };
    const token = jwt.sign(
      { userId, phone },
      secret,
      options
    );
    return token;
  } catch (error) {
    logger.error({ error }, 'Failed to generate JWT token');
    throw error;
  }
};

/**
 * Verify and decode JWT token
 */
export const verifyToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as TokenPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
};

/**
 * Decode token without verification (useful for debugging)
 */
export const decodeToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.decode(token) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    return Date.now() >= decoded.exp * 1000;
  } catch {
    return true;
  }
};
