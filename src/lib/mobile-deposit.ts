/**
 * Mobile Deposit Feature
 * Check deposit via mobile with currency validation and manual review workflow
 */

export type DepositStatus = "submitted" | "reviewing" | "approved" | "rejected";
export type DepositCurrency = "USD" | "EUR";
export type AccountType = "checking" | "savings";
import { AccountORM } from "@/components/data/orm/orm_account";
import { UserORM } from "@/components/data/orm/orm_user";
import {
  sendMobileDepositSubmittedEmail,
  sendMobileDepositApprovedEmail,
  sendMobileDepositRejectedEmail,
} from "@/lib/email-service";
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

const STORAGE_KEY_DEPOSITS = "fin_bank_mobile_deposits";
const STORAGE_KEY_ADMIN_DEPOSITS = "fin_bank_admin_deposits";

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

  // Create deposit record without persisting raw images (store externally in production)
  const secureReference = "encrypted://external-storage";
  const deposit: MobileDeposit = {
    id: `deposit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    amount: depositData.amount,
    currency: depositData.currency as DepositCurrency,
    accountType: depositData.accountType,
    checkFrontImageUrl: secureReference,
    checkBackImageUrl: secureReference,
    imageStoredExternally: true,
    status: "submitted",
    submittedAt: new Date().toISOString(),
    userNotes: depositData.userNotes,
  };

  // Save to user's deposits
  try {
    const deposits = getUserMobileDeposits(userId);
    deposits.push(deposit);
    localStorage.setItem(`${STORAGE_KEY_DEPOSITS}_${userId}`, JSON.stringify(deposits));
  } catch (error) {
    return { success: false, error: "Failed to save deposit" };
  }

  // Add to admin queue
  try {
    const adminQueue = getAdminDepositQueue();
    adminQueue.push(deposit);
    localStorage.setItem(STORAGE_KEY_ADMIN_DEPOSITS, JSON.stringify(adminQueue));
  } catch (error) {
    console.error("Failed to add deposit to admin queue:", error);
  }

  // Send submission email to user (non-blocking)
  try {
    const userOrm = UserORM.getInstance();
    const users = await userOrm.getUserById(userId);
    const email = users[0]?.email;
    if (email) {
      void sendMobileDepositSubmittedEmail(email, deposit.amount, deposit.currency, deposit.accountType, deposit.submittedAt).catch((e) =>
        console.error("Failed to send mobile deposit submitted email:", e),
      );
    }
  } catch (e) {
    console.error("Error sending deposit submitted email:", e);
  }

  return { success: true, deposit };
}

/**
 * Get all mobile deposits for a user
 */
export function getUserMobileDeposits(userId: string): MobileDeposit[] {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_DEPOSITS}_${userId}`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Get a specific mobile deposit
 */
export function getMobileDeposit(userId: string, depositId: string): MobileDeposit | null {
  const deposits = getUserMobileDeposits(userId);
  return deposits.find((d) => d.id === depositId) || null;
}

/**
 * Get all deposits in admin queue (unreviewed)
 */
export function getAdminDepositQueue(): MobileDeposit[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_ADMIN_DEPOSITS);
    const all = stored ? JSON.parse(stored) : [];
    // Filter only submitted deposits
    return all.filter((d: MobileDeposit) => d.status === "submitted");
  } catch {
    return [];
  }
}

/**
 * Admin action: Approve a deposit
 */
export async function approveDeposit(
  depositId: string,
  reviewedBy: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminQueue = getAdminDepositQueue();
    const depositIndex = adminQueue.findIndex((d) => d.id === depositId);

    if (depositIndex === -1) {
      return { success: false, error: "Deposit not found" };
    }

    const deposit = adminQueue[depositIndex];
    deposit.status = "approved";
    deposit.approvedAt = new Date().toISOString();
    deposit.reviewedBy = reviewedBy;
    deposit.reviewedAt = new Date().toISOString();

    // Update admin queue (store full list)
    const allDeposits = getAllDeposits();
    const allIndex = allDeposits.findIndex((d) => d.id === depositId);
    if (allIndex !== -1) {
      allDeposits[allIndex] = deposit;
      localStorage.setItem(STORAGE_KEY_ADMIN_DEPOSITS, JSON.stringify(allDeposits));
    }

    // Update user's deposit record
    const userDeposits = getUserMobileDeposits(deposit.userId);
    const userIndex = userDeposits.findIndex((d) => d.id === depositId);
    if (userIndex !== -1) {
      userDeposits[userIndex] = deposit;
      localStorage.setItem(`${STORAGE_KEY_DEPOSITS}_${deposit.userId}`, JSON.stringify(userDeposits));
    }

    // Credit user's account balance
    try {
      const accountOrm = AccountORM.getInstance();
      const accounts = await accountOrm.getAccountByUserId(deposit.userId);
      const targetAccount = accounts.find((a: any) => a.account_type === deposit.accountType) || accounts[0];
      if (targetAccount) {
        const current = parseFloat(targetAccount.balance || "0");
        const newBalance = (current + parseFloat(deposit.amount)).toFixed(2);
        await accountOrm.setAccountById(targetAccount.id, { ...targetAccount, balance: newBalance });

        // Send approval email with new balance
        try {
          const userOrm = UserORM.getInstance();
          const users = await userOrm.getUserById(deposit.userId);
          const email = users[0]?.email;
          if (email) {
            void sendMobileDepositApprovedEmail(email, deposit.amount, deposit.currency, newBalance, deposit.approvedAt).catch((e) =>
              console.error("Failed to send mobile deposit approved email:", e),
            );
          }
        } catch (e) {
          console.error("Error sending deposit approved email:", e);
        }
      }
    } catch (e) {
      console.error("Error crediting user account for approved deposit:", e);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to approve deposit" };
  }
}

