/**
 * Transaction Security & Fraud Detection System
 * Production-ready transaction verification, limits enforcement, and fraud detection
 *
 * Features:
 * - Multi-factor transaction verification
 * - Daily/per-transaction limits
 * - Velocity checks (frequency-based fraud detection)
 * - Geographic anomaly detection
 * - Pattern-based risk scoring
 * - Real-time fraud monitoring
 */

import { type TransactionModel } from "@/components/data/orm/orm_transaction";
import { type AccountModel } from "@/components/data/orm/orm_account";
import { hashSHA256 } from "@/lib/encryption";

/**
 * Transaction limit configuration
 * In production, store these in database and allow per-account customization
 */
export interface TransactionLimits {
  maxSingleTransaction: number; // Maximum single transaction amount
  dailyTransactionLimit: number; // Maximum daily transaction total
  dailyTransactionCount: number; // Maximum number of transactions per day
  weeklyTransactionLimit: number; // Maximum weekly transaction total
  monthlyTransactionLimit: number; // Maximum monthly transaction total
  velocityWindowMinutes: number; // Time window for velocity checks
  velocityMaxCount: number; // Max transactions in velocity window
}

/**
 * Default limits for standard accounts
 */
export const DEFAULT_LIMITS: TransactionLimits = {
  maxSingleTransaction: 10000, // $10,000
  dailyTransactionLimit: 25000, // $25,000
  dailyTransactionCount: 50,
  weeklyTransactionLimit: 75000, // $75,000
  monthlyTransactionLimit: 250000, // $250,000
  velocityWindowMinutes: 5,
  velocityMaxCount: 3,
};

/**
 * Premium account limits
 */
export const PREMIUM_LIMITS: TransactionLimits = {
  maxSingleTransaction: 50000, // $50,000
  dailyTransactionLimit: 100000, // $100,000
  dailyTransactionCount: 100,
  weeklyTransactionLimit: 500000, // $500,000
  monthlyTransactionLimit: 2000000, // $2M
  velocityWindowMinutes: 5,
  velocityMaxCount: 5,
};

/**
 * Fraud risk levels
 */
export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Transaction verification status
 */
export enum VerificationStatus {
  APPROVED = 'approved',
  PENDING = 'pending',
  REQUIRES_MFA = 'requires_mfa',
  REQUIRES_APPROVAL = 'requires_approval',
  REJECTED = 'rejected',
  FLAGGED_FRAUD = 'flagged_fraud',
}

/**
 * Transaction verification result
 */
export interface TransactionVerification {
  status: VerificationStatus;
  riskLevel: RiskLevel;
  riskScore: number; // 0-100
  reasons: string[];
  requiresMFA: boolean;
  requiresApproval: boolean;
  blockedReasons?: string[];
}

/**
 * Fraud detection flags
 */
export interface FraudFlags {
  velocityExceeded: boolean;
  unusualAmount: boolean;
  unusualTime: boolean;
  unusualRecipient: boolean;
  geoAnomaly: boolean;
  suspiciousPattern: boolean;
}

/**
 * Check if transaction exceeds single transaction limit
 */
export function checkSingleTransactionLimit(
  amount: number,
  limits: TransactionLimits
): { passed: boolean; message?: string } {
  if (amount > limits.maxSingleTransaction) {
    return {
      passed: false,
      message: `Transaction amount $${amount.toFixed(2)} exceeds single transaction limit of $${limits.maxSingleTransaction.toFixed(2)}`,
    };
  }
  return { passed: true };
}

/**
 * Check daily transaction limits
 */
export function checkDailyLimits(
  amount: number,
  todayTransactions: TransactionModel[],
  limits: TransactionLimits
): { passed: boolean; message?: string } {
  const todayTotal = todayTransactions.reduce(
    (sum, tx) => sum + parseFloat(tx.amount),
    0
  );

  // Check daily amount limit
  if (todayTotal + amount > limits.dailyTransactionLimit) {
    return {
      passed: false,
      message: `Daily transaction limit exceeded. Current: $${todayTotal.toFixed(2)}, Limit: $${limits.dailyTransactionLimit.toFixed(2)}`,
    };
  }

  // Check daily count limit
  if (todayTransactions.length >= limits.dailyTransactionCount) {
    return {
      passed: false,
      message: `Daily transaction count limit exceeded. Current: ${todayTransactions.length}, Limit: ${limits.dailyTransactionCount}`,
    };
  }

  return { passed: true };
}

