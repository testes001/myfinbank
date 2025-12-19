/**
 * Application Configuration
 * Centralized configuration management with type safety and validation
 */

export interface AppConfig {
  // Application
  appMode: "demo" | "production";
  nodeEnv: "development" | "production" | "test";

  // API
  apiBaseUrl: string;
  apiTimeout: number;

  // Security
  enableRateLimiting: boolean;
  maxLoginAttempts: number;
  lockoutDurationMinutes: number;
  sessionTimeoutMinutes: number;
  enable2FA: boolean;

  // CSRF
  csrfTokenHeader: string;
  csrfCookieName: string;

  // Encryption
  encryptionKey: string;
  jwtSecret: string;

  // Feature Flags
  enableVirtualCards: boolean;
  enableMobileDeposit: boolean;
  enableBillPay: boolean;
  enableRecurringTransfers: boolean;

  // Monitoring
  sentryDsn: string;
  sentryEnvironment: string;
  enableAnalytics: boolean;
  analyticsId: string;

  // KYC
  kycProvider: "internal" | "jumio" | "onfido";
  enableManualKycReview: boolean;
  autoApproveDemoUsers: boolean;

  // Transaction Limits
  maxTransferAmount: number;
  dailyTransferLimit: number;
  requireVerificationAbove: number;

  // PWA
  enablePwa: boolean;
  enablePushNotifications: boolean;

  // Admin
  adminConsoleEnabled: boolean;
  adminSessionTimeoutMinutes: number;

  // GDPR
  enableCookieConsent: boolean;
  dataRetentionDays: number;
  enableDataExport: boolean;

  // CSP
  cspEnabled: boolean;
  cspReportOnly: boolean;
  cspReportUri: string;

  // Development
  enableDevtools: boolean;
  enableMockData: boolean;
}

/**
 * Get environment variable with type conversion and default value
 */
function getEnv<T extends string | number | boolean>(
  key: string,
  defaultValue: T,
  type: "string" | "number" | "boolean" = "string"
): T {
  const value = import.meta.env[key];

  if (value === undefined || value === "") {
    return defaultValue;
  }

  switch (type) {
    case "boolean":
      return (value === "true" || value === "1") as T;
    case "number":
      return (Number.parseInt(value, 10) || defaultValue) as T;
    case "string":
    default:
      return value as T;
  }
}

/**
 * Application configuration singleton
 */
