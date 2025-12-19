/**
 * Transaction Limits & Spending Controls
 * Daily/weekly/monthly transaction limits and velocity checks
 */

import { type TransactionModel, TransactionTransactionType } from "@/components/data/orm/orm_transaction";
import { addSuspiciousActivityFlag } from "./admin-storage";

export interface TransactionLimits {
  dailyLimit: number;
  weeklyLimit: number;
  monthlyLimit: number;
  singleTransactionMax: number;
  dailyTransactionCount: number;
}

export interface AccountControls {
  userId: string;
  accountId: string;
  limits: TransactionLimits;
  frozen: boolean;
  frozenReason?: string;
  frozenAt?: string;
  frozenBy?: string;
  restrictedCountries?: string[];
  allowInternational: boolean;
}

const CONTROLS_KEY = "banking_account_controls";
const DEFAULT_LIMITS: TransactionLimits = {
  dailyLimit: 5000,
  weeklyLimit: 20000,
  monthlyLimit: 50000,
  singleTransactionMax: 10000,
  dailyTransactionCount: 20,
};

export function getAccountControls(userId: string, accountId: string): AccountControls {
  try {
    const stored = localStorage.getItem(CONTROLS_KEY);
    const controls: Record<string, AccountControls> = stored ? JSON.parse(stored) : {};

    const key = `${userId}-${accountId}`;
    if (!controls[key]) {
      controls[key] = {
        userId,
        accountId,
        limits: { ...DEFAULT_LIMITS },
        frozen: false,
        allowInternational: true,
        restrictedCountries: ["KP", "IR", "SY"], // North Korea, Iran, Syria
      };
      localStorage.setItem(CONTROLS_KEY, JSON.stringify(controls));
    }

    return controls[key];
  } catch (error) {
    console.error("Failed to get account controls:", error);
    return {
      userId,
      accountId,
      limits: { ...DEFAULT_LIMITS },
      frozen: false,
      allowInternational: true,
    };
  }
}

export function updateAccountControls(
  userId: string,
  accountId: string,
  updates: Partial<AccountControls>
): void {
  try {
    const stored = localStorage.getItem(CONTROLS_KEY);
    const controls: Record<string, AccountControls> = stored ? JSON.parse(stored) : {};

    const key = `${userId}-${accountId}`;
    controls[key] = {
      ...getAccountControls(userId, accountId),
      ...updates,
    };

    localStorage.setItem(CONTROLS_KEY, JSON.stringify(controls));
  } catch (error) {
    console.error("Failed to update account controls:", error);
  }
}

export function freezeAccount(
  userId: string,
  accountId: string,
  reason: string,
  adminId: string
): void {
  updateAccountControls(userId, accountId, {
    frozen: true,
    frozenReason: reason,
    frozenAt: new Date().toISOString(),
    frozenBy: adminId,
  });
}

export function unfreezeAccount(userId: string, accountId: string): void {
  updateAccountControls(userId, accountId, {
    frozen: false,
    frozenReason: undefined,
    frozenAt: undefined,
    frozenBy: undefined,
  });
}

export function checkTransactionAllowed(
  userId: string,
  accountId: string,
  amount: number,
  recentTransactions: TransactionModel[]
): {
  allowed: boolean;
  reason?: string;
  flagForReview?: boolean;
} {
  const controls = getAccountControls(userId, accountId);

  // Check if account is frozen
  if (controls.frozen) {
    return {
      allowed: false,
      reason: `Account is frozen: ${controls.frozenReason}`,
    };
  }

  // Check single transaction limit
  if (amount > controls.limits.singleTransactionMax) {
    return {
      allowed: false,
      reason: `Transaction exceeds single transaction limit of $${controls.limits.singleTransactionMax.toLocaleString()}`,
      flagForReview: true,
    };
  }

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Calculate spending in different periods
  const dailySpending = recentTransactions
    .filter((t) => new Date(t.create_time) >= oneDayAgo)
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const weeklySpending = recentTransactions
    .filter((t) => new Date(t.create_time) >= oneWeekAgo)
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const monthlySpending = recentTransactions
    .filter((t) => new Date(t.create_time) >= oneMonthAgo)
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const dailyCount = recentTransactions.filter(
    (t) => new Date(t.create_time) >= oneDayAgo
  ).length;

  // Check daily limit
  if (dailySpending + amount > controls.limits.dailyLimit) {
    return {
      allowed: false,
      reason: `Daily limit of $${controls.limits.dailyLimit.toLocaleString()} would be exceeded`,
    };
  }

  // Check weekly limit
  if (weeklySpending + amount > controls.limits.weeklyLimit) {
    return {
      allowed: false,
      reason: `Weekly limit of $${controls.limits.weeklyLimit.toLocaleString()} would be exceeded`,
    };
  }

  // Check monthly limit
  if (monthlySpending + amount > controls.limits.monthlyLimit) {
    return {
      allowed: false,
      reason: `Monthly limit of $${controls.limits.monthlyLimit.toLocaleString()} would be exceeded`,
    };
  }

  // Check daily transaction count
  if (dailyCount >= controls.limits.dailyTransactionCount) {
    return {
      allowed: false,
      reason: `Daily transaction count limit of ${controls.limits.dailyTransactionCount} reached`,
    };
  }

  // Flag for review if approaching limits
  if (
    dailySpending + amount > controls.limits.dailyLimit * 0.9 ||
    amount > controls.limits.singleTransactionMax * 0.8
  ) {
    return {
      allowed: true,
      flagForReview: true,
    };
  }

  return { allowed: true };
}

export function detectRapidTransfers(
  userId: string,
  recentTransactions: TransactionModel[]
): boolean {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const recentTransfers = recentTransactions.filter(
    (t) =>
      new Date(t.create_time) >= oneHourAgo &&
      t.transaction_type === 0
  );

  // Flag if more than 5 transfers in one hour
  if (recentTransfers.length >= 5) {
    addSuspiciousActivityFlag({
      userId,
      flagType: "rapid_transfers",
      severity: "high",
      description: `${recentTransfers.length} transfers detected within one hour`,
    });
    return true;
  }

  return false;
}

export function checkVelocityRules(
  userId: string,
  amount: number,
  recentTransactions: TransactionModel[]
): {
  passed: boolean;
  flags: string[];
} {
  const flags: string[] = [];
  const now = new Date();

  // Check for unusual large transactions (3x average)
  const avgTransactionAmount =
    recentTransactions.reduce((sum, t) => sum + parseFloat(t.amount), 0) /
    Math.max(recentTransactions.length, 1);

  if (amount > avgTransactionAmount * 3 && recentTransactions.length > 0) {
    flags.push("Transaction is significantly larger than average");
    addSuspiciousActivityFlag({
      userId,
      flagType: "unusual_amount",
      severity: "medium",
      description: `Transaction of $${amount} is ${Math.round(
        amount / avgTransactionAmount
      )}x larger than average`,
    });
  }

  // Check for rapid succession (multiple transactions within 5 minutes)
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const veryRecentCount = recentTransactions.filter(
    (t) => new Date(t.create_time) >= fiveMinutesAgo
  ).length;

  if (veryRecentCount >= 3) {
    flags.push("Multiple transactions detected in short time period");
  }

  return {
    passed: flags.length === 0,
    flags,
  };
}
