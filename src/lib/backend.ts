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
