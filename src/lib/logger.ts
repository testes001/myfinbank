/**
 * Production-Safe Logger Utility
 *
 * Provides structured logging with environment-aware behavior:
 * - Development: Full console logging with colors and context
 * - Production: Conditional logging, error tracking integration
 *
 * Usage:
 * import { logger } from '@/lib/logger';
 *
 * logger.info('User logged in', { userId: '123' });
 * logger.error('Payment failed', error, { orderId: '456' });
 * logger.debug('Cache hit', { key: 'user:123' });
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

interface LoggerConfig {
  enableConsole: boolean;
  enableSentry: boolean;
  minLevel: LogLevel;
}

class Logger {
  private config: LoggerConfig;
  private isDevelopment: boolean;
  private isProduction: boolean;

  constructor() {
    this.isDevelopment = import.meta.env.DEV || import.meta.env.VITE_NODE_ENV === 'development';
    this.isProduction = import.meta.env.VITE_APP_MODE === 'production';

    this.config = {
      enableConsole: this.isDevelopment || !this.isProduction,
      enableSentry: this.isProduction && !!import.meta.env.VITE_SENTRY_DSN,
      minLevel: this.isProduction ? 'info' : 'debug'
    };
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(level);
    const minLevelIndex = levels.indexOf(this.config.minLevel);

    return currentLevelIndex >= minLevelIndex;
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  private logToConsole(level: LogLevel, message: string, error?: Error, context?: LogContext): void {
    if (!this.config.enableConsole || !this.shouldLog(level)) {
      return;
    }

    const formattedMessage = this.formatMessage(level, message, context);

    switch (level) {
      case 'debug':
        console.debug(formattedMessage);
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        if (error) console.warn(error);
        break;
      case 'error':
        console.error(formattedMessage);
        if (error) console.error(error);
        break;
    }
  }

  private logToSentry(level: LogLevel, message: string, error?: Error, context?: LogContext): void {
    if (!this.config.enableSentry || !this.shouldLog(level)) {
      return;
    }

    // Sentry integration placeholder
    // In production, this would use @sentry/browser
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      const Sentry = (window as any).Sentry;

      if (error) {
        Sentry.captureException(error, {
          level: level === 'warn' ? 'warning' : level,
          tags: { component: 'logger' },
          extra: { message, ...context }
        });
      } else if (level === 'error') {
        Sentry.captureMessage(message, {
          level: 'error',
          extra: context
        });
      }
    }
  }

  /**
   * Log debug information (development only)
   */
  debug(message: string, context?: LogContext): void {
    this.logToConsole('debug', message, undefined, context);
  }

  /**
   * Log informational messages
   */
  info(message: string, context?: LogContext): void {
    this.logToConsole('info', message, undefined, context);
    this.logToSentry('info', message, undefined, context);
  }

  /**
   * Log warnings
   */
  warn(message: string, context?: LogContext): void;
  warn(message: string, error: Error, context?: LogContext): void;
  warn(message: string, errorOrContext?: Error | LogContext, context?: LogContext): void {
    const error = errorOrContext instanceof Error ? errorOrContext : undefined;
    const ctx = errorOrContext instanceof Error ? context : errorOrContext;

    this.logToConsole('warn', message, error, ctx);
    this.logToSentry('warn', message, error, ctx);
  }

  /**
   * Log errors
   */
  error(message: string, context?: LogContext): void;
  error(message: string, error: Error, context?: LogContext): void;
  error(message: string, errorOrContext?: Error | LogContext, context?: LogContext): void {
    const error = errorOrContext instanceof Error ? errorOrContext : undefined;
    const ctx = errorOrContext instanceof Error ? context : errorOrContext;

    this.logToConsole('error', message, error, ctx);
    this.logToSentry('error', message, error, ctx);
  }

  /**
   * Log authentication events (security audit)
   */
  auth(event: string, context: LogContext): void {
    this.info(`[AUTH] ${event}`, { ...context, category: 'authentication' });
  }

  /**
   * Log transaction events (financial audit)
   */
  transaction(event: string, context: LogContext): void {
    this.info(`[TRANSACTION] ${event}`, { ...context, category: 'transaction' });
  }

  /**
   * Log security events (security audit)
   */
  security(event: string, context: LogContext): void {
    this.warn(`[SECURITY] ${event}`, { ...context, category: 'security' });
  }

  /**
   * Performance monitoring
   */
  performance(metric: string, duration: number, context?: LogContext): void {
    this.debug(`[PERFORMANCE] ${metric}: ${duration}ms`, context);
  }

  /**
   * API call logging
   */
  api(method: string, url: string, status: number, duration?: number): void {
    const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'debug';
    const message = `[API] ${method} ${url} - ${status}`;
    const context = { method, url, status, duration };

    if (level === 'error') {
      this.error(message, context);
    } else if (level === 'warn') {
      this.warn(message, context);
    } else {
      this.debug(message, context);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for context
export type { LogContext };
