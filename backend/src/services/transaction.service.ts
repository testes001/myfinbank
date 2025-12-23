/**
 * Transaction Service
 * Handles internal transfers, P2P transfers, and transaction history
 */

import { PrismaClient } from '@prisma/client';
import { config } from '@/config';
import { errors } from '@/middleware/errorHandler';
import crypto from 'crypto';

const prisma = new PrismaClient();
const TxStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  REVERSED: 'REVERSED',
  CANCELLED: 'CANCELLED',
} as const;
const TransactionType = {
  TRANSFER: 'TRANSFER',
  P2P_TRANSFER: 'P2P_TRANSFER',
  DEPOSIT: 'DEPOSIT',
  WITHDRAWAL: 'WITHDRAWAL',
  PAYMENT: 'PAYMENT',
  REFUND: 'REFUND',
  FEE: 'FEE',
  INTEREST: 'INTEREST',
} as const;
const P2PStatus = {
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
} as const;
const AccountStatus = {
  ACTIVE: 'ACTIVE',
  CLOSED: 'CLOSED',
  FROZEN: 'FROZEN',
  RESTRICTED: 'RESTRICTED',
} as const;

// =============================================================================
// Types
// =============================================================================

export interface InternalTransferInput {
  userId: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  description?: string;
}

export interface P2PTransferInput {
  senderId: string;
  recipientEmail: string;
  fromAccountId: string;
  amount: number;
  memo?: string;
}

export interface TransactionFilters {
  userId: string;
  accountId?: string;
  type?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
}

// =============================================================================
// Transaction Service
// =============================================================================