/**
 * Admin action: Reject a deposit
 */
export async function rejectDeposit(
  depositId: string,
  reviewedBy: string,
  reason: RejectionReason,
  details?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminQueue = getAdminDepositQueue();
    const depositIndex = adminQueue.findIndex((d) => d.id === depositId);

    if (depositIndex === -1) {
      return { success: false, error: "Deposit not found" };
    }

    const deposit = adminQueue[depositIndex];
    deposit.status = "rejected";
    deposit.rejectedAt = new Date().toISOString();
    deposit.reviewedBy = reviewedBy;
    deposit.reviewedAt = new Date().toISOString();
    deposit.rejectionReason = reason;
    deposit.rejectionDetails = details;

    // Update admin queue
    const allDeposits = getAllDeposits();
    const allIndex = allDeposits.findIndex((d) => d.id === depositId);
    if (allIndex !== -1) {
      allDeposits[allIndex] = deposit;
      localStorage.setItem(STORAGE_KEY_ADMIN_DEPOSITS, JSON.stringify(allDeposits));
    }

    // Update user's deposit record
    const userDeposits = getUserMobileDeposits(deposit.userId);
    const userIndex = userDeposits.findIndex((d) => d.id === depositId);
    if (userIndex !== -1) {
      userDeposits[userIndex] = deposit;
      localStorage.setItem(`${STORAGE_KEY_DEPOSITS}_${deposit.userId}`, JSON.stringify(userDeposits));
    }

    // Send rejection email
    try {
      const userOrm = UserORM.getInstance();
      const users = await userOrm.getUserById(deposit.userId);
      const email = users[0]?.email;
      if (email) {
        void sendMobileDepositRejectedEmail(email, deposit.amount, deposit.currency, reason, deposit.submittedAt).catch((e) =>
          console.error("Failed to send mobile deposit rejected email:", e),
        );
      }
    } catch (e) {
      console.error("Error sending deposit rejected email:", e);
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to reject deposit" };
  }
}

/**
 * Get all deposits (admin view)
 */
export function getAllDeposits(): MobileDeposit[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_ADMIN_DEPOSITS);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Get deposit statistics
 */
export function getDepositStatistics(): {
  totalSubmitted: number;
  totalApproved: number;
  totalRejected: number;
  totalPending: number;
  averageProcessingTime: number;
} {
  const allDeposits = getAllDeposits();

  const submitted = allDeposits.filter((d) => d.status === "submitted").length;
  const approved = allDeposits.filter((d) => d.status === "approved").length;
  const rejected = allDeposits.filter((d) => d.status === "rejected").length;

  let totalProcessingTime = 0;
  let processedCount = 0;

  allDeposits.forEach((d) => {
    if ((d.status === "approved" || d.status === "rejected") && d.reviewedAt) {
      const submittedTime = new Date(d.submittedAt).getTime();
      const reviewedTime = new Date(d.reviewedAt).getTime();
      totalProcessingTime += reviewedTime - submittedTime;
      processedCount++;
    }
  });

  const averageProcessingTime = processedCount > 0 ? totalProcessingTime / processedCount : 0;

  return {
    totalSubmitted: submitted,
    totalApproved: approved,
    totalRejected: rejected,
    totalPending: submitted,
    averageProcessingTime,
  };
}

/**
 * Get rejection reason description for user-friendly messages
 */
export function getRejectionReasonDescription(reason: RejectionReason): string {
  const descriptions: Record<RejectionReason, string> = {
    unsupported_currency: "Check is not denominated in USD or EUR",
    illegible_image:
      "Check images are not clear enough to read. Please try again with better lighting.",
    signature_mismatch:
      "The signature on the check does not match our records. Please contact support.",
    invalid_amount: "The amount could not be verified from the check image",
    duplicate_deposit: "This check appears to have already been deposited",
    policy_violation: "The deposit violates our banking policy",
    other: "We could not process this deposit. Please try again or contact support.",
  };

  return descriptions[reason] || descriptions.other;
}

/**
 * Simulate OCR extraction from check image
 * In production, this would use a real OCR service
 */
export function extractCheckDataFromImage(imageBase64: string): {
  amount?: string;
  date?: string;
  payee?: string;
} {
  // Simulate OCR results
  // In production, integrate with Google Cloud Vision, AWS Textract, or Azure Computer Vision
  console.log("OCR extraction would process image:", imageBase64.substring(0, 50) + "...");

  // Return empty results - actual implementation would parse check
  return {
    amount: undefined,
    date: undefined,
    payee: undefined,
  };
}
