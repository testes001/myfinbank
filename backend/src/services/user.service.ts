/**
 * User Service
 * Handles user profile management, password changes, and settings
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from '@/config';
import { log } from '@/utils/logger';
import { errors } from '@/middleware/errorHandler';

const prisma = new PrismaClient();
const UserStatus = {
  PENDING_KYC: 'PENDING_KYC',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  CLOSED: 'CLOSED',
} as const;

// =============================================================================
// Types
// =============================================================================

export interface UpdateProfileInput {
  fullName?: string;
  phoneNumber?: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface UserSettings {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    transactionAlerts: boolean;
    securityAlerts: boolean;
    promotionalEmails: boolean;
  };
  security: {
    twoFactorEnabled: boolean;
    loginAlerts: boolean;
    sessionTimeout: number;
  };
  preferences: {
    language: string;
    currency: string;
    timezone: string;
    theme: 'light' | 'dark' | 'auto';
  };
}

export interface UpdateSettingsInput {
  notifications?: Partial<UserSettings['notifications']>;
  security?: Partial<UserSettings['security']>;
  preferences?: Partial<UserSettings['preferences']>;
}

// Default settings for new users
const DEFAULT_SETTINGS: UserSettings = {
  notifications: {
    email: true,
    sms: true,
    push: true,
    transactionAlerts: true,
    securityAlerts: true,
    promotionalEmails: false,
  },
  security: {
    twoFactorEnabled: false,
    loginAlerts: true,
    sessionTimeout: 30, // minutes
  },
  preferences: {
    language: 'en',
    currency: 'USD',
    timezone: 'America/New_York',
    theme: 'light',
  },
};

// =============================================================================
// User Service
// =============================================================================

export class UserService {
  /**
   * Get user profile with enhanced details
   */
  async getUserProfile(userId: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        role: true,
        status: true,
        kycStatus: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        accounts: {
          select: {
            id: true,
            accountType: true,
            status: true,
          },
        },
        _count: {
          select: {
            accounts: true,
            transactions: true,
            virtualCards: true,
          },
        },
      },
    });

    if (!user) {
      throw errors.notFound('User');
    }

    return {
      ...user,
      statistics: {
        totalAccounts: user._count.accounts,
        totalTransactions: user._count.transactions,
        totalCards: user._count.virtualCards,
      },
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    input: UpdateProfileInput
  ): Promise<any> {
    const { fullName, phoneNumber } = input;

    // Validate phone number format if provided
    if (phoneNumber) {
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(phoneNumber)) {
        throw errors.validation('Invalid phone number format (E.164 format required)');
      }
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      throw errors.notFound('User');
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(fullName && { fullName }),
        ...(phoneNumber !== undefined && { phoneNumber }),
        updatedAt: new Date(),
      },
    });

    // Create audit log
    await this.createAuditLog(userId, 'UPDATE_PROFILE', {
      changes: input,
    });

    log.info('User profile updated', {
      userId,
      changes: Object.keys(input),
    });

    return updatedUser;
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    input: ChangePasswordInput
  ): Promise<void> {
    const { currentPassword, newPassword } = input;

    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw errors.notFound('User');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    if (!isValidPassword) {
      throw errors.unauthorized('Current password is incorrect');
    }

    // Validate new password strength
    this.validatePasswordStrength(newPassword);

    // Check if new password is different from current
    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSamePassword) {
      throw errors.validation('New password must be different from current password');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, config.bcryptRounds);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      },
    });

    // Invalidate all existing sessions by setting expiry to now
    await prisma.session.updateMany({
      where: {
        userId,
        expiresAt: {
          gt: new Date(),
        },
      },
      data: {
        expiresAt: new Date(),
      },
    });

    // Create audit log
    await this.createAuditLog(userId, 'CHANGE_PASSWORD', {
      timestamp: new Date(),
    });

    log.info('User password changed', {
      userId,
      email: user.email,
    });
  }

  /**
   * Validate password strength
   */
  private validatePasswordStrength(password: string): void {
    if (password.length < 12) {
      throw errors.validation('Password must be at least 12 characters long');
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUppercase || !hasLowercase || !hasNumber || !hasSpecialChar) {
      throw errors.validation(
        'Password must contain uppercase, lowercase, number, and special character'
      );
    }
  }

  /**
   * Get user settings
   * For now, returns default settings merged with any stored preferences
   * In production, this would query a separate settings table or user metadata
   */
  async getUserSettings(userId: string): Promise<UserSettings> {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw errors.notFound('User');
    }

    // In a production app, you would:
    // 1. Query a separate UserSettings table
    // 2. Or use a JSONB column on the User table
    // For now, return default settings
    return DEFAULT_SETTINGS;
  }

  /**
   * Update user settings
   */
  async updateSettings(
    userId: string,
    input: UpdateSettingsInput
  ): Promise<UserSettings> {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw errors.notFound('User');
    }

    // Validate settings input
    if (input.preferences?.language) {
      const validLanguages = ['en', 'es', 'fr', 'de', 'zh', 'ja'];
      if (!validLanguages.includes(input.preferences.language)) {
        throw errors.validation('Invalid language code');
      }
    }

    if (input.preferences?.currency) {
      const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CNY'];
      if (!validCurrencies.includes(input.preferences.currency)) {
        throw errors.validation('Invalid currency code');
      }
    }

    if (input.preferences?.theme) {
      const validThemes = ['light', 'dark', 'auto'];
      if (!validThemes.includes(input.preferences.theme)) {
        throw errors.validation('Invalid theme');
      }
    }

    if (input.security?.sessionTimeout) {
      if (input.security.sessionTimeout < 5 || input.security.sessionTimeout > 120) {
        throw errors.validation('Session timeout must be between 5 and 120 minutes');
      }
    }

    // In production, you would:
    // 1. Update a UserSettings table
    // 2. Or update a JSONB column on the User table
    // For now, merge with defaults and return
    const currentSettings = await this.getUserSettings(userId);
    const updatedSettings: UserSettings = {
      notifications: {
        ...currentSettings.notifications,
        ...(input.notifications || {}),
      },
      security: {
        ...currentSettings.security,
        ...(input.security || {}),
      },
      preferences: {
        ...currentSettings.preferences,
        ...(input.preferences || {}),
      },
    };

    // Create audit log
    await this.createAuditLog(userId, 'UPDATE_SETTINGS', {
      changes: input,
    });

    log.info('User settings updated', {
      userId,
      changes: Object.keys(input),
    });

    return updatedSettings;
  }

  /**
   * Get user activity summary
   */
  async getUserActivity(userId: string, days: number = 30): Promise<any> {
    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw errors.notFound('User');
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get transaction count by type
    const transactionsByType = await prisma.transaction.groupBy({
      by: ['type'],
      where: {
        userId,
        createdAt: { gte: startDate },
      },
      _count: true,
      _sum: { amount: true },
    });

    // Get login history
    const loginCount = await prisma.loginAttempt.count({
      where: {
        email: user.email,
        success: true,
        createdAt: { gte: startDate },
      },
    });

    // Get recent sessions
    const activeSessions = await prisma.session.count({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
    });

    return {
      period: {
        days,
        startDate,
        endDate: new Date(),
      },
      transactions: {
        byType: transactionsByType.map((t: any) => ({
          type: t.type,
          count: t._count,
          totalAmount: Number(t._sum.amount || 0),
        })),
        total: transactionsByType.reduce((sum: number, t: any) => sum + t._count, 0),
      },
      security: {
        loginCount,
        activeSessions,
      },
    };
  }

  /**
   * Delete user account (soft delete)
   */
  async deleteAccount(userId: string, password: string): Promise<void> {
    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        accounts: true,
      },
    });

    if (!user) {
      throw errors.notFound('User');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw errors.unauthorized('Password is incorrect');
    }

    // Check if user has any active accounts with balance
    const accountsWithBalance = user.accounts.filter(
      (account: any) => Number(account.balance) > 0
    );

    if (accountsWithBalance.length > 0) {
      throw errors.validation(
        'Cannot delete account with active balances. Please transfer or withdraw all funds first.'
      );
    }

    // Soft delete: Update user status to CLOSED
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.CLOSED,
        updatedAt: new Date(),
      },
    });

    // Close all accounts
    await prisma.account.updateMany({
      where: { userId },
      data: {
        status: 'CLOSED',
      },
    });

    // Invalidate all sessions by setting expiry to now
    await prisma.session.updateMany({
      where: { userId },
      data: {
        expiresAt: new Date(),
      },
    });

    // Create audit log
    await this.createAuditLog(userId, 'DELETE_ACCOUNT', {
      reason: 'User requested account deletion',
      timestamp: new Date(),
    });

    log.info('User account deleted', {
      userId,
      email: user.email,
    });
  }

  /**
   * Create audit log entry
   */
  private async createAuditLog(
    userId: string,
    action: string,
    metadata: any
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          actorId: userId,
          action,
          resource: 'user',
          resourceId: userId,
          status: 'SUCCESS',
          metadata,
        } as any,
      });
    } catch (error) {
      // Log error but don't fail the operation
      console.error('Failed to create audit log:', error);
    }
  }
}

export const userService = new UserService();