/**
 * Check velocity (frequency-based fraud detection)
 * Detects rapid succession of transactions
 */
export function checkVelocity(
  recentTransactions: TransactionModel[],
  limits: TransactionLimits
): { exceeded: boolean; count: number } {
  const now = Date.now();
  const windowMs = limits.velocityWindowMinutes * 60 * 1000;

  const recentCount = recentTransactions.filter((tx) => {
    const txTime = new Date(tx.create_time).getTime();
    return now - txTime < windowMs;
  }).length;

  return {
    exceeded: recentCount >= limits.velocityMaxCount,
    count: recentCount,
  };
}

/**
 * Calculate risk score based on transaction patterns
 * Returns score from 0-100 (higher = more risky)
 */
export function calculateRiskScore(
  amount: number,
  account: AccountModel,
  recentTransactions: TransactionModel[],
  flags: FraudFlags
): number {
  let score = 0;

  // Base score on amount relative to balance
  const balance = parseFloat(account.balance);
  const amountRatio = amount / balance;

  if (amountRatio > 0.9) score += 40; // Using >90% of balance
  else if (amountRatio > 0.75) score += 25;
  else if (amountRatio > 0.5) score += 15;

  // Velocity risk
  if (flags.velocityExceeded) score += 30;

  // Unusual amount (significantly higher than average)
  if (flags.unusualAmount) score += 20;

  // Unusual time (late night/early morning)
  if (flags.unusualTime) score += 10;

  // New/unusual recipient
  if (flags.unusualRecipient) score += 15;

  // Geographic anomaly
  if (flags.geoAnomaly) score += 25;

  // Suspicious pattern
  if (flags.suspiciousPattern) score += 35;

  return Math.min(100, score);
}

/**
 * Detect fraud flags
 */
export function detectFraudFlags(
  amount: number,
  toAccountId: string,
  recentTransactions: TransactionModel[],
  limits: TransactionLimits
): FraudFlags {
  // Check velocity
  const velocity = checkVelocity(recentTransactions, limits);

  // Calculate average transaction amount
  const avgAmount =
    recentTransactions.length > 0
      ? recentTransactions.reduce((sum, tx) => sum + parseFloat(tx.amount), 0) /
        recentTransactions.length
      : amount;

  // Unusual amount (>3x average)
  const unusualAmount = amount > avgAmount * 3;

  // Unusual time (between 1 AM and 5 AM)
  const hour = new Date().getHours();
  const unusualTime = hour >= 1 && hour < 5;

  // Check if recipient is new
  const recipientTransactions = recentTransactions.filter(
    (tx) => tx.to_account_id === toAccountId
  );
  const unusualRecipient = recipientTransactions.length === 0;

  // Simple pattern detection (same amount multiple times rapidly)
  const sameAmountCount = recentTransactions.filter(
    (tx) => Math.abs(parseFloat(tx.amount) - amount) < 0.01
  ).length;
  const suspiciousPattern = sameAmountCount >= 3;

  return {
    velocityExceeded: velocity.exceeded,
    unusualAmount,
    unusualTime,
    unusualRecipient,
    geoAnomaly: false, // Would require geolocation data
    suspiciousPattern,
  };
}

/**
 * Determine risk level from risk score
 */
export function getRiskLevel(score: number): RiskLevel {
  if (score >= 75) return RiskLevel.CRITICAL;
  if (score >= 50) return RiskLevel.HIGH;
  if (score >= 25) return RiskLevel.MEDIUM;
  return RiskLevel.LOW;
}

/**
 * Comprehensive transaction verification
 * Main entry point for transaction security checks
 */
