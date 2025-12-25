/**
 * Admin Control Panel Storage & Utilities
 * Handles admin authentication, audit logs, and system monitoring
 */

import { apiFetch } from "./api-client";

// Admin roles
export type AdminRole = "super_admin" | "compliance_officer" | "transaction_approver" | "support_agent";

export interface AdminUser {
  id: string;
  username: string;
  passwordHash: string;
  fullName: string;
  role: AdminRole;
  email: string;
  createdAt: string;
  lastLogin?: string;
}

// Audit log entry
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string; // userId or adminId
  actorType: "user" | "admin";
  action: string;
  resource: string;
  resourceId?: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  status: "success" | "failed";
}

// Suspicious activity flag
export interface SuspiciousActivityFlag {
  id: string;
  userId: string;
  transactionId?: string;
  flagType: "high_risk_country" | "unusual_amount" | "multiple_failed_logins" | "rapid_transfers" | "account_takeover_risk";
  severity: "low" | "medium" | "high" | "critical";
  description: string;
  timestamp: string;
  reviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

// System status
export interface SystemStatus {
  mode: "demo" | "live";
  uptime: number;
  apiResponseTime: number;
  pendingTransactions: number;
  pendingSignups: number;
  activeFraudAlerts: number;
  lastUpdated: string;
}

const ADMIN_STORAGE_KEY = "banking_admin_users";
const AUDIT_LOG_KEY = "banking_audit_log";
const SUSPICIOUS_ACTIVITY_KEY = "banking_suspicious_activity";
const SYSTEM_STATUS_KEY = "banking_system_status";
const ADMIN_SESSION_KEY = "banking_admin_session";
const ADMIN_ACCESS_TOKEN_KEY = "banking_admin_access_token";

// Initialize default admin accounts (in production, these would be in secure backend)
export function initializeAdminAccounts() {
  const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
  if (!stored) {
    const defaultAdmins: AdminUser[] = [
      {
        id: "admin-001",
        username: "superadmin",
        passwordHash: btoa("Admin@2024"), // Simple hash for demo - use bcrypt in production
        fullName: "System Administrator",
        role: "super_admin",
        email: "admin@bankingsim.com",
        createdAt: new Date().toISOString(),
      },
      {
        id: "admin-002",
        username: "compliance",
        passwordHash: btoa("Compliance@2024"),
        fullName: "Compliance Officer",
        role: "compliance_officer",
        email: "compliance@bankingsim.com",
        createdAt: new Date().toISOString(),
      },
      {
        id: "admin-003",
        username: "approver",
        passwordHash: btoa("Approver@2024"),
        fullName: "Transaction Approver",
        role: "transaction_approver",
        email: "approver@bankingsim.com",
        createdAt: new Date().toISOString(),
      },
    ];
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(defaultAdmins));
  }
}

// Admin authentication
export async function adminLogin(email: string, password: string): Promise<AdminUser | null> {
  try {
    const resp = await apiFetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    });
    if (!resp.ok) {
      return null;
    }
    const data = await resp.json();
    const user = data.data.user as { userId: string; email: string; fullName: string; role: string };
    const accessToken = data.data.accessToken as string;
    const admin: AdminUser = {
      id: user.userId,
      username: user.email,
      email: user.email,
      fullName: user.fullName || user.email,
      role: user.role as any,
      passwordHash: "",
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(admin));
    localStorage.setItem(ADMIN_ACCESS_TOKEN_KEY, accessToken);
    return admin;
  } catch (err) {
    console.error("Admin login failed", err);
    return null;
  }
}

export function adminLogout() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
  localStorage.removeItem(ADMIN_ACCESS_TOKEN_KEY);
}

export function getAdminSession(): AdminUser | null {
  const stored = localStorage.getItem(ADMIN_SESSION_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as AdminUser;
  } catch {
    return null;
  }
}

export function hasAdminPermission(admin: AdminUser | null, requiredRole: AdminRole): boolean {
  if (!admin) return false;

  const roleHierarchy: Record<AdminRole, number> = {
    super_admin: 4,
    compliance_officer: 3,
    transaction_approver: 2,
    support_agent: 1,
  };

  return roleHierarchy[admin.role] >= roleHierarchy[requiredRole];
}

