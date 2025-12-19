/**
 * Multi-Account Management
 * Allows users to manage multiple accounts (checking, savings, money market, etc.)
 */

export type AdditionalAccountType = "savings" | "money_market" | "cd" | "investment";

export interface AdditionalAccount {
  id: string;
  userId: string;
  accountType: AdditionalAccountType;
  nickname: string;
  balance: string;
  currency: string;
  interestRate?: number;
  maturityDate?: string; // For CDs
  minimumBalance?: number;
  isLinked: boolean;
  createdAt: string;
  updatedAt: string;
}

const ADDITIONAL_ACCOUNTS_KEY = "banking_additional_accounts";

function generateAccountId(): string {
  // Generate a 12-digit account number
  return Array.from({ length: 12 }, () => Math.floor(Math.random() * 10).toString()).join("");
}

// Get all additional accounts for a user
export function getAdditionalAccounts(userId: string): AdditionalAccount[] {
  const data = localStorage.getItem(ADDITIONAL_ACCOUNTS_KEY);
  if (!data) return [];

  try {
    const allAccounts = JSON.parse(data) as AdditionalAccount[];
    return allAccounts
      .filter(a => a.userId === userId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } catch {
    return [];
  }
}

// Get a single additional account
export function getAdditionalAccount(accountId: string): AdditionalAccount | null {
  const data = localStorage.getItem(ADDITIONAL_ACCOUNTS_KEY);
  if (!data) return null;

  try {
    const allAccounts = JSON.parse(data) as AdditionalAccount[];
    return allAccounts.find(a => a.id === accountId) || null;
  } catch {
    return null;
  }
}

// Create a new additional account
export function createAdditionalAccount(
  userId: string,
  options: {
    accountType: AdditionalAccountType;
    nickname: string;
    initialDeposit?: number;
    interestRate?: number;
    maturityMonths?: number;
    minimumBalance?: number;
  }
): AdditionalAccount {
  const data = localStorage.getItem(ADDITIONAL_ACCOUNTS_KEY);
  const allAccounts: AdditionalAccount[] = data ? JSON.parse(data) : [];

  const now = new Date().toISOString();

  let maturityDate: string | undefined;
  if (options.accountType === "cd" && options.maturityMonths) {
    const maturity = new Date();
    maturity.setMonth(maturity.getMonth() + options.maturityMonths);
    maturityDate = maturity.toISOString();
  }

  const newAccount: AdditionalAccount = {
    id: generateAccountId(),
    userId,
    accountType: options.accountType,
    nickname: options.nickname,
    balance: (options.initialDeposit || 0).toFixed(2),
    currency: "USD",
    interestRate: options.interestRate,
    maturityDate,
    minimumBalance: options.minimumBalance,
    isLinked: true,
    createdAt: now,
    updatedAt: now,
  };

  allAccounts.push(newAccount);
  localStorage.setItem(ADDITIONAL_ACCOUNTS_KEY, JSON.stringify(allAccounts));

  return newAccount;
}

// Update an additional account
export function updateAdditionalAccount(
  accountId: string,
  updates: Partial<Pick<AdditionalAccount, "nickname" | "balance" | "isLinked">>
): AdditionalAccount | null {
  const data = localStorage.getItem(ADDITIONAL_ACCOUNTS_KEY);
  if (!data) return null;

  const allAccounts: AdditionalAccount[] = JSON.parse(data);
  const index = allAccounts.findIndex(a => a.id === accountId);

  if (index === -1) return null;

  const updated: AdditionalAccount = {
    ...allAccounts[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  allAccounts[index] = updated;
  localStorage.setItem(ADDITIONAL_ACCOUNTS_KEY, JSON.stringify(allAccounts));

  return updated;
}

// Delete an additional account
export function deleteAdditionalAccount(accountId: string): boolean {
  const data = localStorage.getItem(ADDITIONAL_ACCOUNTS_KEY);
  if (!data) return false;

  const allAccounts: AdditionalAccount[] = JSON.parse(data);
  const filtered = allAccounts.filter(a => a.id !== accountId);

  if (filtered.length === allAccounts.length) return false;

  localStorage.setItem(ADDITIONAL_ACCOUNTS_KEY, JSON.stringify(filtered));
  return true;
}

// Transfer between accounts
export function transferBetweenAccounts(
  fromAccountId: string,
  toAccountId: string,
  amount: number
): { success: boolean; message: string } {
  const fromAccount = getAdditionalAccount(fromAccountId);
  const toAccount = getAdditionalAccount(toAccountId);

  if (!fromAccount || !toAccount) {
    return { success: false, message: "Account not found" };
  }

  const fromBalance = parseFloat(fromAccount.balance);
  if (fromBalance < amount) {
    return { success: false, message: "Insufficient funds" };
  }

  // Check minimum balance requirement
  if (fromAccount.minimumBalance && (fromBalance - amount) < fromAccount.minimumBalance) {
    return {
      success: false,
      message: `Transfer would bring balance below minimum of $${fromAccount.minimumBalance}`,
    };
  }

  // Check if CD account (can't transfer out before maturity)
  if (fromAccount.accountType === "cd" && fromAccount.maturityDate) {
    if (new Date(fromAccount.maturityDate) > new Date()) {
      return {
        success: false,
        message: "Cannot withdraw from CD before maturity date",
      };
    }
  }

  // Perform transfer
  const newFromBalance = fromBalance - amount;
  const newToBalance = parseFloat(toAccount.balance) + amount;

  updateAdditionalAccount(fromAccountId, { balance: newFromBalance.toFixed(2) });
  updateAdditionalAccount(toAccountId, { balance: newToBalance.toFixed(2) });

  return { success: true, message: "Transfer completed" };
}

// Get total balance across all accounts
export function getTotalBalance(userId: string): number {
  const accounts = getAdditionalAccounts(userId);
  return accounts.reduce((total, account) => total + parseFloat(account.balance), 0);
}

// Get account type display name
export function getAccountTypeDisplay(type: AdditionalAccountType): string {
  switch (type) {
    case "savings":
      return "Savings Account";
    case "money_market":
      return "Money Market";
    case "cd":
      return "Certificate of Deposit";
    case "investment":
      return "Investment Account";
    default:
      return type;
  }
}

// Get default interest rates for account types
export function getDefaultInterestRate(type: AdditionalAccountType): number {
  switch (type) {
    case "savings":
      return 0.5;
    case "money_market":
      return 1.0;
    case "cd":
      return 4.5;
    case "investment":
      return 0;
    default:
      return 0;
  }
}

// Get account type icon color
export function getAccountTypeColor(type: AdditionalAccountType): string {
  switch (type) {
    case "savings":
      return "green";
    case "money_market":
      return "blue";
    case "cd":
      return "purple";
    case "investment":
      return "yellow";
    default:
      return "gray";
  }
}
