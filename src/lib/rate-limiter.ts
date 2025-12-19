/**
 * Enhanced Rate Limiting & Brute Force Protection
 * Features:
 * - IP-based tracking
 * - Progressive delays
 * - CAPTCHA requirement after threshold
 * - Suspicious activity detection
 */

import { config } from "@/lib/config";
import { addSuspiciousActivityFlag } from "@/lib/admin-storage";

interface LoginAttempt {
  email: string;
  timestamp: number;
  success: boolean;
  ipAddress?: string;
  userAgent?: string;
}

interface RateLimitInfo {
  allowed: boolean;
  remainingAttempts: number;
  resetTime?: number;
  message?: string;
  requireCaptcha?: boolean;
  delayMs?: number;
}

const RATE_LIMIT_KEY = "banking_login_attempts";
const MAX_ATTEMPTS = config.maxLoginAttempts || 5;
const LOCKOUT_DURATION = (config.lockoutDurationMinutes || 15) * 60 * 1000;
const ATTEMPT_WINDOW = 5 * 60 * 1000; // 5 minutes

// Progressive delay thresholds (in ms)
const PROGRESSIVE_DELAYS = [
  { attempts: 1, delay: 0 },
  { attempts: 2, delay: 1000 },      // 1 second
  { attempts: 3, delay: 3000 },      // 3 seconds
  { attempts: 4, delay: 5000 },      // 5 seconds
  { attempts: 5, delay: 10000 },     // 10 seconds
];

/**
 * Get client IP address (best effort in browser environment)
 * In production, this should be handled server-side
 */
export function getClientIP(): string {
  // In browser, we can't reliably get the real IP
  // This would be handled by the server in production
  return "client-ip-unknown";
}

/**
 * Get user agent string
 */
export function getUserAgent(): string {
  return navigator.userAgent || "unknown";
}

/**
 * Record login attempt with IP and user agent tracking
 */
export function recordLoginAttempt(
  email: string,
  success: boolean,
  ipAddress?: string,
  userAgent?: string
): void {
  try {
    const stored = localStorage.getItem(RATE_LIMIT_KEY);
    const attempts: LoginAttempt[] = stored ? JSON.parse(stored) : [];

    const attempt: LoginAttempt = {
      email: email.toLowerCase(),
      timestamp: Date.now(),
      success,
      ipAddress: ipAddress || getClientIP(),
      userAgent: userAgent || getUserAgent(),
    };

    // Add new attempt
    attempts.push(attempt);

    // Clean up old attempts (older than 24 hours)
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const cleaned = attempts.filter((a) => a.timestamp > cutoff);

    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(cleaned));

    // Flag suspicious activity if too many failed attempts
    if (!success) {
      const recentFailed = getFailedLoginCount(email, ATTEMPT_WINDOW);
      if (recentFailed >= 3) {
        try {
          addSuspiciousActivityFlag({
            userId: email,
            flagType: "multiple_failed_logins",
            severity: recentFailed >= MAX_ATTEMPTS ? "high" : "medium",
            description: `${recentFailed} failed login attempts in ${ATTEMPT_WINDOW / 60000} minutes`,
          });
        } catch {
          // Silently fail if admin storage not available
        }
      }
    }
  } catch (error) {
    console.error("Failed to record login attempt:", error);
  }
}

/**
 * Calculate progressive delay based on failed attempts
 */
function getProgressiveDelay(failedAttempts: number): number {
  if (!config.enableRateLimiting) return 0;

  for (let i = PROGRESSIVE_DELAYS.length - 1; i >= 0; i--) {
    if (failedAttempts >= PROGRESSIVE_DELAYS[i].attempts) {
      return PROGRESSIVE_DELAYS[i].delay;
    }
  }
  return 0;
}

/**
 * Check if CAPTCHA should be required
 */
function shouldRequireCaptcha(failedAttempts: number): boolean {
  return failedAttempts >= 3; // Require CAPTCHA after 3 failed attempts
}

/**
 * Enhanced rate limit check with progressive delays and CAPTCHA
 */
export function checkRateLimit(email: string, ipAddress?: string): RateLimitInfo {
  try {
    if (!config.enableRateLimiting) {
      return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
    }

    const stored = localStorage.getItem(RATE_LIMIT_KEY);
    if (!stored) {
      return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
    }

    const attempts: LoginAttempt[] = JSON.parse(stored);
    const normalizedEmail = email.toLowerCase();
    const now = Date.now();

    // Get attempts for this email in the lockout window
    const recentAttempts = attempts.filter(
      (a) =>
        a.email === normalizedEmail &&
        now - a.timestamp < LOCKOUT_DURATION &&
        !a.success
    );

    if (recentAttempts.length === 0) {
      return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
    }

    // Calculate progressive delay
    const delayMs = getProgressiveDelay(recentAttempts.length);
    const requireCaptcha = shouldRequireCaptcha(recentAttempts.length);

    // Check if user is locked out
    if (recentAttempts.length >= MAX_ATTEMPTS) {
      const oldestAttempt = recentAttempts[0];
      const resetTime = oldestAttempt.timestamp + LOCKOUT_DURATION;

      if (now < resetTime) {
        const minutesRemaining = Math.ceil((resetTime - now) / 60000);
        return {
          allowed: false,
          remainingAttempts: 0,
          resetTime,
          message: `Too many failed login attempts. Please try again in ${minutesRemaining} minute${minutesRemaining > 1 ? "s" : ""}.`,
          requireCaptcha: true,
          delayMs: 0,
        };
      }
    }

    const remainingAttempts = MAX_ATTEMPTS - recentAttempts.length;

    // Check for IP-based patterns (if IP provided)
    if (ipAddress) {
      const ipAttempts = attempts.filter(
        (a) => a.ipAddress === ipAddress && now - a.timestamp < ATTEMPT_WINDOW
      );

      // Flag if too many attempts from same IP
      if (ipAttempts.length >= MAX_ATTEMPTS * 2) {
        return {
          allowed: false,
          remainingAttempts: 0,
          message: "Too many login attempts from your network. Please try again later.",
          requireCaptcha: true,
          delayMs: 0,
        };
      }
    }

    return {
      allowed: true,
      remainingAttempts,
      requireCaptcha,
      delayMs,
      message: delayMs > 0
        ? `Please wait ${delayMs / 1000} seconds before trying again.`
        : undefined,
    };
  } catch (error) {
    console.error("Failed to check rate limit:", error);
    return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
  }
}

export function clearRateLimit(email: string): void {
  try {
    const stored = localStorage.getItem(RATE_LIMIT_KEY);
    if (!stored) return;

    const attempts: LoginAttempt[] = JSON.parse(stored);
    const normalizedEmail = email.toLowerCase();

    const filtered = attempts.filter((a) => a.email !== normalizedEmail);
    localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to clear rate limit:", error);
  }
}

export function getFailedLoginCount(email: string, windowMs = ATTEMPT_WINDOW): number {
  try {
    const stored = localStorage.getItem(RATE_LIMIT_KEY);
    if (!stored) return 0;

    const attempts: LoginAttempt[] = JSON.parse(stored);
    const normalizedEmail = email.toLowerCase();
    const now = Date.now();

    return attempts.filter(
      (a) =>
        a.email === normalizedEmail &&
        !a.success &&
        now - a.timestamp < windowMs
    ).length;
  } catch (error) {
    console.error("Failed to get failed login count:", error);
    return 0;
  }
}
