/**
 * Authentication Service
 * Business logic for user authentication
 */

import { PrismaClient, UserRole, UserStatus, KYCStatus } from '@prisma/client';
import type { User } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from '@/config';
import { log } from '@/utils/logger';
import { generateAccessToken, generateRefreshToken, TokenPayload } from '@/utils/jwt';
import { hash } from '@/utils/encryption';
import { errors } from '@/middleware/errorHandler';

const prisma = new PrismaClient();

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
}

export interface LoginInput {
  email: string;
  password: string;
  ipAddress: string;
  userAgent: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    userId: string;
    email: string;
    fullName: string;
    role: string;
    status: string;
    kycStatus: string;
  };
}

export class AuthService {
  /**
   * Register new user
   */
  async register(input: RegisterInput): Promise<AuthResponse> {
    const { email, password, fullName } = input;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      log.auth('Registration failed - email exists', { email });
      throw errors.conflict('User with this email already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, config.bcryptRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        fullName,
        role: UserRole.CUSTOMER,
        status: UserStatus.PENDING_KYC,
        kycStatus: KYCStatus.PENDING,
      },
    });

    // Create default checking account
    await prisma.account.create({
      data: {
        userId: user.id,
        accountNumber: this.generateAccountNumber(),
        routingNumber: '021000021', // Example routing number
        accountType: 'CHECKING',
        balance: 0,
        availableBalance: 0,
        currency: 'USD',
        status: 'ACTIVE',
      },
    });

    // Log registration
    log.auth('User registered', {
      userId: user.id,
      email: user.email,
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        actorType: 'USER',
        action: 'user_registered',
        resource: 'user',
        resourceId: user.id,
        status: 'SUCCESS',
      },
    });

    // Generate tokens
    return this.generateAuthResponse(user);
  }

  /**
   * Login user
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    const { email, password, ipAddress, userAgent } = input;

    // Check rate limiting
    await this.checkLoginAttempts(email, ipAddress);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      await this.recordLoginAttempt(email, null, false, ipAddress, userAgent, 'Invalid credentials');
      log.auth('Login failed - user not found', { email, ipAddress });
      throw errors.unauthorized('Invalid email or password');
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      await this.recordLoginAttempt(email, user.id, false, ipAddress, userAgent, 'Invalid password');
      log.auth('Login failed - invalid password', { userId: user.id, email, ipAddress });
      throw errors.unauthorized('Invalid email or password');
    }

    // Check user status
    if (user.status === UserStatus.SUSPENDED) {
      log.security('Login attempt on suspended account', { userId: user.id, ipAddress });
      throw errors.accountLocked('Account is suspended');
    }

    if (user.status === UserStatus.CLOSED) {
      throw errors.forbidden('Account is closed');
    }

    // Record successful login
    await this.recordLoginAttempt(email, user.id, true, ipAddress, userAgent);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // Log success
    log.auth('User logged in', {
      userId: user.id,
      email: user.email,
      ipAddress,
    });

    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        actorType: 'USER',
        action: 'user_login',
        resource: 'session',
        status: 'SUCCESS',
        ipAddress,
        userAgent,
      },
    });

    // Generate tokens and create session
    return this.generateAuthResponse(user, ipAddress, userAgent);
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    // Verify refresh token
    const { verifyRefreshToken } = await import('@/utils/jwt');
    const decoded = verifyRefreshToken(refreshToken);

    // Find session
    const tokenHash = hash(refreshToken);
    const session = await prisma.session.findFirst({
      where: {
        userId: decoded.userId,
        refreshTokenHash: tokenHash,
        expiresAt: { gt: new Date() },
      },
    });

    if (!session) {
      log.security('Invalid refresh token used', { userId: decoded.userId });
      throw errors.unauthorized('Invalid or expired refresh token');
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw errors.unauthorized('User not found or inactive');
    }

    // Generate new tokens
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id,
    };

    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);

    // Update session
    await prisma.session.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: hash(newRefreshToken),
        lastActivity: new Date(),
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  /**
   * Logout user
   */
  async logout(sessionId: string): Promise<void> {
    await prisma.session.delete({
      where: { id: sessionId },
    });

    log.auth('User logged out', { sessionId });
  }

  /**
   * Generate authentication response with tokens
   */
  private async generateAuthResponse(
    user: any,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthResponse> {
    // Create session
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: '', // Will be updated below
        deviceInfo: { userAgent },
        ipAddress: ipAddress || '',
        userAgent: userAgent || '',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Generate tokens
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Update session with refresh token hash
    await prisma.session.update({
      where: { id: session.id },
      data: { refreshTokenHash: hash(refreshToken) },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
        kycStatus: user.kycStatus,
      },
    };
  }

  /**
   * Check login attempts for rate limiting
   */
  private async checkLoginAttempts(email: string, ipAddress: string): Promise<void> {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    // Count failed attempts
    const failedAttempts = await prisma.loginAttempt.count({
      where: {
        email: email.toLowerCase(),
        success: false,
        createdAt: { gte: fifteenMinutesAgo },
      },
    });

    if (failedAttempts >= config.maxLoginAttempts) {
      log.security('Login rate limit exceeded', { email, ipAddress, failedAttempts });
      throw errors.rateLimit(
        `Too many failed login attempts. Please try again in ${config.lockoutDurationMinutes} minutes.`
      );
    }
  }

  /**
   * Record login attempt
   */
  private async recordLoginAttempt(
    email: string,
    userId: string | null,
    success: boolean,
    ipAddress: string,
    userAgent: string,
    failureReason?: string
  ): Promise<void> {
    await prisma.loginAttempt.create({
      data: {
        userId,
        email: email.toLowerCase(),
        success,
        ipAddress,
        userAgent,
        failureReason,
      },
    });
  }

  /**
   * Generate account number
   */
  private generateAccountNumber(): string {
    // Generate 10-digit account number
    const accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    return accountNumber;
  }
}

export const authService = new AuthService();
