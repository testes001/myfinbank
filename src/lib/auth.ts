import bcrypt from "bcryptjs";
import { apiFetch } from "./api-client";

export interface AuthUser {
  user: any;
  account: any;
  accessToken?: string;
  accounts?: any[];
}

/**
 * Login user via backend API
 *
 * IMPORTANT: This function returns INCOMPLETE user data with empty account.id.
 * The caller MUST call establishSession() from AuthContext to fetch complete
 * account data from the backend before navigating to the dashboard.
 *
 * @param email - User email address
 * @param password - User password
 * @returns AuthUser with accessToken but INCOMPLETE account data
 * @throws Error if login fails
 *
 * @example
 * ```typescript
 * const authUser = await loginUser(email, password);
 * // DO NOT use authUser directly - it has empty account.id!
 * if (authUser.accessToken) {
 *   await establishSession(authUser.accessToken, authUser.user);
 * }
 * ```
 */
export async function loginUser(
  email: string,
  password: string,
): Promise<AuthUser> {
  // Validate inputs
  if (!email || typeof email !== "string" || !email.trim()) {
    throw new Error("Email is required");
  }
  if (!password || typeof password !== "string") {
    throw new Error("Password is required");
  }

  try {
    const resp = await apiFetch(`/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
      skipAuth: true,
    });

    if (!resp.ok) {
      const msg =
        (await resp.json().catch(() => null))?.message ||
        "Invalid email or password";
      console.warn("[auth] Login failed:", msg);
      throw new Error(msg);
    }

    const data = await resp.json();

    // Validate response structure
    if (!data?.data?.user || !data?.data?.accessToken) {
      console.error("[auth] Invalid login response structure:", data);
      throw new Error("Invalid server response");
    }

    // WARNING: This returns INCOMPLETE data - account.id is empty string
    // Caller MUST use establishSession() to fetch real account data
    const authUser: AuthUser = {
      user: data.data.user,
      account: { id: "", user_id: data.data.user.userId } as any,
      accessToken: data.data.accessToken,
    };

    console.info(
      "[auth] Login successful, access token received (account data incomplete)",
    );
    return authUser;
  } catch (error) {
    console.error(
      "[auth] Login error:",
      error instanceof Error ? error.message : String(error),
    );
    throw error;
  }
}

/**
 * Register new user via backend API
 *
 * IMPORTANT: This function returns INCOMPLETE user data with empty account.id.
 * The caller MUST call establishSession() from AuthContext to fetch complete
 * account data from the backend before navigating to the dashboard.
 *
 * @param email - User email address
 * @param password - User password
 * @param fullName - User full name
 * @param accountType - Account type (checking, joint, business_elite)
 * @returns AuthUser with accessToken but INCOMPLETE account data
 * @throws Error if registration fails
 *
 * @example
 * ```typescript
 * const authUser = await registerUser(email, password, name, type);
 * if (authUser.accessToken) {
 *   await establishSession(authUser.accessToken, authUser.user);
 * }
 * ```
 */
export async function registerUser(
  email: string,
  password: string,
  fullName: string,
  accountType: string = "checking",
): Promise<AuthUser> {
  // Validate inputs
  if (!email || typeof email !== "string" || !email.trim()) {
    throw new Error("Email is required");
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
  if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
    throw new Error("Full name is required");
  }
  if (!["checking", "joint", "business_elite"].includes(accountType)) {
    throw new Error("Invalid account type");
  }

  try {
    const resp = await apiFetch(`/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        accountType,
      }),
      skipAuth: true,
    });

    if (!resp.ok) {
      const msg =
        (await resp.json().catch(() => null))?.message || "Registration failed";
      console.warn("[auth] Registration failed:", msg);
      throw new Error(msg);
    }

    const data = await resp.json();

    // Validate response structure
    if (!data?.data?.user || !data?.data?.accessToken) {
      console.error("[auth] Invalid registration response structure:", data);
      throw new Error("Invalid server response");
    }

    // WARNING: This returns INCOMPLETE data - account.id is empty string
    // Caller MUST use establishSession() to fetch real account data
    const authUser: AuthUser = {
      user: data.data.user,
      account: { id: "", user_id: data.data.user.userId, accountType } as any,
      accounts: [
        { id: "", user_id: data.data.user.userId, accountType },
      ] as any,
      accessToken: data.data.accessToken,
    };

    console.info(
      "[auth] Registration successful, access token received (account data incomplete)",
    );
    return authUser;
  } catch (error) {
    console.error(
      "[auth] Registration error:",
      error instanceof Error ? error.message : String(error),
    );
    throw error;
  }
}

