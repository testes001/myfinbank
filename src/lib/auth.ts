import bcrypt from "bcryptjs";
import { apiFetch } from "./api-client";

export interface AuthUser {
  user: any;
  account: any;
  accessToken?: string;
  accounts?: any[];
}

// Frontend auth now uses backend APIs; keep helpers for forms and legacy imports.
export async function loginUser(email: string, password: string): Promise<AuthUser> {
  const resp = await apiFetch(`/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  });
  if (!resp.ok) {
    const msg = (await resp.json().catch(() => null))?.message || "Invalid email or password";
    throw new Error(msg);
  }
  const data = await resp.json();
  return {
    user: data.data.user,
    account: { id: "", user_id: data.data.user.userId } as any,
    accessToken: data.data.accessToken,
  };
}

export async function registerUser(
  email: string,
  password: string,
  fullName: string,
  accountType: string = "checking",
): Promise<AuthUser> {
  const resp = await apiFetch(`/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, fullName, accountType }),
    skipAuth: true,
  });
  if (!resp.ok) {
    const msg = (await resp.json().catch(() => null))?.message || "Registration failed";
    throw new Error(msg);
  }
  const data = await resp.json();
  return {
    user: data.data.user,
    account: { id: "", user_id: data.data.user.userId, accountType } as any,
    accounts: [{ id: "", user_id: data.data.user.userId, accountType }] as any,
    accessToken: data.data.accessToken,
  };
}

export function markUserEmailVerified(_email?: string): void {
  return;
}

// Legacy helpers
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashValue: string): Promise<boolean> {
  return bcrypt.compare(password, hashValue);
}

export async function getUserWithAccount(userId: string): Promise<AuthUser> {
  return { user: { id: userId }, account: { id: "", user_id: userId } };
}
