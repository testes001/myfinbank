import { apiFetch } from "./api-client";

export interface AccountSummary {
  id: string;
  accountNumber: string;
  routingNumber?: string;
  accountType: string;
  balance: number | string;
  availableBalance: number | string;
  status: string;
  currency?: string;
}

export interface KycStatusResponse {
  kycStatus: string;
  userStatus: string;
  verification: {
    id: string;
    status: string;
    idDocumentType: string | null;
    submittedAt: string | null;
    reviewedAt: string | null;
    rejectionReason: string | null;
  } | null;
  requirements: Record<string, boolean>;
}

export interface KycSubmissionRequest {
  dateOfBirth: string;
  ssn: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  phoneNumber: string;
  idDocumentType: "PASSPORT" | "DRIVERS_LICENSE" | "NATIONAL_ID";
}

export async function fetchProfile(token?: string) {
  const resp = await apiFetch("/api/users/me", { tokenOverride: token });
  if (!resp.ok) {
    const msg = (await resp.json().catch(() => null))?.message || "Failed to load profile";
    throw new Error(msg);
  }
  const data = await resp.json();
  return data.data;
}

export async function fetchAccounts(token?: string): Promise<AccountSummary[]> {
  const resp = await apiFetch("/api/accounts", { tokenOverride: token });
  if (!resp.ok) {
    const msg = (await resp.json().catch(() => null))?.message || "Failed to load accounts";
    throw new Error(msg);
  }
  const data = await resp.json();
  return data.data as AccountSummary[];
}

export async function fetchKycStatus(token?: string): Promise<KycStatusResponse> {
  const resp = await apiFetch("/api/kyc/status", { tokenOverride: token });
  if (!resp.ok) {
    const msg = (await resp.json().catch(() => null))?.message || "Failed to load KYC status";
    throw new Error(msg);
  }
  const data = await resp.json();
  return data.data as KycStatusResponse;
}

export async function submitKyc(payload: KycSubmissionRequest, token?: string) {
  const resp = await apiFetch("/api/kyc/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    tokenOverride: token,
  });
  if (!resp.ok) {
    const msg = (await resp.json().catch(() => null))?.message || "Failed to submit KYC";
    throw new Error(msg);
  }
  return resp.json();
}

export async function uploadKycDocument(
  documentType: "ID_FRONT" | "ID_BACK" | "PROOF_OF_ADDRESS",
  fileUrl: string,
  token?: string,
) {
  const resp = await apiFetch("/api/kyc/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ documentType, fileUrl }),
    tokenOverride: token,
  });
  if (!resp.ok) {
    const msg = (await resp.json().catch(() => null))?.message || "Failed to upload document";
    throw new Error(msg);
  }
  return resp.json();
}

export interface UpdateProfilePayload {
  fullName?: string;
  phoneNumber?: string;
  secondaryEmail?: string;
  secondaryPhone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
}

export async function updateProfile(payload: UpdateProfilePayload, token?: string) {
  const resp = await apiFetch("/api/users/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    tokenOverride: token,
  });
  if (!resp.ok) {
    const msg = (await resp.json().catch(() => null))?.message || "Failed to update profile";
    throw new Error(msg);
  }
  const data = await resp.json();
  return data.data;
}

export async function updateSettings(payload: any, token?: string) {
  const resp = await apiFetch("/api/users/me/settings", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    tokenOverride: token,
  });
  if (!resp.ok) {
    const msg = (await resp.json().catch(() => null))?.message || "Failed to update settings";
    throw new Error(msg);
  }
  const data = await resp.json();
  return data.data;
}

export async function changePassword(payload: { currentPassword: string; newPassword: string }, token?: string) {
  const resp = await apiFetch("/api/users/me/password", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    tokenOverride: token,
  });
  if (!resp.ok) {
    const msg = (await resp.json().catch(() => null))?.message || "Failed to change password";
    throw new Error(msg);
  }
}

export async function lookupAccount(accountNumber: string, token?: string) {
  const resp = await apiFetch("/api/accounts/lookup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accountNumber }),
    tokenOverride: token,
  });
  if (!resp.ok) {
    const msg = (await resp.json().catch(() => null))?.message || "Account not found";
    throw new Error(msg);
  }
  const data = await resp.json();
  return data.data;
}

export async function uploadKycFile(file: File, token?: string): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const resp = await apiFetch("/api/upload/kyc", {
    method: "POST",
    body: form as any,
    tokenOverride: token,
  });
  if (!resp.ok) {
    const msg = (await resp.json().catch(() => null))?.message || "File upload failed";
    throw new Error(msg);
  }
  const data = await resp.json();
  return data.data?.url as string;
}

// =====================================
// Virtual Cards API
// =====================================

export interface VirtualCardResponse {
  id: string;
  userId: string;
  linkedAccountId: string;
  cardName: string;
  cardNumber: string;
  cardType: "STANDARD" | "SINGLE_USE" | "MERCHANT_LOCKED" | "RECURRING";
  spendingLimit?: number;
  currentSpent: number;
  status: "ACTIVE" | "FROZEN" | "CANCELLED";
  createdAt: string;
  expiresAt: string;
}

