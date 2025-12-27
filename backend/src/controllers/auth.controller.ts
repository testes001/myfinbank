/**
 * Authentication Controller
 * HTTP request handlers for authentication endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authService } from '@/services/auth.service';
import { asyncHandler, errors } from '@/middleware/errorHandler';
import { sendVerificationEmail } from '@/services/email.service';
import { verifyCode, isVerified } from '@/services/verification.service';
import { log } from '@/utils/logger';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
  password: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
  accountType: z.enum(['checking', 'joint', 'business_elite']).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

const verificationSchema = z.object({
  email: z.string().email('Invalid email format'),
  code: z.string().min(4).max(10).optional(),
});

const passwordResetRequestSchema = z.object({
  email: z.string().email('Invalid email format'),
});

const passwordResetConfirmSchema = z.object({
  email: z.string().email('Invalid email format'),
  code: z.string().min(4, 'Code required').max(10, 'Code too long'),
  newPassword: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

export class AuthController {
  /**
   * POST /api/auth/register
   * Register new user
   */
  register = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // Validate input
    const validationResult = registerSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw errors.validation('Invalid input', validationResult.error.format());
    }

    const { email, password, fullName, accountType } = validationResult.data;

    // Register user
    const result = await authService.register({ email, password, fullName, accountType });

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
      message: 'Account created successfully',
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
      },
    });
  });

  /**
   * POST /api/auth/login
   * Authenticate user
   */
  login = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // Validate input
    const validationResult = loginSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw errors.validation('Invalid input', validationResult.error.format());
    }

    const { email, password } = validationResult.data;
    const ipAddress = (req.ip || req.socket.remoteAddress || '').replace('::ffff:', '');
    const userAgent = req.headers['user-agent'] || '';

    // Login user
    const result = await authService.login({
      email,
      password,
      ipAddress,
      userAgent,
    });

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
      message: 'Login successful',
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
      },
    });
  });

  /**
   * POST /api/auth/refresh
   * Refresh access token
   */
  refreshToken = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    // Get refresh token from cookie or body
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
      throw errors.unauthorized('Refresh token is required');
    }

    // Refresh token
    const result = await authService.refreshToken(refreshToken);

    // Update refresh token cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      data: {
        accessToken: result.accessToken,
      },
      message: 'Token refreshed successfully',
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
      },
    });
  });

  /**
   * POST /api/auth/logout
   * Logout user
   */
  logout = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw errors.unauthorized('Not authenticated');
    }

    // Logout user
    await authService.logout(req.user.sessionId);

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
      },
    });
  });

  /**
   * GET /api/auth/me
   * Get current user info
   */
  me = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw errors.unauthorized('Not authenticated');
    }

    res.status(200).json({
      success: true,
      data: {
        userId: req.user.userId,
        email: req.user.email,
        role: req.user.role,
      },
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
      },
    });
  });

  /**
   * POST /api/auth/verification-code
   * Send verification code email via Resend
   */
  sendVerificationCode = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const validationResult = verificationSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw errors.validation('Invalid input', validationResult.error.format());
    }

    const { email } = validationResult.data;

    await sendVerificationEmail({ email, ip: req.ip || req.socket.remoteAddress || 'unknown' });

    res.status(200).json({
      success: true,
      message: 'Verification code sent',
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
      },
    });
  });

  /**
   * POST /api/auth/verify
   * Verify code and mark email as verified
   */
  verify = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const validationResult = verificationSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw errors.validation('Invalid input', validationResult.error.format());
    }

    const { email, code } = validationResult.data;
    if (!code) {
      throw errors.validation('Verification code is required');
    }

    const ok = await verifyCode(email, code);
    if (!ok) {
      throw errors.validation('Invalid or expired verification code');
    }

    res.status(200).json({
      success: true,
      message: 'Email verified',
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
      },
    });
  });

  /**
   * POST /api/auth/password/forgot
   * Request password reset code
   */
  requestPasswordReset = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = passwordResetRequestSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw errors.validation('Invalid input', validationResult.error.format());
    }

    const { email } = validationResult.data;
    await sendVerificationEmail({ email, ip: req.ip || req.socket.remoteAddress || 'unknown' });

    log.auth('Password reset code requested', { email, ip: req.ip });

    res.status(200).json({
      success: true,
      message: 'Password reset code sent',
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
      },
    });
  });

  /**
   * POST /api/auth/password/reset
   * Reset password with verification code
   */
  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const validationResult = passwordResetConfirmSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw errors.validation('Invalid input', validationResult.error.format());
    }

    const { email, code, newPassword } = validationResult.data;

    const ok = await verifyCode(email, code);
    if (!ok) {
      throw errors.validation('Invalid or expired verification code');
    }

    await authService.updatePassword(email, newPassword);
    log.auth('Password reset completed', { email, ip: req.ip });

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
      },
    });
  });
}

export const authController = new AuthController();
