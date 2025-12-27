import {
  getSecureAccessToken,
  persistSecureAccessToken,
  initializeSecureStorage,
  isAuthenticated
} from './secure-storage';

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
        persistAccessToken(null);
        return null;
      }
      const data = await resp.json();
      const token = data?.data?.accessToken as string | undefined;
      if (token) {
        persistAccessToken(token);
        return token;
      }
      persistAccessToken(null);
      return null;
    } catch (err) {
      console.error("Access token refresh failed", err);
      persistAccessToken(null);
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
}

export async function apiFetch(path: string, options: ApiFetchOptions = {}): Promise<Response> {
  const { tokenOverride, skipAuth, headers, ...rest } = options;
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
    return fetch(url, {
      credentials: "include",
      ...rest,
      headers: requestHeaders,
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
