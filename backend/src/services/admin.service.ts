/**
 * Admin Service
 * Business logic for admin authentication and management
 */

import bcrypt from 'bcryptjs';
import { prisma } from '@/config/database';
import { errors } from '@/middleware/errorHandler';
import { log } from '@/utils/logger';
import { generateAccessToken, generateRefreshToken } from '@/utils/jwt';
import { hashToken } from '@/utils/encryption';
import { AdminRole, AdminStatus } from '@prisma/client';
import type { AdminUser, AdminSession } from '@prisma/client';

// =============================================================================
// Types
// =============================================================================

interface AdminLoginInput {
  username: string;
  password: string;
  deviceInfo: {
    userAgent?: string;
    ipAddress: string;
  };
}

interface AdminLoginResponse {
  admin: {
    id: string;
    username: string;
    email: string;
    fullName: string;
    role: string;
    status: string;
    mfaEnabled: boolean;
    lastLogin: Date | null;
  };
  accessToken: string;
  refreshToken: string;
  sessionId: string;
}

interface CreateAdminInput {
  username: string;
  email: string;
  password: string;
  fullName: string;
  role: AdminRole;
  createdBy: string;
}

// =============================================================================
// Admin Service
// =============================================================================

export class AdminService {
  /**
   * Admin login
   */
  async login(input: AdminLoginInput): Promise<AdminLoginResponse> {
    const { username, password, deviceInfo } = input;

    // Find admin by username or email
    const admin = await prisma.adminUser.findFirst({
      where: {
        OR: [{ username }, { email: username }],
      },
    });

    if (!admin) {
      log.security('Admin login failed - user not found', {
        username,
        ipAddress: deviceInfo.ipAddress,
      });
      throw errors.unauthorized('Invalid username or password');
    }

    // Check if account is locked
    if (admin.lockedUntil && admin.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil(
        (admin.lockedUntil.getTime() - Date.now()) / 60000
      );
      log.security('Admin login attempt on locked account', {
        adminId: admin.id,
        username: admin.username,
        remainingMinutes,
      });
      throw errors.forbidden(
        `Account is locked. Try again in ${remainingMinutes} minutes.`
      );
    }

    // Check if account is suspended or inactive
    if (admin.status !== AdminStatus.ACTIVE) {
      log.security('Admin login attempt on non-active account', {
        adminId: admin.id,
        username: admin.username,
        status: admin.status,
      });
      throw errors.forbidden('Account is not active');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, admin.passwordHash);

    if (!isPasswordValid) {
      // Increment failed login count
      const failedCount = admin.failedLoginCount + 1;
      const updateData: any = {
        failedLoginCount: failedCount,
      };

      // Lock account after 5 failed attempts
      if (failedCount >= 5) {
        updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        log.security('Admin account locked due to failed login attempts', {
          adminId: admin.id,
          username: admin.username,
          failedCount,
        });
      }

      await prisma.adminUser.update({
        where: { id: admin.id },
        data: updateData,
      });

      log.security('Admin login failed - invalid password', {
        adminId: admin.id,
        username: admin.username,
        failedCount,
      });

      throw errors.unauthorized('Invalid username or password');
    }

    // Reset failed login count and update last login
    await prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
        lastLogin: new Date(),
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: admin.id,
      email: admin.email,
      role: admin.role as any,
      sessionId: '', // Will be updated below
    });

    const refreshToken = generateRefreshToken({
      userId: admin.id,
      email: admin.email,
      role: admin.role as any,
      sessionId: '', // Will be updated below
    });

    // Create admin session
    const session = await prisma.adminSession.create({
      data: {
        adminId: admin.id,
        refreshTokenHash: hashToken(refreshToken),
        deviceInfo: {
          userAgent: deviceInfo.userAgent || 'Unknown',
          ipAddress: deviceInfo.ipAddress,
        },
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
      },
    });

    // Log successful login
    log.auth('Admin login successful', {
      adminId: admin.id,
      username: admin.username,
      role: admin.role,
      ipAddress: deviceInfo.ipAddress,
      sessionId: session.id,
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: admin.id,
        actorType: 'ADMIN',
        action: 'admin_login',
        resource: 'admin_session',
        resourceId: session.id,
        status: 'SUCCESS',
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
      } as any,
    });

    return {
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        fullName: admin.fullName,
        role: admin.role,
        status: admin.status,
        mfaEnabled: admin.mfaEnabled,
        lastLogin: admin.lastLogin,
      },
      accessToken,
      refreshToken,
      sessionId: session.id,
    };
  }

  /**
   * Admin logout
   */
  async logout(sessionId: string): Promise<void> {
    const session = await prisma.adminSession.findUnique({
      where: { id: sessionId },
      include: { admin: true },
    });

    if (!session) {
      throw errors.notFound('Session not found');
    }

    // Delete session
    await prisma.adminSession.delete({
      where: { id: sessionId },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: session.adminId,
        actorType: 'ADMIN',
        action: 'admin_logout',
        resource: 'admin_session',
        resourceId: sessionId,
        status: 'SUCCESS',
      } as any,
    });

    log.auth('Admin logout successful', {
      adminId: session.adminId,
      sessionId,
    });
  }

  /**
   * Get admin session
   */
  async getSession(sessionId: string): Promise<any> {
    const session = await prisma.adminSession.findUnique({
      where: { id: sessionId },
      include: { admin: true },
    });

    if (!session) {
      throw errors.notFound('Session not found');
    }

    // Check if session expired
    if (session.expiresAt < new Date()) {
      await prisma.adminSession.delete({
        where: { id: sessionId },
      });
      throw errors.unauthorized('Session expired');
    }

    // Update last activity
    await prisma.adminSession.update({
      where: { id: sessionId },
      data: { lastActivity: new Date() },
    });

    return session;
  }

  /**
   * Refresh admin token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const tokenHash = hashToken(refreshToken);

    const session = await prisma.adminSession.findFirst({
      where: { refreshTokenHash: tokenHash },
      include: { admin: true },
    });

    if (!session) {
      throw errors.unauthorized('Invalid refresh token');
    }

    // Check if session expired
    if (session.expiresAt < new Date()) {
      await prisma.adminSession.delete({
        where: { id: session.id },
      });
      throw errors.unauthorized('Session expired');
    }

    // Check if admin is still active
    if (session.admin.status !== AdminStatus.ACTIVE) {
      throw errors.forbidden('Admin account is not active');
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken({
      userId: session.admin.id,
      email: session.admin.email,
      role: session.admin.role as any,
      sessionId: session.id,
    });

    const newRefreshToken = generateRefreshToken({
      userId: session.admin.id,
      email: session.admin.email,
      role: session.admin.role as any,
      sessionId: session.id,
    });

    // Update session with new refresh token
    await prisma.adminSession.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: hashToken(newRefreshToken),
        lastActivity: new Date(),
      },
    });

    log.auth('Admin token refreshed', {
      adminId: session.admin.id,
      sessionId: session.id,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Create new admin user (SUPERADMIN only)
   */
  async createAdmin(input: CreateAdminInput): Promise<any> {
    // Check if username or email already exists
    const existing = await prisma.adminUser.findFirst({
      where: {
        OR: [{ username: input.username }, { email: input.email }],
      },
    });

    if (existing) {
      throw errors.conflict('Username or email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(input.password, 12);

    // Create admin
    const admin = await prisma.adminUser.create({
      data: {
        username: input.username,
        email: input.email,
        passwordHash,
        fullName: input.fullName,
        role: input.role,
        createdBy: input.createdBy,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: input.createdBy,
        actorType: 'ADMIN',
        action: 'admin_created',
        resource: 'admin_user',
        resourceId: admin.id,
        status: 'SUCCESS',
        details: {
          username: admin.username,
          email: admin.email,
          role: admin.role,
        },
      } as any,
    });

    log.security('New admin user created', {
      adminId: admin.id,
      username: admin.username,
      role: admin.role,
      createdBy: input.createdBy,
    });

    return admin;
  }

  /**
   * List all admins (SUPERADMIN only)
   */
  async listAdmins(): Promise<any[]> {
    return prisma.adminUser.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get admin by ID
   */
  async getAdminById(id: string): Promise<any> {
    const admin = await prisma.adminUser.findUnique({
      where: { id },
    });

    if (!admin) {
      throw errors.notFound('Admin not found');
    }

    return admin;
  }

  /**
   * Update admin status (SUPERADMIN only)
   */
  async updateAdminStatus(
    adminId: string,
    status: any,
    updatedBy: string
  ): Promise<any> {
    const admin = await prisma.adminUser.update({
      where: { id: adminId },
      data: { status },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: updatedBy,
        actorType: 'ADMIN',
        action: 'admin_status_updated',
        resource: 'admin_user',
        resourceId: adminId,
        status: 'SUCCESS',
        details: {
          oldStatus: admin.status,
          newStatus: status,
        },
      } as any,
    });

    log.security('Admin status updated', {
      adminId,
      newStatus: status,
      updatedBy,
    });

    return admin;
  }

  /**
   * Logout all sessions for an admin
   */
  async logoutAllSessions(adminId: string): Promise<void> {
    await prisma.adminSession.deleteMany({
      where: { adminId },
    });

    log.auth('All admin sessions terminated', {
      adminId,
    });
  }
}

export const adminService = new AdminService();