/**
 * Mark user email as verified (demo/development only)
 * In production, email verification is handled by backend
 *
 * @param _email - Email address (unused)
 * @deprecated This is a no-op for backend compatibility
 */
export function markUserEmailVerified(_email?: string): void {
  // No-op: Email verification is handled by backend
  return;
}

/**
 * Request password reset via backend API
 * Sends reset code to user's email
 *
 * @param email - User email address
 * @throws Error if request fails
 */
export async function requestPasswordReset(email: string): Promise<void> {
  if (!email || typeof email !== "string" || !email.trim()) {
    throw new Error("Email is required");
  }

  try {
    const resp = await apiFetch(`/api/auth/password/forgot`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
      skipAuth: true,
    });

    if (!resp.ok) {
      const msg =
        (await resp.json().catch(() => null))?.message ||
        "Failed to request reset";
      console.warn("[auth] Password reset request failed:", msg);
      throw new Error(msg);
    }

    console.info("[auth] Password reset requested successfully");
  } catch (error) {
    console.error(
      "[auth] Password reset request error:",
      error instanceof Error ? error.message : String(error),
    );
    throw error;
  }
}

/**
 * Confirm password reset with code from email
 *
 * @param email - User email address
 * @param code - Reset code from email
 * @param newPassword - New password
 * @throws Error if reset fails
 */
export async function confirmPasswordReset(
  email: string,
  code: string,
  newPassword: string,
): Promise<void> {
  if (!email || typeof email !== "string" || !email.trim()) {
    throw new Error("Email is required");
  }
  if (!code || typeof code !== "string" || !code.trim()) {
    throw new Error("Reset code is required");
  }
  if (
    !newPassword ||
    typeof newPassword !== "string" ||
    newPassword.length < 8
  ) {
    throw new Error("New password must be at least 8 characters");
  }

  try {
    const resp = await apiFetch(`/api/auth/password/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        code: code.trim(),
        newPassword,
      }),
      skipAuth: true,
    });

    if (!resp.ok) {
      const msg =
        (await resp.json().catch(() => null))?.message ||
        "Failed to reset password";
      console.warn("[auth] Password reset confirmation failed:", msg);
      throw new Error(msg);
    }

    console.info("[auth] Password reset confirmed successfully");
  } catch (error) {
    console.error(
      "[auth] Password reset confirmation error:",
      error instanceof Error ? error.message : String(error),
    );
    throw error;
  }
}

/**
 * Logout user and invalidate session on backend
 * Continues with local cleanup even if backend request fails
 *
 * @returns Promise that always resolves (never throws)
 */
export async function logoutUser(): Promise<void> {
  try {
    const resp = await apiFetch(`/api/auth/logout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!resp.ok) {
      console.warn("[auth] Server logout failed with status:", resp.status);
      // Continue with local logout even if backend fails
    } else {
      console.info("[auth] Server logout successful");
    }
  } catch (error) {
    console.warn(
      "[auth] Server logout error:",
      error instanceof Error ? error.message : String(error),
    );
    // Continue with local logout even if backend fails
  }
}

// ============================================================================
// Legacy Helpers (for backward compatibility)
// ============================================================================

/**
 * Hash password using bcrypt
 * @deprecated Backend handles password hashing
 * @param password - Plain text password
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  if (!password || typeof password !== "string") {
    throw new Error("Password is required");
  }
  return bcrypt.hash(password, 10);
}

/**
 * Verify password against hash
 * @deprecated Backend handles password verification
 * @param password - Plain text password
 * @param hashValue - Hashed password
 * @returns True if password matches
 */
export async function verifyPassword(
  password: string,
  hashValue: string,
): Promise<boolean> {
  if (!password || typeof password !== "string") {
    throw new Error("Password is required");
  }
  if (!hashValue || typeof hashValue !== "string") {
    throw new Error("Hash value is required");
  }
  return bcrypt.compare(password, hashValue);
}

/**
 * Get user with account stub (legacy/fallback)
 * @deprecated Use establishSession() from AuthContext instead
 * @param userId - User ID
 * @returns AuthUser with empty account.id (INCOMPLETE)
 */
export async function getUserWithAccount(userId: string): Promise<AuthUser> {
  if (!userId || typeof userId !== "string" || !userId.trim()) {
    throw new Error("User ID is required");
  }
  console.warn(
    "[auth] getUserWithAccount returns INCOMPLETE data - use establishSession() instead",
  );
  return { user: { id: userId }, account: { id: "", user_id: userId } };
}