export interface CreateVirtualCardRequest {
  linkedAccountId: string;
  cardName: string;
  cardType: "STANDARD" | "SINGLE_USE" | "MERCHANT_LOCKED" | "RECURRING";
  spendingLimit?: number;
}

/**
 * List all virtual cards for the current user
 */
export async function listVirtualCards(token?: string): Promise<VirtualCardResponse[]> {
  const resp = await apiFetch("/api/cards", {
    method: "GET",
    tokenOverride: token,
  });
  if (!resp.ok) {
    const msg = (await resp.json().catch(() => null))?.message || "Failed to load virtual cards";
    throw new Error(msg);
  }
  const data = await resp.json();
  return data.data as VirtualCardResponse[];
}

/**
 * Get details of a specific virtual card
 */
export async function getVirtualCard(cardId: string, token?: string): Promise<VirtualCardResponse> {
  const resp = await apiFetch(`/api/cards/${cardId}`, {
    method: "GET",
    tokenOverride: token,
  });
  if (!resp.ok) {
    const msg = (await resp.json().catch(() => null))?.message || "Failed to load virtual card";
    throw new Error(msg);
  }
  const data = await resp.json();
  return data.data as VirtualCardResponse;
}

/**
 * Get full card details (including sensitive data)
 */
export async function getVirtualCardDetails(cardId: string, token?: string): Promise<VirtualCardResponse & { cvv: string; fullCardNumber: string }> {
  const resp = await apiFetch(`/api/cards/${cardId}/details`, {
    method: "GET",
    tokenOverride: token,
  });
  if (!resp.ok) {
    const msg = (await resp.json().catch(() => null))?.message || "Failed to load card details";
    throw new Error(msg);
  }
  const data = await resp.json();
  return data.data as VirtualCardResponse & { cvv: string; fullCardNumber: string };
}

/**
 * Create a new virtual card
 */
export async function createVirtualCard(
  payload: CreateVirtualCardRequest,
  token?: string
): Promise<VirtualCardResponse> {
  const resp = await apiFetch("/api/cards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    tokenOverride: token,
  });
  if (!resp.ok) {
    const msg = (await resp.json().catch(() => null))?.message || "Failed to create virtual card";
    throw new Error(msg);
  }
  const data = await resp.json();
  return data.data as VirtualCardResponse;
}

/**
 * Freeze a virtual card
 */
export async function freezeVirtualCard(cardId: string, token?: string): Promise<VirtualCardResponse> {
  const resp = await apiFetch(`/api/cards/${cardId}/freeze`, {
    method: "POST",
    tokenOverride: token,
  });
  if (!resp.ok) {
    const msg = (await resp.json().catch(() => null))?.message || "Failed to freeze card";
    throw new Error(msg);
  }
  const data = await resp.json();
  return data.data as VirtualCardResponse;
}

/**
 * Unfreeze a virtual card
 */
export async function unfreezeVirtualCard(cardId: string, token?: string): Promise<VirtualCardResponse> {
  const resp = await apiFetch(`/api/cards/${cardId}/unfreeze`, {
    method: "POST",
    tokenOverride: token,
  });
  if (!resp.ok) {
    const msg = (await resp.json().catch(() => null))?.message || "Failed to unfreeze card";
    throw new Error(msg);
  }
  const data = await resp.json();
  return data.data as VirtualCardResponse;
}

/**
 * Update spending limit for a virtual card
 */
export async function updateVirtualCardLimit(
  cardId: string,
  spendingLimit: number,
  token?: string
): Promise<VirtualCardResponse> {
  const resp = await apiFetch(`/api/cards/${cardId}/limit`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ spendingLimit }),
    tokenOverride: token,
  });
  if (!resp.ok) {
    const msg = (await resp.json().catch(() => null))?.message || "Failed to update card limit";
    throw new Error(msg);
  }
  const data = await resp.json();
  return data.data as VirtualCardResponse;
}

/**
 * Cancel a virtual card
 */
export async function cancelVirtualCard(cardId: string, token?: string): Promise<void> {
  const resp = await apiFetch(`/api/cards/${cardId}`, {
    method: "DELETE",
    tokenOverride: token,
  });
  if (!resp.ok) {
    const msg = (await resp.json().catch(() => null))?.message || "Failed to cancel card";
    throw new Error(msg);
  }
}

// =====================================
// Admin API
// =====================================

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface AdminLoginResponse {
  accessToken: string;
  refreshToken: string;
  admin: {
    id: string;
    username: string;
    email: string;
    role: "SUPERADMIN" | "COMPLIANCE_OFFICER" | "SUPPORT_AGENT";
  };
}

export interface AdminSession {
  adminId: string;
  username: string;
  email: string;
  role: "SUPERADMIN" | "COMPLIANCE_OFFICER" | "SUPPORT_AGENT";
}

