/**
 * Production Logger Utility
 * Using Winston for structured logging
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

const logLevel = process.env.LOG_LEVEL || 'info';
const logDir = process.env.LOG_FILE_PATH || './logs';

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Create transports
const transports: winston.transport[] = [];

// Console transport (always active in development)
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// File transports (production)
if (process.env.NODE_ENV === 'production') {
  // Error log
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d',
      format: logFormat,
    })
  );

  // Combined log
  transports.push(
    new DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      format: logFormat,
    })
  );
}

// Create logger
export const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  transports,
  exitOnError: false,
});

// Stream for Morgan HTTP logging
export const httpLoggerStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

// Helper methods for structured logging
export const log = {
  info: (message: string, meta?: any) => logger.info(message, meta),
  error: (message: string, error?: Error, meta?: any) =>
    logger.error(message, { error: error?.message, stack: error?.stack, ...meta }),
  warn: (message: string, meta?: any) => logger.warn(message, meta),
  debug: (message: string, meta?: any) => logger.debug(message, meta),

  // Security events
  security: (event: string, meta: any) =>
    logger.warn(`[SECURITY] ${event}`, { category: 'security', ...meta }),

  // Authentication events
  auth: (event: string, meta: any) =>
    logger.info(`[AUTH] ${event}`, { category: 'auth', ...meta }),

  // Transaction events
  transaction: (event: string, meta: any) =>
    logger.info(`[TRANSACTION] ${event}`, { category: 'transaction', ...meta }),

  // API events
  api: (method: string, url: string, status: number, duration: number, meta?: any) =>
    logger.info(`[API] ${method} ${url}`, {
      category: 'api',
      method,
      url,
      status,
      duration,
      ...meta,
    }),
};

export default logger;
