/**
 * Authentication Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, extractBearerToken, DecodedToken } from '@/utils/jwt';
import { errors } from '@/middleware/errorHandler';
import { log } from '@/utils/logger';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: DecodedToken;
      requestId?: string;
    }
  }
}

/**
 * Authenticate JWT token
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);

    if (!token) {
      throw errors.unauthorized('No authentication token provided');
    }

    const decoded = verifyAccessToken(token);

    // Attach user to request
    req.user = decoded;

    log.debug('User authenticated', {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    });

    next();
  } catch (error) {
    if (error instanceof Error && error.message.includes('expired')) {
      next(errors.unauthorized('Token expired'));
    } else if (error instanceof Error && error.message.includes('Invalid')) {
      next(errors.unauthorized('Invalid token'));
    } else {
      next(error);
    }
  }
}

/**
 * Optional authentication (doesn't fail if no token)
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const token = extractBearerToken(authHeader);

    if (token) {
      const decoded = verifyAccessToken(token);
      req.user = decoded;
    }

    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
}

/**
 * Authorize specific roles
 */
export function authorize(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(errors.unauthorized());
    }

    if (!allowedRoles.includes(req.user.role)) {
      log.security('Unauthorized access attempt', {
        userId: req.user.userId,
        role: req.user.role,
        requiredRoles: allowedRoles,
        path: req.path,
      });

      return next(errors.forbidden('You do not have permission to access this resource'));
    }

    next();
  };
}

/**
 * Require specific user status
 */
export function requireStatus(status: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // This would check user status from database
    // Placeholder for now
    next();
  };
}

/**
 * Require KYC approval
 */
export function requireKYC(req: Request, res: Response, next: NextFunction) {
  // This would check KYC status from database
  // Placeholder - to be implemented with database integration
  next();
}
