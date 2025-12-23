/**
 * Admin Authentication Middleware
 * Verify admin JWT tokens and enforce role-based access control
 */

import type { Request, Response, NextFunction } from 'express';
import { errors } from './errorHandler';
import { verifyAccessToken, extractBearerToken } from '@/utils/jwt';
import { log } from '@/utils/logger';
import { prisma } from '@/config/database';
import { AdminRole } from '@prisma/client';

// =============================================================================
// Type Extensions
// =============================================================================

declare global {
  namespace Express {
    interface Request {
      admin?: {
        adminId: string;
        username: string;
        email: string;
        role: AdminRole;
        sessionId: string;
      };
    }
  }
}

// =============================================================================
// Admin Authentication Middleware
// =============================================================================

/**
 * Authenticate admin user
 * Verifies JWT token and attaches admin info to request
 */
export async function authenticateAdmin(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract token from Authorization header
    const token = extractBearerToken(req);

    if (!token) {
      throw errors.unauthorized('Admin authentication required');
    }

    // Verify token
    const payload = verifyAccessToken(token);

    if (!payload) {
      throw errors.unauthorized('Invalid or expired admin token');
    }

    // Verify this is an admin user (check if adminId exists in admin_users table)
    const admin = await prisma.adminUser.findUnique({
      where: { id: payload.userId },
    });

    if (!admin) {
      log.security('Admin authentication failed - user not found in admin_users', {
        userId: payload.userId,
        ipAddress: req.ip,
      });
      throw errors.unauthorized('Invalid admin credentials');
    }

    // Check if admin is active
    if (admin.status !== 'ACTIVE') {
      log.security('Admin authentication failed - account not active', {
        adminId: admin.id,
        status: admin.status,
        ipAddress: req.ip,
      });
      throw errors.forbidden('Admin account is not active');
    }

    // Verify session exists
    const session = await prisma.adminSession.findUnique({
      where: { id: payload.sessionId },
    });

    if (!session) {
      log.security('Admin authentication failed - session not found', {
        adminId: admin.id,
        sessionId: payload.sessionId,
      });
      throw errors.unauthorized('Admin session not found');
    }

    // Check if session expired
    if (session.expiresAt < new Date()) {
      await prisma.adminSession.delete({
        where: { id: session.id },
      });
      throw errors.unauthorized('Admin session expired');
    }

    // Attach admin info to request
    req.admin = {
      adminId: admin.id,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      sessionId: session.id,
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional admin authentication
 * Attaches admin info if token is present, but doesn't require it
 */
export async function optionalAdminAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractBearerToken(req);

    if (token) {
      const payload = verifyAccessToken(token);

      if (payload) {
        const admin = await prisma.adminUser.findUnique({
          where: { id: payload.userId },
        });

        if (admin && admin.status === 'ACTIVE') {
          req.admin = {
            adminId: admin.id,
            username: admin.username,
            email: admin.email,
            role: admin.role,
            sessionId: payload.sessionId,
          };
        }
      }
    }

    next();
  } catch (error) {
    // Continue without admin authentication
    next();
  }
}

/**
 * Require specific admin role
 * Must be used after authenticateAdmin middleware
 */
export function requireRole(...roles: AdminRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      return next(errors.unauthorized('Admin authentication required'));
    }

    if (!roles.includes(req.admin.role)) {
      log.security('Admin authorization failed - insufficient role', {
        adminId: req.admin.adminId,
        currentRole: req.admin.role,
        requiredRoles: roles,
        path: req.path,
      });
      return next(
        errors.forbidden(`This action requires one of the following roles: ${roles.join(', ')}`)
      );
    }

    next();
  };
}

/**
 * Require SUPERADMIN role
 * Convenience wrapper for requireRole(AdminRole.SUPERADMIN)
 */
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction): void {
  return requireRole(AdminRole.SUPERADMIN)(req, res, next);
}

/**
 * Require COMPLIANCE_OFFICER or SUPERADMIN role
 */
export function requireComplianceOfficer(req: Request, res: Response, next: NextFunction): void {
  return requireRole(AdminRole.COMPLIANCE_OFFICER, AdminRole.SUPERADMIN)(req, res, next);
}

/**
 * Require any admin role (authenticated admin)
 */
export function requireAnyAdmin(req: Request, res: Response, next: NextFunction): void {
  return requireRole(
    AdminRole.SUPERADMIN,
    AdminRole.COMPLIANCE_OFFICER,
    AdminRole.SUPPORT_AGENT
  )(req, res, next);
}

/**
 * Check if admin has specific permission
 * Permissions are determined by role
 */
export function hasPermission(permission: string): boolean {
  // Permission mapping by role
  const permissions: Record<string, string[]> = {
    SUPERADMIN: [
      'users.read',
      'users.write',
      'users.delete',
      'admins.read',
      'admins.write',
      'admins.delete',
      'kyc.read',
      'kyc.approve',
      'kyc.reject',
      'transactions.read',
      'transactions.approve',
      'transactions.reject',
      'transactions.flag',
      'audit.read',
      'settings.write',
    ],
    COMPLIANCE_OFFICER: [
      'users.read',
      'kyc.read',
      'kyc.approve',
      'kyc.reject',
      'transactions.read',
      'transactions.approve',
      'transactions.reject',
      'transactions.flag',
      'audit.read',
    ],
    SUPPORT_AGENT: [
      'users.read',
      'kyc.read',
      'transactions.read',
      'audit.read',
    ],
  };

  // This is a helper function that can be used in controllers
  // It doesn't have access to req, so it can't check the actual admin
  // Use requireRole or custom checks in controllers instead
  return false;
}

/**
 * Rate limiting for admin endpoints
 * Stricter than customer endpoints
 */
export function adminRateLimiter(req: Request, res: Response, next: NextFunction): void {
  // Admin endpoints have stricter rate limiting
  // This should be implemented with Redis in production
  // For now, pass through
  next();
}
