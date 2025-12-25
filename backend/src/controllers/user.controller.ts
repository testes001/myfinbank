/**
 * User Controller
 * HTTP request handlers for user management endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { userService } from '@/services/user.service';
import { asyncHandler, errors } from '@/middleware/errorHandler';

// =============================================================================
// Validation Schemas
// =============================================================================

const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional(),
  secondaryEmail: z.string().email().optional(),
  secondaryPhone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format').optional(),
  address: z
    .object({
      streetAddress: z.string().min(1),
      city: z.string().min(1),
      state: z.string().min(1),
      zipCode: z.string().min(3),
      country: z.string().min(2),
    })
    .optional(),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(12, 'Password must be at least 12 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/\d/, 'Password must contain number')
    .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain special character'),
});

const updateSettingsSchema = z.object({
  notifications: z
    .object({
      email: z.boolean().optional(),
      sms: z.boolean().optional(),
      push: z.boolean().optional(),
      transactionAlerts: z.boolean().optional(),
      securityAlerts: z.boolean().optional(),
      promotionalEmails: z.boolean().optional(),
    })
    .optional(),
  security: z
    .object({
      twoFactorEnabled: z.boolean().optional(),
      loginAlerts: z.boolean().optional(),
      sessionTimeout: z.number().int().min(5).max(120).optional(),
    })
    .optional(),
  preferences: z
    .object({
      language: z.enum(['en', 'es', 'fr', 'de', 'zh', 'ja']).optional(),
      currency: z.enum(['USD', 'EUR', 'GBP', 'JPY', 'CNY']).optional(),
      timezone: z.string().optional(),
      theme: z.enum(['light', 'dark', 'auto']).optional(),
    })
    .optional(),
});

const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  confirmation: z.literal('DELETE', {
    errorMap: () => ({ message: 'Must type DELETE to confirm' }),
  }),
});

// =============================================================================
// User Controller
// =============================================================================

export class UserController {
  /**
   * GET /api/users/me
   * Get current user profile
   */
  getProfile = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw errors.unauthorized();
      }

      const profile = await userService.getUserProfile(req.user.userId);

      // Remove sensitive data
      const { passwordHash, ...safeProfile } = profile as any;

      res.status(200).json({
        success: true,
        data: safeProfile,
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );

  /**
   * PATCH /api/users/me
   * Update user profile
   */
  updateProfile = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw errors.unauthorized();
      }

      const validationResult = updateProfileSchema.safeParse(req.body);

      if (!validationResult.success) {
        throw errors.validation('Invalid request body', validationResult.error.errors);
      }

      const updatedUser = await userService.updateProfile(
        req.user.userId,
        validationResult.data
      );

      // Remove sensitive data
      const { passwordHash, ...safeUser } = updatedUser;

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: safeUser,
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );

  /**
   * PATCH /api/users/me/password
   * Change user password
   */
  changePassword = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw errors.unauthorized();
      }

      const validationResult = changePasswordSchema.safeParse(req.body);

      if (!validationResult.success) {
        throw errors.validation('Invalid request body', validationResult.error.errors);
      }

      await userService.changePassword(req.user.userId, validationResult.data);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully. All other sessions have been logged out.',
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );

  /**
   * GET /api/users/me/settings
   * Get user settings
   */
  getSettings = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw errors.unauthorized();
      }

      const settings = await userService.getUserSettings(req.user.userId);

      res.status(200).json({
        success: true,
        data: settings,
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );

  /**
   * PATCH /api/users/me/settings
   * Update user settings
   */
  updateSettings = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw errors.unauthorized();
      }

      const validationResult = updateSettingsSchema.safeParse(req.body);

      if (!validationResult.success) {
        throw errors.validation('Invalid request body', validationResult.error.errors);
      }

      const settings = await userService.updateSettings(
        req.user.userId,
        validationResult.data
      );

      res.status(200).json({
        success: true,
        message: 'Settings updated successfully',
        data: settings,
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );

  /**
   * GET /api/users/me/activity
   * Get user activity summary
   */
  getActivity = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw errors.unauthorized();
      }

      const days = parseInt(req.query.days as string) || 30;

      if (days < 1 || days > 365) {
        throw errors.validation('Days must be between 1 and 365');
      }

      const activity = await userService.getUserActivity(req.user.userId, days);

      res.status(200).json({
        success: true,
        data: activity,
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );

  /**
   * DELETE /api/users/me
   * Delete user account (soft delete)
   */
  deleteAccount = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw errors.unauthorized();
      }

      const validationResult = deleteAccountSchema.safeParse(req.body);

      if (!validationResult.success) {
        throw errors.validation('Invalid request body', validationResult.error.errors);
      }

      await userService.deleteAccount(
        req.user.userId,
        validationResult.data.password
      );

      res.status(200).json({
        success: true,
        message: 'Account has been successfully deleted. We\'re sorry to see you go.',
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );
}

export const userController = new UserController();