export const config: AppConfig = {
  // Application
  appMode: getEnv("VITE_APP_MODE", "demo") as "demo" | "production",
  nodeEnv: (import.meta.env.MODE || "development") as "development" | "production" | "test",

  // API
  apiBaseUrl: getEnv("VITE_API_BASE_URL", "https://api.example.com"),
  apiTimeout: getEnv("VITE_API_TIMEOUT", 30000, "number"),

  // Security
  enableRateLimiting: getEnv("VITE_ENABLE_RATE_LIMITING", true, "boolean"),
  maxLoginAttempts: getEnv("VITE_MAX_LOGIN_ATTEMPTS", 5, "number"),
  lockoutDurationMinutes: getEnv("VITE_LOCKOUT_DURATION_MINUTES", 15, "number"),
  sessionTimeoutMinutes: getEnv("VITE_SESSION_TIMEOUT_MINUTES", 30, "number"),
  enable2FA: getEnv("VITE_ENABLE_2FA", false, "boolean"),

  // CSRF
  csrfTokenHeader: getEnv("VITE_CSRF_TOKEN_HEADER", "X-CSRF-Token"),
  csrfCookieName: getEnv("VITE_CSRF_COOKIE_NAME", "_csrf"),

  // Encryption (fallback to demo keys - MUST be replaced in production)
  encryptionKey: getEnv("VITE_ENCRYPTION_KEY", "demo-key-replace-in-production!"),
  jwtSecret: getEnv("VITE_JWT_SECRET", "demo-jwt-secret-replace-now!!"),

  // Feature Flags
  enableVirtualCards: getEnv("VITE_ENABLE_VIRTUAL_CARDS", true, "boolean"),
  enableMobileDeposit: getEnv("VITE_ENABLE_MOBILE_DEPOSIT", true, "boolean"),
  enableBillPay: getEnv("VITE_ENABLE_BILL_PAY", true, "boolean"),
  enableRecurringTransfers: getEnv("VITE_ENABLE_RECURRING_TRANSFERS", true, "boolean"),

  // Monitoring
  sentryDsn: getEnv("VITE_SENTRY_DSN", ""),
  sentryEnvironment: getEnv("VITE_SENTRY_ENVIRONMENT", "development"),
  enableAnalytics: getEnv("VITE_ENABLE_ANALYTICS", false, "boolean"),
  analyticsId: getEnv("VITE_ANALYTICS_ID", ""),

  // KYC
  kycProvider: getEnv("VITE_KYC_PROVIDER", "internal") as "internal" | "jumio" | "onfido",
  enableManualKycReview: getEnv("VITE_ENABLE_MANUAL_KYC_REVIEW", true, "boolean"),
  autoApproveDemoUsers: getEnv("VITE_AUTO_APPROVE_DEMO_USERS", true, "boolean"),

  // Transaction Limits
  maxTransferAmount: getEnv("VITE_MAX_TRANSFER_AMOUNT", 10000, "number"),
  dailyTransferLimit: getEnv("VITE_DAILY_TRANSFER_LIMIT", 25000, "number"),
  requireVerificationAbove: getEnv("VITE_REQUIRE_VERIFICATION_ABOVE", 5000, "number"),

  // PWA
  enablePwa: getEnv("VITE_ENABLE_PWA", true, "boolean"),
  enablePushNotifications: getEnv("VITE_ENABLE_PUSH_NOTIFICATIONS", false, "boolean"),

  // Admin
  adminConsoleEnabled: getEnv("VITE_ADMIN_CONSOLE_ENABLED", true, "boolean"),
  adminSessionTimeoutMinutes: getEnv("VITE_ADMIN_SESSION_TIMEOUT_MINUTES", 15, "number"),

  // GDPR
  enableCookieConsent: getEnv("VITE_ENABLE_COOKIE_CONSENT", true, "boolean"),
  dataRetentionDays: getEnv("VITE_DATA_RETENTION_DAYS", 2555, "number"),
  enableDataExport: getEnv("VITE_ENABLE_DATA_EXPORT", true, "boolean"),

  // CSP
  cspEnabled: getEnv("VITE_CSP_ENABLED", true, "boolean"),
  cspReportOnly: getEnv("VITE_CSP_REPORT_ONLY", true, "boolean"),
  cspReportUri: getEnv("VITE_CSP_REPORT_URI", "/api/csp-report"),

  // Development
  enableDevtools: getEnv("VITE_ENABLE_DEVTOOLS", true, "boolean"),
  enableMockData: getEnv("VITE_ENABLE_MOCK_DATA", true, "boolean"),
};

/**
 * Validate critical configuration
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for demo keys in production
  if (config.appMode === "production") {
    if (config.encryptionKey.includes("demo") || config.encryptionKey.includes("replace")) {
      errors.push("CRITICAL: Production encryption key is not set! Using demo key is a security risk.");
    }

    if (config.jwtSecret.includes("demo") || config.jwtSecret.includes("replace")) {
      errors.push("CRITICAL: Production JWT secret is not set! Using demo secret is a security risk.");
    }

    if (config.enableMockData) {
      errors.push("WARNING: Mock data is enabled in production mode.");
    }

    if (!config.enableRateLimiting) {
      errors.push("WARNING: Rate limiting is disabled in production mode.");
    }

    if (config.cspReportOnly) {
      errors.push("INFO: CSP is in report-only mode in production.");
    }
  }

  // Validate encryption key length (should be 32 bytes for AES-256)
  if (config.encryptionKey.length < 32) {
    errors.push("WARNING: Encryption key is shorter than recommended 32 characters.");
  }

  // Validate JWT secret length
  if (config.jwtSecret.length < 32) {
    errors.push("WARNING: JWT secret is shorter than recommended 32 characters.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Log configuration warnings on startup
 */
export function logConfigWarnings(): void {
  const validation = validateConfig();

  if (!validation.valid) {
    console.warn("⚠️ Configuration Warnings:");
    for (const error of validation.errors) {
      if (error.startsWith("CRITICAL")) {
        console.error(`  ${error}`);
      } else if (error.startsWith("WARNING")) {
        console.warn(`  ${error}`);
      } else {
        console.info(`  ${error}`);
      }
    }
  } else {
    console.log("✓ Configuration validated successfully");
  }

  // Log current mode
  console.log(`Running in ${config.appMode.toUpperCase()} mode (${config.nodeEnv})`);
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof AppConfig): boolean {
  const value = config[feature];
  return typeof value === "boolean" ? value : false;
}

export default config;
