/**
 * Health Check Controller
 *
 * Provides comprehensive health check endpoints for monitoring
 * backend services, database connections, and external integrations.
 *
 * @module health.controller
 * @priority P0
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Overall health check endpoint
 * GET /health
 */
export async function getHealth(req: Request, res: Response): Promise<void> {
  try {
    const startTime = Date.now();

    // Check database connection
    const dbStatus = await checkDatabaseHealth();

    // Check email service configuration
    const emailStatus = checkEmailService();

    // Check SMS gateway configuration
    const smsStatus = checkSmsGateway();

    // Check environment variables
    const envStatus = checkEnvironmentVariables();

    const latency = Date.now() - startTime;

    // Determine overall status
    const criticalFailures = [dbStatus, envStatus].filter(s => s.status === 'FAIL').length;
    const overallStatus = criticalFailures > 0 ? 'FAIL' :
                         (emailStatus.status === 'DEGRADED' || smsStatus.status === 'DEGRADED') ? 'DEGRADED' :
                         'ACTIVE';

    const healthReport = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      latency,
      services: {
        database: dbStatus,
        email: emailStatus,
        sms: smsStatus,
        environment: envStatus,
      },
      version: process.env.npm_package_version || '1.0.0',
    };

    // Log health check
    console.log(`[HEALTH] Overall status: ${overallStatus} (${latency}ms)`);

    res.status(overallStatus === 'ACTIVE' ? 200 : 503).json(healthReport);
  } catch (error) {
    console.error('[HEALTH] Health check failed:', error);
    res.status(503).json({
      status: 'FAIL',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Database health check endpoint
 * GET /health/db
 */
export async function getDatabaseHealth(req: Request, res: Response): Promise<void> {
  try {
    const result = await checkDatabaseHealth();

    res.status(result.status === 'ACTIVE' ? 200 : 503).json({
      service: 'DATABASE_CONNECTION',
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[HEALTH] Database health check failed:', error);
    res.status(503).json({
      service: 'DATABASE_CONNECTION',
      status: 'FAIL',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Database check failed',
    });
  }
}

/**
 * Email service health check endpoint
 * GET /health/email
 */
export async function getEmailHealth(req: Request, res: Response): Promise<void> {
  try {
    const result = checkEmailService();

    res.status(result.status === 'ACTIVE' ? 200 : 503).json({
      service: 'EMAIL_NOTIF_SERVICE',
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[HEALTH] Email health check failed:', error);
    res.status(503).json({
      service: 'EMAIL_NOTIF_SERVICE',
      status: 'FAIL',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Email check failed',
    });
  }
}

/**
 * SMS gateway health check endpoint
 * GET /health/sms
 */
export async function getSmsHealth(req: Request, res: Response): Promise<void> {
  try {
    const result = checkSmsGateway();

    res.status(result.status === 'ACTIVE' ? 200 : 503).json({
      service: 'SMS_PUSH_GATEWAY',
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[HEALTH] SMS health check failed:', error);
    res.status(503).json({
      service: 'SMS_PUSH_GATEWAY',
      status: 'FAIL',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'SMS check failed',
    });
  }
}

/**
 * All services health check endpoint
 * GET /health/services
 */
export async function getAllServicesHealth(req: Request, res: Response): Promise<void> {
  try {
    const services = await Promise.allSettled([
      checkDatabaseHealth(),
      Promise.resolve(checkEmailService()),
      Promise.resolve(checkSmsGateway()),
      Promise.resolve(checkEnvironmentVariables()),
    ]);

    const results = {
      database: services[0].status === 'fulfilled' ? services[0].value : { status: 'FAIL', error: 'Check failed' },
      email: services[1].status === 'fulfilled' ? services[1].value : { status: 'FAIL', error: 'Check failed' },
      sms: services[2].status === 'fulfilled' ? services[2].value : { status: 'FAIL', error: 'Check failed' },
      environment: services[3].status === 'fulfilled' ? services[3].value : { status: 'FAIL', error: 'Check failed' },
    };

    const failedServices = Object.values(results).filter(s => s.status === 'FAIL').length;
    const degradedServices = Object.values(results).filter(s => s.status === 'DEGRADED').length;

    res.status(failedServices > 0 ? 503 : 200).json({
      timestamp: new Date().toISOString(),
      summary: {
        total: 4,
        active: 4 - failedServices - degradedServices,
        degraded: degradedServices,
        failed: failedServices,
      },
      services: results,
    });
  } catch (error) {
    console.error('[HEALTH] Services health check failed:', error);
    res.status(503).json({
      timestamp: new Date().toISOString(),
      error: 'Services health check failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check database connection health
 */
async function checkDatabaseHealth(): Promise<{
  status: 'ACTIVE' | 'DEGRADED' | 'FAIL';
  latency?: number;
  connected: boolean;
  error?: string;
}> {
  const startTime = Date.now();

  try {
    // Simple connection test
    await prisma.$queryRaw`SELECT 1`;

    const latency = Date.now() - startTime;

    // Check if latency is acceptable
    const status = latency < 1000 ? 'ACTIVE' : 'DEGRADED';

    console.log(`[HEALTH] Database: ${status} (${latency}ms)`);

    return {
      status,
      latency,
      connected: true,
    };
  } catch (error) {
    const latency = Date.now() - startTime;
    console.error('[HEALTH] Database connection failed:', error);

    return {
      status: 'FAIL',
      latency,
      connected: false,
      error: error instanceof Error ? error.message : 'Connection failed',
    };
  }
}

/**
 * Check email service configuration
 */
function checkEmailService(): {
  status: 'ACTIVE' | 'DEGRADED' | 'FAIL';
  configured: boolean;
  provider?: string;
} {
  const emailApiKey = process.env.RESEND_API_KEY || process.env.EMAIL_API_KEY;
  const fromEmail = process.env.EMAIL_FROM;

  const configured = !!(emailApiKey && fromEmail);

  if (configured) {
    console.log('[HEALTH] Email service: ACTIVE');
    return {
      status: 'ACTIVE',
      configured: true,
      provider: 'Resend',
    };
  } else {
    console.warn('[HEALTH] Email service: DEGRADED - Not configured');
    return {
      status: 'DEGRADED',
      configured: false,
    };
  }
}

/**
 * Check SMS gateway configuration
 */
function checkSmsGateway(): {
  status: 'ACTIVE' | 'DEGRADED' | 'FAIL';
  configured: boolean;
  provider?: string;
} {
  const smsApiKey = process.env.SMS_API_KEY || process.env.TWILIO_AUTH_TOKEN;
  const smsFrom = process.env.SMS_FROM || process.env.TWILIO_PHONE_NUMBER;

  const configured = !!(smsApiKey && smsFrom);

  if (configured) {
    console.log('[HEALTH] SMS gateway: ACTIVE');
    return {
      status: 'ACTIVE',
      configured: true,
      provider: 'Twilio',
    };
  } else {
    console.warn('[HEALTH] SMS gateway: DEGRADED - Not configured');
    return {
      status: 'DEGRADED',
      configured: false,
    };
  }
}

/**
 * Check critical environment variables
 */
function checkEnvironmentVariables(): {
  status: 'ACTIVE' | 'DEGRADED' | 'FAIL';
  loaded: number;
  missing?: string[];
} {
  const requiredVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'NODE_ENV',
  ];

  const missing: string[] = [];

  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length === 0) {
    console.log('[HEALTH] Environment variables: ACTIVE');
    return {
      status: 'ACTIVE',
      loaded: requiredVars.length,
    };
  } else {
    console.error('[HEALTH] Environment variables: FAIL - Missing:', missing.join(', '));
    return {
      status: 'FAIL',
      loaded: requiredVars.length - missing.length,
      missing,
    };
  }
}

/**
 * Startup system pulse - logs all service statuses
 */
export async function logSystemPulse(): Promise<void> {
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('🚀 MYFINBANK BACKEND - SYSTEM STARTUP');
  console.log(`📅 ${new Date().toISOString()}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📍 Port: ${process.env.PORT || 8001}`);
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('🔍 CHECKING CORE SERVICES...\n');

  // Check database
  const dbStatus = await checkDatabaseHealth();
  console.log(`${dbStatus.status === 'ACTIVE' ? '✅' : '❌'} DATABASE_CONNECTION: [${dbStatus.status}]${dbStatus.latency ? ` (${dbStatus.latency}ms)` : ''}`);

  // Check email
  const emailStatus = checkEmailService();
  console.log(`${emailStatus.status === 'ACTIVE' ? '✅' : '⚠️ '} EMAIL_NOTIF_SERVICE: [${emailStatus.status}]${emailStatus.configured ? ` (${emailStatus.provider})` : ' (Not configured)'}`);

  // Check SMS
  const smsStatus = checkSmsGateway();
  console.log(`${smsStatus.status === 'ACTIVE' ? '✅' : '⚠️ '} SMS_PUSH_GATEWAY: [${smsStatus.status}]${smsStatus.configured ? ` (${smsStatus.provider})` : ' (Not configured)'}`);

  // Check environment
  const envStatus = checkEnvironmentVariables();
  console.log(`${envStatus.status === 'ACTIVE' ? '✅' : '❌'} ENV_VAR_LOADING: [${envStatus.status}]${envStatus.missing ? ` Missing: ${envStatus.missing.join(', ')}` : ''}`);

  console.log('\n═══════════════════════════════════════════════════════');

  // Count statuses
  const statuses = [dbStatus, emailStatus, smsStatus, envStatus];
  const active = statuses.filter(s => s.status === 'ACTIVE').length;
  const degraded = statuses.filter(s => s.status === 'DEGRADED').length;
  const failed = statuses.filter(s => s.status === 'FAIL').length;

  console.log('📊 STARTUP SUMMARY:');
  console.log(`   ✅ Active Services: ${active}/4`);
  console.log(`   ⚠️  Degraded Services: ${degraded}/4`);
  console.log(`   ❌ Failed Services: ${failed}/4`);

  if (failed > 0) {
    console.log('\n⚠️  WARNING: Critical services failed. Application may not function correctly.');
  } else if (degraded > 0) {
    console.log('\n⚠️  NOTICE: Some optional services are not configured.');
  } else {
    console.log('\n✅ All systems operational!');
  }

  console.log('═══════════════════════════════════════════════════════\n');
}
