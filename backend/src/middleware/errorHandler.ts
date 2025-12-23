/**
 * Global Error Handler Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { log } from '@/utils/logger';
import { config } from '@/config';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;
  public details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  let error = err as AppError;

  // Default to 500 server error
  if (!error.statusCode) {
    error.statusCode = 500;
    error.code = 'INTERNAL_ERROR';
    error.isOperational = false;
  }

  // Log error
  if (error.statusCode >= 500) {
    log.error('Server error', error, {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userId: (req as any).user?.userId,
    });
  } else {
    log.warn('Client error', {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      method: req.method,
      url: req.url,
      ip: req.ip,
    });
  }

  // Send error response
  const isDevelopment = config.nodeEnv === 'development';

  res.status(error.statusCode).json({
    success: false,
    error: {
      code: error.code,
      message: error.message,
      ...(error.details && { details: error.details }),
      ...(isDevelopment && !error.isOperational && { stack: error.stack }),
    },
    meta: {
      requestId: (req as any).requestId,
      timestamp: new Date().toISOString(),
    },
  });
}

// Error factory functions
export const errors = {
  validation: (message: string, details?: any) =>
    new AppError(message, 400, 'VALIDATION_ERROR', details),

  unauthorized: (message: string = 'Authentication required') =>
    new AppError(message, 401, 'UNAUTHORIZED'),

  forbidden: (message: string = 'Insufficient permissions') =>
    new AppError(message, 403, 'FORBIDDEN'),

  notFound: (resource: string = 'Resource') =>
    new AppError(`${resource} not found`, 404, 'NOT_FOUND'),

  conflict: (message: string) => new AppError(message, 409, 'CONFLICT'),

  rateLimit: (message: string = 'Too many requests') =>
    new AppError(message, 429, 'RATE_LIMIT_EXCEEDED'),

  insufficientFunds: (required: string, available: string) =>
    new AppError('Insufficient funds for this transaction', 400, 'INSUFFICIENT_FUNDS', {
      required,
      available,
    }),

  transactionLimit: (message: string) =>
    new AppError(message, 403, 'TRANSACTION_LIMIT_EXCEEDED'),

  accountLocked: (message: string = 'Account is locked') =>
    new AppError(message, 403, 'ACCOUNT_LOCKED'),

  kycRequired: (message: string = 'KYC verification required') =>
    new AppError(message, 403, 'KYC_REQUIRED'),

  internal: (message: string = 'Internal server error') =>
    new AppError(message, 500, 'INTERNAL_ERROR'),
};

// Async handler wrapper
export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