export class TransactionService {
  /**
   * Generate unique reference number for transaction
   */
  private generateReferenceNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `TXN-${timestamp}-${random}`;
  }

  /**
   * Validate transaction amount and limits
   */
  private async validateTransactionLimits(
    userId: string,
    amount: number
  ): Promise<void> {
    if (amount <= 0) {
      throw errors.validation('Transaction amount must be greater than zero');
    }

    if (amount > config.maxTransactionAmount) {
      throw errors.validation(
        `Transaction amount exceeds maximum limit of ${config.maxTransactionAmount}`
      );
    }

    // Check daily transaction limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dailyTotal = await prisma.transaction.aggregate({
      where: {
        userId,
        createdAt: { gte: today },
        status: { in: [TxStatus.COMPLETED, TxStatus.PROCESSING] } as any,
        type: { in: [TransactionType.TRANSFER, TransactionType.P2P_TRANSFER] },
      },
      _sum: { amount: true },
    });

    const dailyAmount = Number(dailyTotal._sum.amount || 0);
    if (dailyAmount + amount > config.dailyTransactionLimit) {
      throw errors.transactionLimit(
        `Daily transaction limit of ${config.dailyTransactionLimit} would be exceeded`
      );
    }

    // Check monthly transaction limit
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthlyTotal = await prisma.transaction.aggregate({
      where: {
        userId,
        createdAt: { gte: monthStart },
        status: { in: [TxStatus.COMPLETED, TxStatus.PROCESSING] } as any,
        type: { in: [TransactionType.TRANSFER, TransactionType.P2P_TRANSFER] },
      },
      _sum: { amount: true },
    });

    const monthlyAmount = Number(monthlyTotal._sum.amount || 0);
    if (monthlyAmount + amount > config.monthlyTransactionLimit) {
      throw errors.transactionLimit(
        `Monthly transaction limit of ${config.monthlyTransactionLimit} would be exceeded`
      );
    }
  }

  /**
   * Create audit log for transaction
   */
  private async createTransactionAudit(
    userId: string,
    action: string,
    transactionId: string,
    metadata: any
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          actorId: userId,
          action,
          resource: 'transaction',
          resourceId: transactionId,
          status: 'SUCCESS',
          metadata,
        } as any,
      });
    } catch (error) {
      // Log error but don't fail transaction
      console.error('Failed to create audit log:', error);
    }
  }

  /**
   * Perform internal transfer between user's own accounts
   */
  async internalTransfer(
    input: InternalTransferInput
  ): Promise<any> {
    const { userId, fromAccountId, toAccountId, amount, description } = input;

    // Validate amount and limits
    await this.validateTransactionLimits(userId, amount);

    if (fromAccountId === toAccountId) {
      throw errors.validation('Cannot transfer to the same account');
    }

    // Get accounts with locking to prevent race conditions
    const [fromAccount, toAccount] = await Promise.all([
      prisma.account.findUnique({
        where: { id: fromAccountId },
      }),
      prisma.account.findUnique({
        where: { id: toAccountId },
      }),
    ]);

    // Validate from account
    if (!fromAccount || fromAccount.userId !== userId) {
      throw errors.notFound('Source account');
    }

    if (fromAccount.status !== AccountStatus.ACTIVE) {
      throw errors.accountLocked('Source account is not active');
    }

    if (Number(fromAccount.availableBalance) < amount) {
      throw errors.insufficientFunds(
        amount.toString(),
        fromAccount.availableBalance.toString()
      );
    }

    // Validate to account
    if (!toAccount || toAccount.userId !== userId) {
      throw errors.notFound('Destination account');
    }

    if (toAccount.status !== AccountStatus.ACTIVE) {
      throw errors.accountLocked('Destination account is not active');
    }

    // Currency check
    if (fromAccount.currency !== toAccount.currency) {
      throw errors.validation(
        'Cross-currency transfers are not currently supported'
      );
    }

    const referenceNumber = this.generateReferenceNumber();

    // Perform transfer in transaction
    const transaction = await prisma.$transaction(async (tx: any) => {
      // Create transaction record
      const txn = await tx.transaction.create({
        data: {
          userId,
          fromAccountId,
          toAccountId,
          type: TransactionType.TRANSFER,
          amount,
          currency: fromAccount.currency,
          status: TxStatus.PROCESSING as any,
          description: description || 'Internal account transfer',
          referenceNumber,
        },
      });

      // Update balances
      await tx.account.update({
        where: { id: fromAccountId },
        data: {
          balance: { decrement: amount },
          availableBalance: { decrement: amount },
        },
      });

      await tx.account.update({
        where: { id: toAccountId },
        data: {
          balance: { increment: amount },
          availableBalance: { increment: amount },
        },
      });

      // Complete transaction
      const completedTxn = await tx.transaction.update({
        where: { id: txn.id },
        data: {
          status: TxStatus.COMPLETED as any,
          completedAt: new Date(),
        },
        include: {
          fromAccount: true,
          toAccount: true,
        },
      });

      return completedTxn;
    });

    // Create audit log
    await this.createTransactionAudit(userId, 'TRANSFER', transaction.id, {
      fromAccountId,
      toAccountId,
      amount,
      referenceNumber,
    });

    return transaction;
  }

  /**
   * Perform P2P transfer to another user
   */
  async p2pTransfer(input: P2PTransferInput): Promise<any> {
    const { senderId, recipientEmail, fromAccountId, amount, memo } = input;

    // Validate amount and limits
    await this.validateTransactionLimits(senderId, amount);

    // Find recipient by email
    const recipient = await prisma.user.findUnique({
      where: { email: recipientEmail.toLowerCase() },
      include: {
        accounts: {
          where: {
            accountType: 'CHECKING',
            status: AccountStatus.ACTIVE,
          },
          take: 1,
        },
      },
    });

    if (!recipient) {
      throw errors.notFound('Recipient user');
    }

    if (recipient.id === senderId) {
      throw errors.validation('Cannot send P2P transfer to yourself');
    }

    if (recipient.accounts.length === 0) {
      throw errors.validation('Recipient does not have an active checking account');
    }

    const recipientAccountId = recipient.accounts[0].id;

    // Get sender account
    const senderAccount = await prisma.account.findUnique({
      where: { id: fromAccountId },
    });

    if (!senderAccount || senderAccount.userId !== senderId) {
      throw errors.notFound('Source account');
    }

    if (senderAccount.status !== AccountStatus.ACTIVE) {
      throw errors.accountLocked('Source account is not active');
    }

    if (Number(senderAccount.availableBalance) < amount) {
      throw errors.insufficientFunds(
        amount.toString(),
        senderAccount.availableBalance.toString()
      );
    }

    const senderReferenceNumber = this.generateReferenceNumber();
    const recipientReferenceNumber = this.generateReferenceNumber();

    // Perform P2P transfer in transaction
    const p2pTransfer = await prisma.$transaction(async (tx: any) => {
      // Create P2P transfer record
      const p2p = await tx.p2PTransfer.create({
        data: {
          senderId,
          recipientId: recipient.id,
          amount,
          currency: senderAccount.currency,
          memo: memo || 'P2P transfer',
          status: P2PStatus.PENDING as any,
        },
      });

      // Create transaction records for both parties
      await tx.transaction.create({
        data: {
          userId: senderId,
          fromAccountId,
          toAccountId: recipientAccountId,
          type: TransactionType.P2P_TRANSFER,
          amount,
          currency: senderAccount.currency,
          status: TxStatus.PROCESSING as any,
          description: `P2P transfer to ${recipientEmail}`,
          referenceNumber: senderReferenceNumber,
          metadata: { p2pTransferId: p2p.id, recipientEmail, role: 'sender' },
        },
      });

      await tx.transaction.create({
        data: {
          userId: recipient.id,
          fromAccountId,
          toAccountId: recipientAccountId,
          type: TransactionType.P2P_TRANSFER,
          amount,
          currency: senderAccount.currency,
          status: TxStatus.PROCESSING as any,
          description: `P2P transfer from ${senderAccount.userId}`,
          referenceNumber: recipientReferenceNumber,
          metadata: { p2pTransferId: p2p.id, senderEmail: recipientEmail, role: 'recipient' },
        },
      });

      // Update balances
      await tx.account.update({
        where: { id: fromAccountId },
        data: {
          balance: { decrement: amount },
          availableBalance: { decrement: amount },
        },
      });

      await tx.account.update({
        where: { id: recipientAccountId },
        data: {
          balance: { increment: amount },
          availableBalance: { increment: amount },
        },
      });

      // Complete P2P transfer
      const completedP2P = await tx.p2PTransfer.update({
        where: { id: p2p.id },
        data: {
          status: P2PStatus.COMPLETED as any,
          completedAt: new Date(),
        },
        include: {
          sender: { select: { id: true, email: true, fullName: true } },
          recipient: { select: { id: true, email: true, fullName: true } },
        },
      });

      // Update transaction statuses
      await tx.transaction.updateMany({
        where: {
          referenceNumber: {
            in: [senderReferenceNumber, recipientReferenceNumber],
          },
        },
        data: {
          status: TxStatus.COMPLETED as any,
          completedAt: new Date(),
        },
      });

      return completedP2P;
    });

    // Create audit log
    await this.createTransactionAudit(senderId, 'P2P_TRANSFER', p2pTransfer.id, {
      recipientEmail,
      amount,
      senderReferenceNumber,
      recipientReferenceNumber,
    });

    return p2pTransfer;
  }

  /**
   * Get transaction history with filters and pagination
   */
  async getTransactionHistory(
    filters: TransactionFilters
  ): Promise<{ transactions: any[]; total: number; page: number; totalPages: number }> {
    const {
      userId,
      accountId,
      type,
      status,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      page = 1,
      limit = 20,
    } = filters;

    // Build where clause
    const where: any = {
      userId,
    };

    if (accountId) {
      where.OR = [
        { fromAccountId: accountId },
        { toAccountId: accountId },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    if (minAmount !== undefined || maxAmount !== undefined) {
      where.amount = {};
      if (minAmount !== undefined) {
        where.amount.gte = minAmount;
      }
      if (maxAmount !== undefined) {
        where.amount.lte = maxAmount;
      }
    }

    // Get total count
    const total = await prisma.transaction.count({ where });

    // Get transactions
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        fromAccount: {
          select: {
            id: true,
            accountNumber: true,
            accountType: true,
          },
        },
        toAccount: {
          select: {
            id: true,
            accountNumber: true,
            accountType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(
    transactionId: string,
    userId: string
  ): Promise<any> {
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        fromAccount: {
          select: {
            id: true,
            accountNumber: true,
            accountType: true,
          },
        },
        toAccount: {
          select: {
            id: true,
            accountNumber: true,
            accountType: true,
          },
        },
      },
    });

    if (!transaction) {
      throw errors.notFound('Transaction');
    }

    if (transaction.userId !== userId) {
      throw errors.forbidden('Access this transaction');
    }

    return transaction;
  }

  /**
   * Get account balance history
   */
  async getBalanceHistory(
    accountId: string,
    userId: string,
    days: number = 30
  ): Promise<any[]> {
    // Verify account ownership
    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account || account.userId !== userId) {
      throw errors.notFound('Account');
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { fromAccountId: accountId },
          { toAccountId: accountId },
        ],
        status: TxStatus.COMPLETED as any,
        createdAt: { gte: startDate },
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        amount: true,
        createdAt: true,
        fromAccountId: true,
        toAccountId: true,
      },
    });

    // Calculate running balance
    let runningBalance = Number(account.balance);
    const balanceHistory = [];

    // Work backwards from current balance
    for (let i = transactions.length - 1; i >= 0; i--) {
      const txn = transactions[i];

      // Add current balance point
      balanceHistory.unshift({
        date: txn.createdAt,
        balance: runningBalance,
        transactionId: txn.id,
      });

      // Adjust balance for previous point
      if (txn.toAccountId === accountId) {
        runningBalance -= Number(txn.amount);
      } else {
        runningBalance += Number(txn.amount);
      }
    }

    return balanceHistory;
  }
}

export const transactionService = new TransactionService();