export function getAdminAccessToken(): string | null {
  try {
    return localStorage.getItem(ADMIN_ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function moderateTransaction(id: string, status: "APPROVED" | "REJECTED", notes?: string): Promise<void> {
  const token = getAdminAccessToken();
  if (!token) throw new Error("Admin not authenticated");
  const resp = await apiFetch(`/api/admin/transactions/${id}/moderate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, notes }),
    tokenOverride: token,
  });
  if (!resp.ok) {
    const msg = (await resp.json().catch(() => null))?.message || "Failed to update transaction";
    throw new Error(msg);
  }
}

// Backend-backed KYC admin helpers
export async function fetchPendingKyc(): Promise<any[]> {
  const token = getAdminAccessToken();
  if (!token) throw new Error("Admin not authenticated");
  const resp = await apiFetch("/api/admin/kyc/pending", { tokenOverride: token });
  if (!resp.ok) {
    const msg = (await resp.json().catch(() => null))?.message || "Failed to load pending KYC";
    throw new Error(msg);
  }
  const data = await resp.json();
  return data.data;
}

export async function approveKycAdmin(id: string, reviewerId?: string): Promise<void> {
  const token = getAdminAccessToken();
  if (!token) throw new Error("Admin not authenticated");
  const resp = await apiFetch(`/api/admin/kyc/${id}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reviewerId }),
    tokenOverride: token,
  });
  if (!resp.ok) {
    const msg = (await resp.json().catch(() => null))?.message || "Failed to approve KYC";
    throw new Error(msg);
  }
}

export async function rejectKycAdmin(id: string, reason: string, reviewerId?: string): Promise<void> {
  const token = getAdminAccessToken();
  if (!token) throw new Error("Admin not authenticated");
  const resp = await apiFetch(`/api/admin/kyc/${id}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reviewerId, reason }),
    tokenOverride: token,
  });
  if (!resp.ok) {
    const msg = (await resp.json().catch(() => null))?.message || "Failed to reject KYC";
    throw new Error(msg);
  }
}

// Audit log functions
export function addAuditLog(
  entry: Omit<AuditLogEntry, "id" | "timestamp">
): void {
  try {
    const stored = localStorage.getItem(AUDIT_LOG_KEY);
    const logs: AuditLogEntry[] = stored ? JSON.parse(stored) : [];

    const newEntry: AuditLogEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    logs.unshift(newEntry);

    // Keep last 1000 entries
    if (logs.length > 1000) {
      logs.splice(1000);
    }

    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(logs));
  } catch (error) {
    console.error("Failed to add audit log:", error);
  }
}

export function getAuditLogs(filters?: {
  actorType?: "user" | "admin";
  action?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}): AuditLogEntry[] {
  try {
    const stored = localStorage.getItem(AUDIT_LOG_KEY);
    if (!stored) return [];

    let logs: AuditLogEntry[] = JSON.parse(stored);

    if (filters) {
      if (filters.actorType) {
        logs = logs.filter((log) => log.actorType === filters.actorType);
      }
      if (filters.action) {
        logs = logs.filter((log) => log.action === filters.action);
      }
      if (filters.startDate) {
        logs = logs.filter((log) => log.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        logs = logs.filter((log) => log.timestamp <= filters.endDate!);
      }
      if (filters.limit) {
        logs = logs.slice(0, filters.limit);
      }
    }

    return logs;
  } catch (error) {
    console.error("Failed to get audit logs:", error);
    return [];
  }
}

// Suspicious activity functions
export function addSuspiciousActivityFlag(
  flag: Omit<SuspiciousActivityFlag, "id" | "timestamp" | "reviewed">
): void {
  try {
    const stored = localStorage.getItem(SUSPICIOUS_ACTIVITY_KEY);
    const flags: SuspiciousActivityFlag[] = stored ? JSON.parse(stored) : [];

    const newFlag: SuspiciousActivityFlag = {
      ...flag,
      id: `flag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      reviewed: false,
    };

    flags.unshift(newFlag);
    localStorage.setItem(SUSPICIOUS_ACTIVITY_KEY, JSON.stringify(flags));

    // Also add to audit log
    addAuditLog({
      actor: "system",
      actorType: "admin",
      action: "suspicious_activity_flagged",
      resource: "user",
      resourceId: flag.userId,
      details: { flagType: flag.flagType, severity: flag.severity },
      status: "success",
    });
  } catch (error) {
    console.error("Failed to add suspicious activity flag:", error);
  }
}