export interface KYCSubmission {
  id: string;
  userId: string;
  status: "PENDING" | "UNDER_REVIEW" | "APPROVED" | "REJECTED";
  dateOfBirth: string;
  ssn: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  phoneNumber: string;
  idDocumentType: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

/**
 * Admin login
 */
export async function adminLogin(payload: AdminLoginRequest): Promise<AdminLoginResponse> {
  const resp = await apiFetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    const msg = (await resp.json().catch(() => null))?.message || "Admin login failed";
    throw new Error(msg);
  }
  const data = await resp.json();
  return data.data as AdminLoginResponse;
}

/**
 * Get current admin session
 */
export async function getAdminSession(token?: string): Promise<AdminSession> {
  const resp = await apiFetch("/api/admin/session", {
    method: "GET",
    tokenOverride: token,
  });
  if (!resp.ok) {
    const msg = (await resp.json().catch(() => null))?.message || "Failed to get admin session";
    throw new Error(msg);
  }
  const data = await resp.json();
  return data.data as AdminSession;
}

/**
 * Admin logout
 */
export async function adminLogout(token?: string): Promise<void> {
  const resp = await apiFetch("/api/admin/logout", {
    method: "POST",
    tokenOverride: token,
  });
  if (!resp.ok) {
    const msg = (await resp.json().catch(() => null))?.message || "Failed to logout";
    throw new Error(msg);
  }
}

/**
 * Logout from all devices
 */
export async function adminLogoutAll(token?: string): Promise<void> {
  const resp = await apiFetch("/api/admin/logout-all", {
    method: "POST",
    tokenOverride: token,
  });
  if (!resp.ok) {
    const msg = (await resp.json().catch(() => null))?.message || "Failed to logout from all devices";
    throw new Error(msg);
  }
}

/**
 * List pending KYC submissions (admin only)
 */
export async function listPendingKYC(token?: string): Promise<KYCSubmission[]> {
  const resp = await apiFetch("/api/admin/kyc/pending", {
    method: "GET",
    tokenOverride: token,
  });
  if (!resp.ok) {
    const msg = (await resp.json().catch(() => null))?.message || "Failed to load pending KYC";
    throw new Error(msg);
  }
  const data = await resp.json();
  return data.data as KYCSubmission[];
}

/**
 * Get KYC submission details
 */
export async function getKYCSubmission(kycId: string, token?: string): Promise<KYCSubmission> {
  const resp = await apiFetch(`/api/admin/kyc/${kycId}`, {
    method: "GET",
    tokenOverride: token,
  });
  if (!resp.ok) {
    const msg = (await resp.json().catch(() => null))?.message || "Failed to load KYC submission";
    throw new Error(msg);
  }
  const data = await resp.json();
  return data.data as KYCSubmission;
}

/**
 * Approve KYC submission
 */
export async function approveKYC(kycId: string, token?: string): Promise<KYCSubmission> {
  const resp = await apiFetch(`/api/admin/kyc/${kycId}/approve`, {
    method: "POST",
    tokenOverride: token,
  });
  if (!resp.ok) {
    const msg = (await resp.json().catch(() => null))?.message || "Failed to approve KYC";
    throw new Error(msg);
  }
  const data = await resp.json();
  return data.data as KYCSubmission;
}

/**
 * Reject KYC submission
 */
export async function rejectKYC(
  kycId: string,
  reason: string,
  token?: string
): Promise<KYCSubmission> {
  const resp = await apiFetch(`/api/admin/kyc/${kycId}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
    tokenOverride: token,
  });
  if (!resp.ok) {
    const msg = (await resp.json().catch(() => null))?.message || "Failed to reject KYC";
    throw new Error(msg);
  }
  const data = await resp.json();
  return data.data as KYCSubmission;
}

/**
 * List audit logs (admin only)
 */
export async function listAuditLogs(
  page: number = 1,
  limit: number = 20,
  token?: string
): Promise<{ logs: any[]; total: number }> {
  const resp = await apiFetch(
    `/api/admin/audit-logs?page=${page}&limit=${limit}`,
    {
      method: "GET",
      tokenOverride: token,
    }
  );
  if (!resp.ok) {
    const msg = (await resp.json().catch(() => null))?.message || "Failed to load audit logs";
    throw new Error(msg);
  }
  const data = await resp.json();
  return data.data as { logs: any[]; total: number };
}

/**
 * List transactions (admin only)
 */
export async function listTransactions(
  page: number = 1,
  limit: number = 20,
  token?: string
): Promise<{ transactions: any[]; total: number }> {
  const resp = await apiFetch(
    `/api/admin/transactions?page=${page}&limit=${limit}`,
    {
      method: "GET",
      tokenOverride: token,
    }
  );
  if (!resp.ok) {
    const msg = (await resp.json().catch(() => null))?.message || "Failed to load transactions";
    throw new Error(msg);
  }
  const data = await resp.json();
  return data.data as { transactions: any[]; total: number };
}
