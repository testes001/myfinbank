/**
 * KYC (Know Your Customer) data storage utilities
 * Handles extended onboarding data that doesn't fit in the core User model
 */

export type PrimaryAccountType = "checking" | "joint" | "business_elite";

export interface KYCData {
  userId: string;

  // Primary Account Type Selection (first step)
  primaryAccountType: PrimaryAccountType;

  // Personal Information
  dateOfBirth: string;
  ssn: string; // Encrypted in production
  phoneNumber: string;
  phoneVerified: boolean;
  emailVerified: boolean;

  // Secondary contact info (can be added later)
  secondaryEmail?: string;
  secondaryPhone?: string;

  // Address Information
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  residencyYears: string;

  // Security Questions
  securityQuestions: {
    question: string;
    answer: string; // Hashed in production
  }[];

  // KYC Verification
  idDocumentType: string;
  idDocumentFrontUrl?: string;
  idDocumentBackUrl?: string;
  livenessCheckComplete: boolean;
  livenessCheckTimestamp?: string;

  // Account Setup
  accountTypes: string[];
  initialDepositMethod: string;
  initialDepositAmount: string;
  externalBankName?: string;
  externalAccountNumber?: string; // Encrypted in production
  externalRoutingNumber?: string;

  // Verification Status
  kycStatus: "pending" | "approved" | "rejected" | "under_review";
  kycSubmittedAt?: string;
  kycReviewedAt?: string;
  kycReviewNotes?: string;

  // Profile restrictions
  profilePhotoUploaded?: boolean;
  profilePhotoUrl?: string;
  profilePhotoUploadedAt?: string;

  // Address change requests
  pendingAddressChange?: {
    streetAddress: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    verificationDocumentUrl?: string;
    requestedAt: string;
    status: "pending" | "approved" | "rejected";
  };

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

const KYC_STORAGE_KEY = "banking_kyc_data";

/**
 * Get KYC data for a specific user
 */
export function getKYCData(userId: string): KYCData | null {
  try {
    const stored = localStorage.getItem(KYC_STORAGE_KEY);
    if (!stored) return null;

    const allData: Record<string, KYCData> = JSON.parse(stored);
    return allData[userId] || null;
  } catch (error) {
    console.error("Failed to retrieve KYC data:", error);
    return null;
  }
}

/**
 * Save KYC data for a user
 */
export function saveKYCData(userId: string, data: Partial<KYCData>): void {
  try {
    const stored = localStorage.getItem(KYC_STORAGE_KEY);
    const allData: Record<string, KYCData> = stored ? JSON.parse(stored) : {};

    const existing = allData[userId];
    const now = new Date().toISOString();

    allData[userId] = {
      ...existing,
      ...data,
      userId,
      updatedAt: now,
      createdAt: existing?.createdAt || now,
    } as KYCData;

    localStorage.setItem(KYC_STORAGE_KEY, JSON.stringify(allData));
  } catch (error) {
    console.error("Failed to save KYC data:", error);
    throw new Error("Failed to save KYC data");
  }
}

/**
 * Update KYC verification status
 */
export function updateKYCStatus(
  userId: string,
  status: KYCData["kycStatus"],
  notes?: string
): void {
  const data = getKYCData(userId);
  if (!data) {
    throw new Error("KYC data not found for user");
  }

  saveKYCData(userId, {
    kycStatus: status,
    kycReviewedAt: new Date().toISOString(),
    kycReviewNotes: notes,
  });
}

/**
 * Check if user has completed KYC
 */
export function hasCompletedKYC(userId: string): boolean {
  const data = getKYCData(userId);
  return data?.kycStatus === "approved";
}

/**
 * Check if user is pending KYC review
 */
export function isPendingKYC(userId: string): boolean {
  const data = getKYCData(userId);
  return data?.kycStatus === "pending" || data?.kycStatus === "under_review";
}

/**
 * Delete KYC data for a user (GDPR compliance)
 */
export function deleteKYCData(userId: string): void {
  try {
    const stored = localStorage.getItem(KYC_STORAGE_KEY);
    if (!stored) return;

    const allData: Record<string, KYCData> = JSON.parse(stored);
    delete allData[userId];

    localStorage.setItem(KYC_STORAGE_KEY, JSON.stringify(allData));
  } catch (error) {
    console.error("Failed to delete KYC data:", error);
  }
}

/**
 * Simulate document upload to cloud storage
 * In production, this would upload to S3/Azure/GCP
 */
export function uploadDocument(file: File): Promise<string> {
  return new Promise((resolve) => {
    // Simulate upload delay
    setTimeout(() => {
      const mockUrl = `https://secure-storage.example.com/kyc-docs/${Date.now()}_${file.name}`;
      resolve(mockUrl);
    }, 1500);
  });
}

/**
 * Hash security answer for storage
 * In production, use proper cryptographic hashing
 */
export function hashSecurityAnswer(answer: string): string {
  // This is a simple hash for simulation - use bcrypt in production
  return btoa(answer.toLowerCase().trim());
}

/**
 * Verify security answer
 */
export function verifySecurityAnswer(answer: string, hash: string): boolean {
  const hashedInput = hashSecurityAnswer(answer);
  return hashedInput === hash;
}

/**
 * Generate a mock account number for new accounts
 */
export function generateAccountNumber(): string {
  const length = Math.random() > 0.5 ? 10 : 12;
  let accountNumber = "";
  for (let i = 0; i < length; i++) {
    accountNumber += Math.floor(Math.random() * 10);
  }
  return accountNumber;
}

/**
 * Validate routing number format
 */
export function isValidRoutingNumber(rtn: string): boolean {
  // Must be 9 digits
  if (!/^\d{9}$/.test(rtn)) return false;

  // Apply ABA routing number checksum algorithm
  const digits = rtn.split("").map(Number);
  const checksum =
    3 * (digits[0] + digits[3] + digits[6]) +
    7 * (digits[1] + digits[4] + digits[7]) +
    (digits[2] + digits[5] + digits[8]);

  return checksum % 10 === 0;
}

/**
 * Validate account number format
 */
export function isValidAccountNumber(accountNumber: string): boolean {
  // Must be 10-12 digits
  return /^\d{10,12}$/.test(accountNumber);
}

/**
 * Mask sensitive data for display
 */
export function maskSSN(ssn: string): string {
  if (ssn.length === 11) {
    // Format: XXX-XX-XXXX
    return `***-**-${ssn.slice(-4)}`;
  }
  return "***-**-****";
}

export function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length < 4) return "****";
  return `****${accountNumber.slice(-4)}`;
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) {
    return `(***) ***-${digits.slice(-4)}`;
  }
  return "***-****";
}
