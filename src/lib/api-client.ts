const API_BASE = import.meta.env.VITE_API_BASE_URL || window.location.origin;

const ACCESS_TOKEN_KEY = "bankingAccessToken";

export interface StoredAuthSession {
  accessToken: string;
}

export function getStoredAccessToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch (err) {
    console.error("Failed to read access token from storage", err);
    return null;
  }
}

export function persistAccessToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    }
  } catch (err) {
    console.error("Failed to persist access token", err);
  }
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

  return fetch(url, {
    credentials: "include",
    ...rest,
    headers: requestHeaders,
  });
}
