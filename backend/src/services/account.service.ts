/**
 * Account Service
 * Business logic for account management
 */

import { PrismaClient } from '@prisma/client';
import { log } from '@/utils/logger';
import { errors } from '@/middleware/errorHandler';
import { encrypt, decrypt } from '@/utils/encryption';

const prisma = new PrismaClient();
const AccountStatus = {
  ACTIVE: 'ACTIVE',
  CLOSED: 'CLOSED',
  FROZEN: 'FROZEN',
  RESTRICTED: 'RESTRICTED',
} as const;

export interface CreateAccountInput {
  userId: string;
  accountType: string;
  currency?: string;
  initialDeposit?: number;
}

export class AccountService {
  /**
   * Get all accounts for a user
   */
  async getUserAccounts(userId: string): Promise<any[]> {
    const accounts = await prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    log.debug('Retrieved user accounts', { userId, count: accounts.length });

    return accounts;
  }

  /**
   * Get account by ID
   */
  async getAccountById(accountId: string, userId: string): Promise<any> {
    const account = await prisma.account.findFirst({
      where: {
        id: accountId,
        userId, // Ensure user owns the account
      },
    });

    if (!account) {
      throw errors.notFound('Account');
    }

    return account;
  }

  /**
   * Create new account
   */
  async createAccount(input: CreateAccountInput): Promise<any> {
    const { userId, accountType, currency = 'USD', initialDeposit = 0 } = input;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw errors.notFound('User');
    }

    // Generate account number
    const accountNumber = this.generateAccountNumber();

    // Create account
    const account = await prisma.account.create({
      data: {
        userId,
        accountNumber,
        routingNumber: '021000021', // Example routing number
        accountType,
        balance: initialDeposit,
        availableBalance: initialDeposit,
        currency,
        status: AccountStatus.ACTIVE,
      },
    });

    // Log creation
    log.info('Account created', {
      userId,
      accountId: account.id,
      accountType,
    });

    await prisma.auditLog.create({
      data: {
        actorId: userId,
        actorType: 'USER',
        action: 'account_created',
        resource: 'account',
        resourceId: account.id,
        status: 'SUCCESS',
        details: { accountType, currency, initialDeposit },
      },
    });

    return account;
  }

  /**
   * Update account status
   */
  async updateAccountStatus(accountId: string, userId: string, status: any): Promise<any> {
    // Verify ownership
    await this.getAccountById(accountId, userId);

    const account = await prisma.account.update({
      where: { id: accountId },
      data: { status },
    });

    log.info('Account status updated', { accountId, status });

    await prisma.auditLog.create({
      data: {
        actorId: userId,
        actorType: 'USER',
        action: 'account_status_updated',
        resource: 'account',
        resourceId: accountId,
        status: 'SUCCESS',
        details: { newStatus: status },
      },
    });

    return account;
  }

  /**
   * Get account balance
   */
  async getAccountBalance(accountId: string, userId: string): Promise<{ balance: number; availableBalance: number }> {
    const account = await this.getAccountById(accountId, userId);

    return {
      balance: Number(account.balance),
      availableBalance: Number(account.availableBalance),
    };
  }

  /**
   * Mask account number for display
   */
  maskAccountNumber(accountNumber: string): string {
    if (accountNumber.length < 4) return '****';
    const last4 = accountNumber.slice(-4);
    return `****${last4}`;
  }

  /**
   * Generate account number
   */
  private generateAccountNumber(): string {
    // Generate 10-digit account number
    const accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    return accountNumber;
  }
}

export const accountService = new AccountService();