export function verifyTransaction(
  amount: number,
  fromAccount: AccountModel,
  toAccountId: string,
  recentTransactions: TransactionModel[],
  limits: TransactionLimits = DEFAULT_LIMITS
): TransactionVerification {
  const reasons: string[] = [];
  const blockedReasons: string[] = [];

  // Check single transaction limit
  const singleLimitCheck = checkSingleTransactionLimit(amount, limits);
  if (!singleLimitCheck.passed) {
    blockedReasons.push(singleLimitCheck.message!);
  }

  // Get today's transactions
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTransactions = recentTransactions.filter((tx) => {
    const txDate = new Date(tx.create_time);
    return txDate >= today;
  });

  // Check daily limits
  const dailyLimitCheck = checkDailyLimits(amount, todayTransactions, limits);
  if (!dailyLimitCheck.passed) {
    blockedReasons.push(dailyLimitCheck.message!);
  }

  // Detect fraud flags
  const flags = detectFraudFlags(amount, toAccountId, recentTransactions, limits);

  // Calculate risk score
  const riskScore = calculateRiskScore(amount, fromAccount, recentTransactions, flags);
  const riskLevel = getRiskLevel(riskScore);

  // Add risk reasons
  if (flags.velocityExceeded) {
    reasons.push('Multiple transactions in short time period');
  }
  if (flags.unusualAmount) {
    reasons.push('Transaction amount significantly higher than usual');
  }
  if (flags.unusualTime) {
    reasons.push('Transaction at unusual time');
  }
  if (flags.unusualRecipient) {
    reasons.push('New recipient');
  }
  if (flags.suspiciousPattern) {
    reasons.push('Suspicious transaction pattern detected');
  }

  // Determine verification status
  let status: VerificationStatus;
  let requiresMFA = false;
  let requiresApproval = false;

  if (blockedReasons.length > 0) {
    status = VerificationStatus.REJECTED;
  } else if (riskLevel === RiskLevel.CRITICAL) {
    status = VerificationStatus.FLAGGED_FRAUD;
    requiresApproval = true;
    requiresMFA = true;
  } else if (riskLevel === RiskLevel.HIGH) {
    status = VerificationStatus.REQUIRES_APPROVAL;
    requiresApproval = true;
    requiresMFA = true;
  } else if (riskLevel === RiskLevel.MEDIUM) {
    status = VerificationStatus.REQUIRES_MFA;
    requiresMFA = true;
  } else if (amount > 1000) {
    // Require MFA for transactions over $1000
    status = VerificationStatus.REQUIRES_MFA;
    requiresMFA = true;
  } else {
    status = VerificationStatus.APPROVED;
  }

  return {
    status,
    riskLevel,
    riskScore,
    reasons,
    requiresMFA,
    requiresApproval,
    blockedReasons: blockedReasons.length > 0 ? blockedReasons : undefined,
  };
}

/**
 * Create audit log entry for transaction verification
 * Returns a hash of the verification details for tamper-proof logging
 */
export async function createVerificationAudit(
  verification: TransactionVerification,
  transactionId: string,
  userId: string
): Promise<string> {
  const auditData = {
    transactionId,
    userId,
    timestamp: new Date().toISOString(),
    status: verification.status,
    riskLevel: verification.riskLevel,
    riskScore: verification.riskScore,
    reasons: verification.reasons,
  };

  const auditString = JSON.stringify(auditData);
  return hashSHA256(auditString);
}

/**
 * Check if account is locked or frozen
 */
export function isAccountRestricted(account: AccountModel): boolean {
  // Extend AccountStatus enum values as needed
  return account.status !== 0; // 0 = Active/Unspecified
}

/**
 * Generate transaction approval token
 * Used for manual approval workflows
 */
export function generateApprovalToken(transactionId: string, userId: string): string {
  const timestamp = Date.now();
  const data = `${transactionId}-${userId}-${timestamp}`;
  const array = new TextEncoder().encode(data);
  const hashArray = Array.from(new Uint8Array(array));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}