export function getSuspiciousActivityFlags(filters?: {
  reviewed?: boolean;
  severity?: SuspiciousActivityFlag["severity"];
  userId?: string;
}): SuspiciousActivityFlag[] {
  try {
    const stored = localStorage.getItem(SUSPICIOUS_ACTIVITY_KEY);
    if (!stored) return [];

    let flags: SuspiciousActivityFlag[] = JSON.parse(stored);

    if (filters) {
      if (filters.reviewed !== undefined) {
        flags = flags.filter((flag) => flag.reviewed === filters.reviewed);
      }
      if (filters.severity) {
        flags = flags.filter((flag) => flag.severity === filters.severity);
      }
      if (filters.userId) {
        flags = flags.filter((flag) => flag.userId === filters.userId);
      }
    }

    return flags;
  } catch (error) {
    console.error("Failed to get suspicious activity flags:", error);
    return [];
  }
}

export function reviewSuspiciousActivity(
  flagId: string,
  reviewedBy: string,
  reviewNotes: string
): void {
  try {
    const stored = localStorage.getItem(SUSPICIOUS_ACTIVITY_KEY);
    if (!stored) return;

    const flags: SuspiciousActivityFlag[] = JSON.parse(stored);
    const flagIndex = flags.findIndex((f) => f.id === flagId);

    if (flagIndex !== -1) {
      flags[flagIndex] = {
        ...flags[flagIndex],
        reviewed: true,
        reviewedBy,
        reviewedAt: new Date().toISOString(),
        reviewNotes,
      };

      localStorage.setItem(SUSPICIOUS_ACTIVITY_KEY, JSON.stringify(flags));

      addAuditLog({
        actor: reviewedBy,
        actorType: "admin",
        action: "suspicious_activity_reviewed",
        resource: "suspicious_activity",
        resourceId: flagId,
        details: { reviewNotes },
        status: "success",
      });
    }
  } catch (error) {
    console.error("Failed to review suspicious activity:", error);
  }
}

// System status functions
export function getSystemStatus(): SystemStatus {
  try {
    const stored = localStorage.getItem(SYSTEM_STATUS_KEY);
    if (stored) {
      return JSON.parse(stored) as SystemStatus;
    }

    // Default status
    const defaultStatus: SystemStatus = {
      mode: "demo",
      uptime: 0,
      apiResponseTime: 50,
      pendingTransactions: 0,
      pendingSignups: 0,
      activeFraudAlerts: 0,
      lastUpdated: new Date().toISOString(),
    };

    localStorage.setItem(SYSTEM_STATUS_KEY, JSON.stringify(defaultStatus));
    return defaultStatus;
  } catch (error) {
    console.error("Failed to get system status:", error);
    return {
      mode: "demo",
      uptime: 0,
      apiResponseTime: 0,
      pendingTransactions: 0,
      pendingSignups: 0,
      activeFraudAlerts: 0,
      lastUpdated: new Date().toISOString(),
    };
  }
}

export function updateSystemStatus(updates: Partial<SystemStatus>): void {
  try {
    const current = getSystemStatus();
    const updated: SystemStatus = {
      ...current,
      ...updates,
      lastUpdated: new Date().toISOString(),
    };

    localStorage.setItem(SYSTEM_STATUS_KEY, JSON.stringify(updated));

    if (updates.mode) {
      addAuditLog({
        actor: getAdminSession()?.id || "system",
        actorType: "admin",
        action: "system_mode_changed",
        resource: "system",
        details: { mode: updates.mode },
        status: "success",
      });
    }
  } catch (error) {
    console.error("Failed to update system status:", error);
  }
}

// (Legacy helpers removed; admin UI now uses backend endpoints)
