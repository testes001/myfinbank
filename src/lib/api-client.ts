import {
  getSecureAccessToken,
  persistSecureAccessToken,
  initializeSecureStorage,
  isAuthenticated
} from './secure-storage';
import { resilientApiFetch } from './resilient-api-client';

const API_BASE = import.meta.env.VITE_API_BASE_URL || window.location.origin;

let refreshInFlight: Promise<string | null> | null = null;

export interface StoredAuthSession {
  accessToken: string;
}

// Initialize secure storage on module load
initializeSecureStorage().catch((err) => {
  console.error("Failed to initialize secure storage:", err);
});

/**
 * Get the stored access token from secure memory storage
 * @returns Access token or null if not authenticated
 */
export function getStoredAccessToken(): string | null {
  return getSecureAccessToken();
}

/**
 * Persist access token securely in memory and IndexedDB
 * @param token The access token to store or null to clear
 */
export async function persistAccessToken(token: string | null): Promise<void> {
  await persistSecureAccessToken(token);
}

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    try {
      const resp = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!resp.ok) {
        await persistAccessToken(null);
        return null;
      }
      const data = await resp.json();
      const token = data?.data?.accessToken as string | undefined;
      if (token) {
        await persistAccessToken(token);
        return token;
      }
      await persistAccessToken(null);
      return null;
    } catch (err) {
      console.error("Access token refresh failed", err);
      await persistAccessToken(null);
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

interface ApiFetchOptions extends RequestInit {
  /**
   * Override the token to use for this request. Falls back to stored token.
   */
  tokenOverride?: string | null;
  /**
   * Skip attaching Authorization header even if a token exists.
   */
  skipAuth?: boolean;
  /**
   * Enable resilience features (retry, timeout, circuit breaker)
   * @default true
   */
  useResilience?: boolean;
  /**
   * Circuit breaker ID for grouping related endpoints
   */
  circuitBreakerId?: string;
  /**
   * Request timeout in milliseconds
   * @default 30000
   */
  timeoutMs?: number;
  /**
   * Cancellation signal (AbortSignal)
   */
  signal?: AbortSignal;
}

/**
 * Main API fetch wrapper with resilience features
 *
 * This is the primary entry point for all API calls. It handles:
 * - Authorization (token refresh on 401)
 * - Timeout (30s default)
 * - Retries for transient errors (exponential backoff)
 * - Circuit breaker (prevents cascading failures)
 * - Cancellation support (AbortSignal)
 *
 * @param path API endpoint path (relative or absolute URL)
 * @param options Request and resilience configuration
 * @returns Response object
 */
export async function apiFetch(path: string, options: ApiFetchOptions = {}): Promise<Response> {
  const {
    tokenOverride,
    skipAuth,
    useResilience = true,
    circuitBreakerId,
    timeoutMs,
    signal,
    headers,
    ...rest
  } = options;

  const requestHeaders = new Headers(headers || {});

  const token = skipAuth ? null : tokenOverride ?? getStoredAccessToken();
  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  const exec = async (overrideToken?: string | null) => {
    if (overrideToken) {
      requestHeaders.set("Authorization", `Bearer ${overrideToken}`);
    }

    // Use resilient fetch if enabled
    if (useResilience) {
      return resilientApiFetch(url, {
        credentials: "include",
        ...rest,
        headers: requestHeaders,
        skipAuth: true, // Don't re-apply auth in resilientApiFetch
        circuitBreakerId,
        timeoutMs,
        signal,
      });
    }

    // Fallback to standard fetch (for non-resilient requests)
    return fetch(url, {
      credentials: "include",
      ...rest,
      headers: requestHeaders,
      signal,
    });
  };

  const initialResp = await exec();

  if (initialResp.status !== 401 || skipAuth) {
    return initialResp;
  }

  const refreshed = await refreshAccessToken();
  if (!refreshed) {
    return initialResp;
  }

  return exec(refreshed);
}
