/**
 * Express Application Setup
 */

import express from 'express';
import type { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { config, validateConfig } from '@/config';
import { errorHandler, errors } from '@/middleware/errorHandler';
import { httpLoggerStream, log } from '@/utils/logger';
import crypto from 'crypto';
import { prisma } from '@/config/database';
import redisClient from '@/config/redis';

// Import routes
import authRoutes from '@/routes/auth.routes';
import accountRoutes from '@/routes/account.routes';
import transactionRoutes from '@/routes/transaction.routes';
import userRoutes from '@/routes/user.routes';
import kycRoutes from '@/routes/kyc.routes';
import virtualCardRoutes from '@/routes/virtualCard.routes';
import savingsGoalRoutes from '@/routes/savingsGoal.routes';
import adminRoutes from '@/routes/admin.routes';
import uploadRoutes from '@/routes/upload.routes';
import path from 'path';

export function createApp(): Application {
  const app = express();

  // Validate configuration
  try {
    validateConfig();
  } catch (error) {
    log.error('Configuration validation failed', error as Error);
    process.exit(1);
  }

  // =============================================================================
  // Security Middleware
  // =============================================================================

  // Helmet - Security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    })
  );

  // CORS
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: config.corsCredentials,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-CSRF-Token'],
      exposedHeaders: ['X-Request-ID', 'X-CSRF-Token'],
    })
  );

  // =============================================================================
  // Request Processing Middleware
  // =============================================================================

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Cookie parsing
  app.use(cookieParser());

  // Compression
  app.use(compression());

  // Request ID
  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = crypto.randomUUID();
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);
    next();
  });

  // HTTP request logging
  if (config.enableRequestLogging) {
    app.use(
      morgan(':method :url :status :res[content-length] - :response-time ms', {
        stream: httpLoggerStream,
        skip: (req) => req.path === '/health',
      })
    );
  }

  // =============================================================================
  // Routes
  // =============================================================================

  // Health check
  app.get('/health', async (req: Request, res: Response) => {
    const services: Record<string, string> = {};

    // Check database
    try {
      await prisma.$queryRaw`SELECT 1`;
      services.database = 'up';
    } catch (error) {
      services.database = 'down';
      log.error('Health check database ping failed', error as Error);
    }

    // Check redis (optional)
    try {
      if (redisClient) {
        await redisClient.ping();
        services.redis = 'up';
      } else {
        services.redis = 'not_configured';
      }
    } catch (error) {
      services.redis = 'down';
      log.error('Health check redis ping failed', error as Error);
    }

    const allUp = Object.values(services).every((s) => s === 'up' || s === 'not_configured');

    res.status(allUp ? 200 : 503).json({
      status: allUp ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.nodeEnv,
      services,
    });
  });

  // API routes
  app.use('/api/auth', authRoutes);
  app.use('/api/accounts', accountRoutes);
  app.use('/api/transactions', transactionRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/kyc', kycRoutes);
  app.use('/api/cards', virtualCardRoutes);
  app.use('/api/savings-goals', savingsGoalRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

  // API documentation (Swagger)
  if (config.enableSwagger) {
    // Swagger setup will go here
    app.get('/api-docs', (req, res) => {
      res.json({ message: 'API documentation - to be implemented' });
    });
  }

  // =============================================================================
  // Error Handling
  // =============================================================================

  // 404 handler
  app.use((req: Request, res: Response, next: NextFunction) => {
    next(errors.notFound('API endpoint'));
  });

  // Global error handler
  app.use(errorHandler);

  return app;
}
