/**
 * Centralized Configuration Management
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Config {
  // Server
  nodeEnv: string;
  port: number;
  apiBaseUrl: string;
  frontendUrl: string;

  // Database
  databaseUrl: string;
  databasePoolMin: number;
  databasePoolMax: number;

  // Redis
  redisUrl: string;
  redisPassword?: string;
  redisDb: number;

  // JWT
  jwtSecret: string;
  jwtAccessExpiry: string;
  jwtRefreshExpiry: string;

  // Encryption
  encryptionKey: string;
  encryptionAlgorithm: string;

  // CORS
  corsOrigin: string[];
  corsCredentials: boolean;

  // Rate Limiting
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  rateLimitLoginMax: number;
  rateLimitApiMax: number;

  // Session
  sessionTimeoutMinutes: number;
  sessionAbsoluteTimeoutHours: number;

  // Security
  bcryptRounds: number;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;

  // File Upload
  uploadMaxFileSize: number;
  uploadAllowedTypes: string[];
  uploadDest: string;

  // AWS
  awsRegion: string;
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsS3Bucket: string;

  // Email
  sendgridApiKey?: string;
  resendApiKey?: string;
  emailFrom: string;
  emailFromName: string;

  // Monitoring
  sentryDsn?: string;
  logLevel: string;
  logFilePath: string;

  // Feature Flags
  enableSwagger: boolean;
  enableRequestLogging: boolean;
  enablePerformanceMonitoring: boolean;

  // Transaction Limits
  maxTransactionAmount: number;
  dailyTransactionLimit: number;
  monthlyTransactionLimit: number;

  // KYC
  kycProvider: string;
  kycAutoApproveDemo: boolean;
}

const getEnv = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }
  return value || defaultValue!;
};

const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  return value ? Number.parseInt(value, 10) : defaultValue;
};

const getEnvBoolean = (key: string, defaultValue: boolean): boolean => {
  const value = process.env[key];
  return value ? value === 'true' : defaultValue;
};

const getEnvArray = (key: string, defaultValue: string[]): string[] => {
  const value = process.env[key];
  return value ? value.split(',').map(item => item.trim()) : defaultValue;
};

export const config: Config = {
  // Server
  nodeEnv: getEnv('NODE_ENV', 'development'),
  port: getEnvNumber('PORT', 4000),
  apiBaseUrl: getEnv('API_BASE_URL', 'http://localhost:4000'),
  frontendUrl: getEnv('FRONTEND_URL', 'http://localhost:3000'),

  // Database
  databaseUrl: getEnv('DATABASE_URL'),
  databasePoolMin: getEnvNumber('DATABASE_POOL_MIN', 2),
  databasePoolMax: getEnvNumber('DATABASE_POOL_MAX', 10),

  // Redis
  redisUrl: getEnv('REDIS_URL', 'redis://localhost:6379'),
  redisPassword: process.env.REDIS_PASSWORD,
  redisDb: getEnvNumber('REDIS_DB', 0),

  // JWT
  jwtSecret: getEnv('JWT_SECRET'),
  jwtAccessExpiry: getEnv('JWT_ACCESS_EXPIRY', '15m'),
  jwtRefreshExpiry: getEnv('JWT_REFRESH_EXPIRY', '7d'),

  // Encryption
  encryptionKey: getEnv('ENCRYPTION_KEY'),
  encryptionAlgorithm: getEnv('ENCRYPTION_ALGORITHM', 'aes-256-gcm'),

  // CORS
  corsOrigin: getEnvArray('CORS_ORIGIN', ['http://localhost:3000']),
  corsCredentials: getEnvBoolean('CORS_CREDENTIALS', true),

  // Rate Limiting
  rateLimitWindowMs: getEnvNumber('RATE_LIMIT_WINDOW_MS', 900000),
  rateLimitMaxRequests: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 5),
  rateLimitLoginMax: getEnvNumber('RATE_LIMIT_LOGIN_MAX', 5),
  rateLimitApiMax: getEnvNumber('RATE_LIMIT_API_MAX', 100),

  // Session
  sessionTimeoutMinutes: getEnvNumber('SESSION_TIMEOUT_MINUTES', 30),
  sessionAbsoluteTimeoutHours: getEnvNumber('SESSION_ABSOLUTE_TIMEOUT_HOURS', 24),

  // Security
  bcryptRounds: getEnvNumber('BCRYPT_ROUNDS', 12),
  maxLoginAttempts: getEnvNumber('MAX_LOGIN_ATTEMPTS', 5),
  lockoutDurationMinutes: getEnvNumber('LOCKOUT_DURATION_MINUTES', 15),

  // File Upload
  uploadMaxFileSize: getEnvNumber('UPLOAD_MAX_FILE_SIZE', 10485760),
  uploadAllowedTypes: getEnvArray('UPLOAD_ALLOWED_TYPES', [
    'image/jpeg',
    'image/png',
    'application/pdf',
  ]),
  uploadDest: getEnv('UPLOAD_DEST', './uploads'),

  // AWS
  awsRegion: getEnv('AWS_REGION', 'us-east-1'),
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  awsS3Bucket: getEnv('AWS_S3_BUCKET', 'finbank-documents'),

  // Email
  sendgridApiKey: process.env.SENDGRID_API_KEY,
  resendApiKey: process.env.RESEND_API_KEY,
  emailFrom: getEnv('EMAIL_FROM', 'noreply@yourfinbank.com'),
  emailFromName: getEnv('EMAIL_FROM_NAME', 'FinBank'),

  // Monitoring
  sentryDsn: process.env.SENTRY_DSN,
  logLevel: getEnv('LOG_LEVEL', 'info'),
  logFilePath: getEnv('LOG_FILE_PATH', './logs'),

  // Feature Flags
  enableSwagger: getEnvBoolean('ENABLE_SWAGGER', true),
  enableRequestLogging: getEnvBoolean('ENABLE_REQUEST_LOGGING', true),
  enablePerformanceMonitoring: getEnvBoolean('ENABLE_PERFORMANCE_MONITORING', true),

  // Transaction Limits
  maxTransactionAmount: getEnvNumber('MAX_TRANSACTION_AMOUNT', 50000),
  dailyTransactionLimit: getEnvNumber('DAILY_TRANSACTION_LIMIT', 100000),
  monthlyTransactionLimit: getEnvNumber('MONTHLY_TRANSACTION_LIMIT', 500000),

  // KYC
  kycProvider: getEnv('KYC_PROVIDER', 'manual'),
  kycAutoApproveDemo: getEnvBoolean('KYC_AUTO_APPROVE_DEMO', false),
};

// Ensure the configured frontend URL is always allowed for CORS
if (!config.corsOrigin.includes(config.frontendUrl)) {
  config.corsOrigin.push(config.frontendUrl);
}

// Validation
export function validateConfig(): void {
  const isDev = config.nodeEnv === 'development';

  if (!isDev) {
    if (config.jwtSecret.length < 64) {
      throw new Error('JWT_SECRET must be at least 64 characters in production');
    }

    if (config.encryptionKey.length < 32) {
      throw new Error('ENCRYPTION_KEY must be at least 32 characters in production');
    }

    if (!config.databaseUrl.startsWith('postgresql://')) {
      throw new Error('DATABASE_URL must be a valid PostgreSQL connection string');
    }
  }
}

// Log configuration warnings
export function logConfigWarnings(): void {
  const { log } = require('@/utils/logger');

  if (!config.sendgridApiKey) {
    log.warn('SENDGRID_API_KEY not set - email notifications will fail');
  }
  if (!config.resendApiKey) {
    log.warn('RESEND_API_KEY not set - verification emails will fail');
  }

  if (!config.sentryDsn) {
    log.warn('SENTRY_DSN not set - error tracking disabled');
  }

  if (!config.awsAccessKeyId || !config.awsSecretAccessKey) {
    log.warn('AWS credentials not set - file uploads will use local storage');
  }

  if (config.nodeEnv === 'production' && config.enableSwagger) {
    log.warn('Swagger is enabled in production - consider disabling for security');
  }
}

export default config;
