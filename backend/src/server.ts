/**
 * Server Entry Point
 */

import { createApp } from './app';
import { config, logConfigWarnings } from './config';
import { log } from './utils/logger';
import { prisma } from './config/database';
import redisClient from './config/redis';

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  log.error('Uncaught Exception', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any) => {
  log.error('Unhandled Rejection', new Error(reason));
  process.exit(1);
});

async function startServer() {
  try {
    log.info('Starting FinBank API Server...');

    // Log configuration warnings
    logConfigWarnings();

    // Connectivity checks
    await verifyServiceConnectivity();

    // Create Express app
    const app = createApp();

    // Start server
    const port = process.env.PORT ? Number(process.env.PORT) : config.port;
    const server = app.listen(port, () => {
      log.info(`🚀 Server started successfully`, {
        environment: config.nodeEnv,
        port,
        apiUrl: config.apiBaseUrl,
        pid: process.pid,
      });

      log.info('📡 API endpoints:', {
        health: `${config.apiBaseUrl}/health`,
        api: `${config.apiBaseUrl}/api`,
        docs: config.enableSwagger ? `${config.apiBaseUrl}/api-docs` : 'disabled',
      });
    });

    // Graceful shutdown
    const gracefulShutdown = (signal: string) => {
      log.info(`${signal} received. Starting graceful shutdown...`);

      server.close(() => {
        log.info('Server closed. Exiting process.');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        log.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    log.error('Failed to start server', error as Error);
    process.exit(1);
  }
}

// Start server
startServer();

async function verifyServiceConnectivity() {
  // Database
  try {
    await prisma.$queryRaw`SELECT 1`;
    log.info('✅ Database reachable');
  } catch (err) {
    log.error('❌ Database connectivity failed', err as Error);
  }

  // Redis
  if (redisClient) {
    try {
      await redisClient.ping();
      log.info('✅ Redis reachable');
    } catch (err) {
      log.error('❌ Redis connectivity failed', err as Error);
    }
  } else {
    log.warn('Redis client not initialized (check REDIS_URL/credentials)');
  }

  // Resend
  if (config.resendApiKey) {
    try {
      const response = await fetch('https://api.resend.com/domains', {
        headers: { Authorization: `Bearer ${config.resendApiKey}` },
      });
      if (response.ok) {
        log.info('✅ Resend API reachable for transactional emails');
      } else {
        const text = await response.text();
        log.error('❌ Resend API check failed', {
          status: response.status,
          body: text.slice(0, 200),
        });
      }
    } catch (err) {
      log.error('❌ Resend connectivity failed', err as Error);
    }
  } else {
    log.warn('RESEND_API_KEY not set - email sending disabled');
  }
}
