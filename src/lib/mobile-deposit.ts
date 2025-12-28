/**
 * Mobile Deposit Feature
 * Check deposit via mobile with currency validation and manual review workflow
 */

import { apiFetch } from "./api-client";
import { fetchAccounts } from "./backend";

export type DepositStatus = "submitted" | "reviewing" | "approved" | "rejected";
export type DepositCurrency = "USD" | "EUR";
export type AccountType = "checking" | "savings";

export type RejectionReason =
  | "unsupported_currency"
  | "illegible_image"
  | "signature_mismatch"
  | "invalid_amount"
  | "duplicate_deposit"
  | "policy_violation"
  | "other";

export interface MobileDeposit {
  id: string;
  userId: string;
  amount: string;
  currency: DepositCurrency;
  accountType: AccountType;
  checkFrontImageUrl: string | null;
  checkBackImageUrl: string | null;
  imageStoredExternally?: boolean;
  status: DepositStatus;
  extractedAmount?: string;
  extractedPayee?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: RejectionReason;
  rejectionDetails?: string;
  userNotes?: string;
}

// Allowed currencies for check deposits
const ALLOWED_CURRENCIES: DepositCurrency[] = ["USD", "EUR"];

/**
 * Validate deposit currency
 */
export function isValidDepositCurrency(currency: string): currency is DepositCurrency {
  return ALLOWED_CURRENCIES.includes(currency.toUpperCase() as DepositCurrency);
}

/**
 * Validate deposit amount
 */
export function validateDepositAmount(amount: string | number): {
  valid: boolean;
  error?: string;
} {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    return { valid: false, error: "Invalid amount" };
  }

  if (numAmount <= 0) {
    return { valid: false, error: "Amount must be greater than 0" };
  }

  if (numAmount > 50000) {
    return { valid: false, error: "Amount exceeds daily limit of $50,000" };
  }

  // Check decimal places (max 2)
  if (!/^\d+(\.\d{0,2})?$/.test(numAmount.toString())) {
    return { valid: false, error: "Maximum 2 decimal places allowed" };
  }

  return { valid: true };
}

/**
 * Submit a mobile check deposit
 */
export async function submitMobileDeposit(
  userId: string,
  depositData: {
    amount: string;
    currency: string;
    accountType: AccountType;
    checkFrontImage: string; // base64
    checkBackImage: string; // base64
    userNotes?: string;
  },
): Promise<{ success: boolean; error?: string; deposit?: MobileDeposit }> {
  // Validate currency
  if (!isValidDepositCurrency(depositData.currency)) {
    return {
      success: false,
      error: `Invalid currency. Only USD and EUR are accepted. You specified: ${depositData.currency}`,
    };
  }

  // Validate amount
  const amountValidation = validateDepositAmount(depositData.amount);
  if (!amountValidation.valid) {
    return { success: false, error: amountValidation.error };
  }

  try {
    // 1. Get user accounts to find the target account ID
    const accounts = await fetchAccounts();
    const targetAccount = accounts.find(
      (a) => a.accountType.toLowerCase().includes(depositData.accountType.toLowerCase())
    ) || accounts[0]; // Fallback to first account

    if (!targetAccount) {
      return { success: false, error: "No suitable account found for deposit" };
    }

    // 2. Submit to backend
    const resp = await apiFetch("/api/transactions/deposit/mobile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accountId: targetAccount.id,
        amount: parseFloat(depositData.amount),
        currency: depositData.currency,
        frontImage: depositData.checkFrontImage, // Sending base64 directly for now
        backImage: depositData.checkBackImage,
        notes: depositData.userNotes,
      }),
    });

    if (!resp.ok) {
      const msg = (await resp.json().catch(() => null))?.message || "Failed to submit deposit";
      throw new Error(msg);
    }

    const data = await resp.json();
    
    // Map backend response to MobileDeposit interface
    const tx = data.data;
    const deposit: MobileDeposit = {
      id: tx.id,
      userId,
      amount: depositData.amount,
      currency: depositData.currency as DepositCurrency,
      accountType: depositData.accountType,
      checkFrontImageUrl: null,
      checkBackImageUrl: null,
      status: "submitted",
      submittedAt: tx.createdAt,
      userNotes: depositData.userNotes,
    };

    return { success: true, deposit };
  } catch (error) {
    console.error("Mobile deposit submission failed:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to submit deposit" 
    };
  }
}
