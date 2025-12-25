/**
 * Admin Controller
 * HTTP request handlers for admin endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { adminService } from '@/services/admin.service';
import { asyncHandler, errors } from '@/middleware/errorHandler';
import { AdminRole } from '@prisma/client';
import { auditLogService } from '@/services/auditLog.service';
import { transactionService } from '@/services/transaction.service';

// =============================================================================
// Validation Schemas
// =============================================================================

const loginSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const createAdminSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(16, 'Admin password must be at least 16 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain special character'),
  fullName: z.string().min(2).max(100),
  role: z.nativeEnum(AdminRole),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string(),
});

const listTransactionSchema = z.object({
  page: z.coerce.number().optional().default(1),
  limit: z.coerce.number().optional().default(20),
});

// =============================================================================
// Admin Controller
// =============================================================================

export class AdminController {
  /**
   * POST /api/admin/login
   * Admin login
   */
  login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const validationResult = loginSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw errors.validation('Invalid request body', validationResult.error.errors);
    }

    const { username, password } = validationResult.data;

    const result = await adminService.login({
      username,
      password,
      deviceInfo: {
        ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        userAgent: req.headers['user-agent'],
      },
    });

    // Set refresh token as httpOnly cookie
    res.cookie('admin_refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    });

    res.status(200).json({
      success: true,
      message: 'Admin login successful',
      data: {
        admin: result.admin,
        accessToken: result.accessToken,
        sessionId: result.sessionId,
      },
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
      },
    });
  });

  /**
   * POST /api/admin/logout
   * Admin logout
   */
  logout = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) {
      throw errors.unauthorized();
    }

    await adminService.logout(req.admin.sessionId);

    // Clear refresh token cookie
    res.clearCookie('admin_refresh_token');

    res.status(200).json({
      success: true,
      message: 'Admin logout successful',
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
      },
    });
  });

  /**
   * GET /api/admin/session
   * Get current admin session
   */
  getSession = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) {
      throw errors.unauthorized();
    }

    const session = await adminService.getSession(req.admin.sessionId);

    res.status(200).json({
      success: true,
      data: {
        admin: {
          id: session.admin.id,
          username: session.admin.username,
          email: session.admin.email,
          fullName: session.admin.fullName,
          role: session.admin.role,
          status: session.admin.status,
          mfaEnabled: session.admin.mfaEnabled,
          lastLogin: session.admin.lastLogin,
        },
        session: {
          id: session.id,
          createdAt: session.createdAt,
          lastActivity: session.lastActivity,
          expiresAt: session.expiresAt,
        },
      },
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
      },
    });
  });

  /**
   * POST /api/admin/refresh
   * Refresh admin access token
   */
  refreshToken = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const refreshToken = req.cookies.admin_refresh_token || req.body.refreshToken;

    if (!refreshToken) {
      throw errors.unauthorized('Refresh token not provided');
    }

    const result = await adminService.refreshToken(refreshToken);

    // Update refresh token cookie
    res.cookie('admin_refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000, // 8 hours
    });

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: result.accessToken,
      },
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
      },
    });
  });

  /**
   * POST /api/admin/create
   * Create new admin user (SUPERADMIN only)
   */
  createAdmin = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) {
      throw errors.unauthorized();
    }

    // Only SUPERADMIN can create new admins
    if (req.admin.role !== AdminRole.SUPERADMIN) {
      throw errors.forbidden('Only superadmins can create new admin users');
    }

    const validationResult = createAdminSchema.safeParse(req.body);

    if (!validationResult.success) {
      throw errors.validation('Invalid request body', validationResult.error.errors);
    }

    const adminPayload = validationResult.data as any;

    const admin = await adminService.createAdmin({
      ...adminPayload,
      createdBy: req.admin.adminId,
    });

    res.status(201).json({
      success: true,
      message: 'Admin user created successfully',
      data: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        status: admin.status,
        createdAt: admin.createdAt,
      },
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
      },
    });
  });

  /**
   * GET /api/admin/list
   * List all admin users (SUPERADMIN only)
   */
  listAdmins = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) {
      throw errors.unauthorized();
    }

    // Only SUPERADMIN can list all admins
    if (req.admin.role !== AdminRole.SUPERADMIN) {
      throw errors.forbidden('Only superadmins can list admin users');
    }

    const admins = await adminService.listAdmins();

    res.status(200).json({
      success: true,
      data: admins.map((admin) => ({
        id: admin.id,
        username: admin.username,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        status: admin.status,
        mfaEnabled: admin.mfaEnabled,
        lastLogin: admin.lastLogin,
        createdAt: admin.createdAt,
      })),
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
      },
    });
  });

  /**
   * POST /api/admin/logout-all
   * Logout all sessions (force logout from all devices)
   */
  logoutAllSessions = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) {
      throw errors.unauthorized();
    }

    await adminService.logoutAllSessions(req.admin.adminId);

    // Clear current refresh token cookie
    res.clearCookie('admin_refresh_token');

    res.status(200).json({
      success: true,
      message: 'All sessions terminated successfully',
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
      },
    });
  });

  /**
   * GET /api/admin/audit-logs
   */
  listAuditLogs = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) {
      throw errors.unauthorized();
    }
    const logs = await auditLogService.listLatest();
    res.status(200).json({
      success: true,
      data: logs,
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
    });
  });

  /**
   * GET /api/admin/transactions
   */
  listTransactions = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) {
      throw errors.unauthorized();
    }
    const validation = listTransactionSchema.safeParse(req.query);
    if (!validation.success) {
      throw errors.validation('Invalid query', validation.error.errors);
    }
    const { page, limit } = validation.data;
    const txs = await transactionService.listAll(page, limit);
    res.status(200).json({
      success: true,
      data: txs,
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
    });
  });
}

export const adminController = new AdminController();
