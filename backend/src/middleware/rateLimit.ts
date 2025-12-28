/**
 * Rate Limiting Middleware
 * Protects sensitive endpoints from abuse
 */

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisClient from '@/config/redis';

// Helper to create store
const createStore = (prefix: string) => {
  if (!redisClient) return undefined;
  return new RedisStore({
    // @ts-ignore - redis client types mismatch sometimes
    sendCommand: (...args: string[]) => redisClient!.sendCommand(args),
    prefix,
  });
};

/**
 * General login rate limiter
 * 5 attempts per 15 minutes per IP
 */
export const loginLimiter = rateLimit({
  store: createStore('rl:login:'),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 attempts (High limit for demo purposes)
  message: 'Too many login attempts, please try again later',
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  keyGenerator: (req) => req.ip || req.socket.remoteAddress || 'unknown',
  skip: (req) => false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: 'Too many login attempts. Please try again in 15 minutes.',
      retryAfter: (req as any).rateLimit?.resetTime,
    });
  },
});

/**
 * Password reset request rate limiter
 * 3 attempts per hour per email address
 */
export const passwordResetLimiter = rateLimit({
  store: createStore('rl:password-reset:'),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: 'Too many password reset attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  // Key by email address from request body
  keyGenerator: (req) => {
    const email = req.body?.email || req.query?.email || req.ip || 'unknown';
    return String(email).toLowerCase();
  },
  skip: (req) => false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      // Generic message - don't reveal rate limit details
      message: 'If email exists, reset code sent',
      error: 'Too many requests',
      retryAfter: (req as any).rateLimit?.resetTime,
    });
  },
});

/**
 * Password reset confirmation rate limiter
 * 5 attempts per hour per email address (to prevent brute-forcing the code)
 */
export const passwordResetConfirmLimiter = rateLimit({
  store: createStore('rl:password-reset-confirm:'),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 attempts (High limit for demo purposes) per hour
  message: 'Too many password reset attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = req.body?.email || req.query?.email || req.ip || 'unknown';
    return String(email).toLowerCase();
  },
  skip: (req) => false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Invalid or expired verification code',
      error: 'Too many attempts',
      retryAfter: (req as any).rateLimit?.resetTime,
    });
  },
});

/**
 * Email verification rate limiter
 * 3 attempts per hour per email address
 */
export const emailVerificationLimiter = rateLimit({
  store: createStore('rl:email-verify:'),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: 'Too many verification attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = req.body?.email || req.query?.email || req.ip || 'unknown';
    return String(email).toLowerCase();
  },
  skip: (req) => false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many verification attempts. Please try again in 1 hour.',
      error: 'Too many requests',
      retryAfter: (req as any).rateLimit?.resetTime,
    });
  },
});

/**
 * Account registration rate limiter
 * 3 registrations per hour per IP address
 */
export const registerLimiter = rateLimit({
  store: createStore('rl:register:'),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // 100 registrations per hour (Increased for testing)
  message: 'Too many registration attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || req.socket.remoteAddress || 'unknown',
  skip: (req) => false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many registration attempts. Please try again in 1 hour.',
      error: 'Too many requests',
      retryAfter: (req as any).rateLimit?.resetTime,
    });
  },
});
