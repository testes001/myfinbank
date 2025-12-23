/**
 * JWT Token Management
 */

import jwt from 'jsonwebtoken';
import { config } from '@/config';
import { log } from '@/utils/logger';

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
}

export interface DecodedToken extends TokenPayload {
  iat: number;
  exp: number;
}

/**
 * Generate access token (short-lived)
 */
export function generateAccessToken(payload: TokenPayload): string {
  try {
    const options: jwt.SignOptions = {
      expiresIn: config.jwtAccessExpiry,
      issuer: 'finbank-api',
      audience: 'finbank-client',
    };
    return jwt.sign(payload, config.jwtSecret as jwt.Secret, options);
  } catch (error) {
    log.error('Failed to generate access token', error as Error);
    throw new Error('Token generation failed');
  }
}

/**
 * Generate refresh token (long-lived)
 */
export function generateRefreshToken(payload: TokenPayload): string {
  try {
    const options: jwt.SignOptions = {
      expiresIn: config.jwtRefreshExpiry,
      issuer: 'finbank-api',
      audience: 'finbank-client',
    };
    return jwt.sign(payload, config.jwtSecret as jwt.Secret, options);
  } catch (error) {
    log.error('Failed to generate refresh token', error as Error);
    throw new Error('Token generation failed');
  }
}

/**
 * Verify and decode access token
 */
export function verifyAccessToken(token: string): DecodedToken {
  try {
    return jwt.verify(token, config.jwtSecret as jwt.Secret, {
      issuer: 'finbank-api',
      audience: 'finbank-client',
    }) as DecodedToken;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw new Error('Token verification failed');
  }
}

/**
 * Verify and decode refresh token
 */
export function verifyRefreshToken(token: string): DecodedToken {
  try {
    return jwt.verify(token, config.jwtSecret as jwt.Secret, {
      issuer: 'finbank-api',
      audience: 'finbank-client',
    }) as DecodedToken;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    throw new Error('Refresh token verification failed');
  }
}

/**
 * Decode token without verification (for debugging)
 */
export function decodeToken(token: string): DecodedToken | null {
  try {
    return jwt.decode(token) as DecodedToken;
  } catch (error) {
    return null;
  }
}

/**
 * Extract token from Authorization header
 */
export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}
