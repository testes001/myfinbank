/**
 * Transaction Controller
 * HTTP request handlers for transaction endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { transactionService } from '@/services/transaction.service';
import { asyncHandler, errors } from '@/middleware/errorHandler';
import { TransactionType, TransactionStatus } from '@prisma/client';

// =============================================================================
// Validation Schemas
// =============================================================================

const internalTransferSchema = z.object({
  fromAccountId: z.string().min(6),
  toAccountId: z.string().min(6),
  amount: z.number().positive('Amount must be greater than zero'),
  description: z.string().max(500).optional(),
  idempotencyKey: z.string().uuid().optional(),
});

const p2pTransferSchema = z.object({
  recipientEmail: z.string().email('Invalid recipient email address'),
  fromAccountId: z.string().uuid('Invalid source account ID'),
  amount: z.number().positive('Amount must be greater than zero'),
  memo: z.string().max(500).optional(),
});

const transactionFiltersSchema = z.object({
  accountId: z.string().uuid().optional(),
  type: z.nativeEnum(TransactionType).optional(),
  status: z.nativeEnum(TransactionStatus).optional(),
  startDate: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().datetime().optional().transform(val => val ? new Date(val) : undefined),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
});

// =============================================================================
// Transaction Controller
// =============================================================================

export class TransactionController {
  /**
   * POST /api/transactions/transfer
   * Perform internal transfer between user's own accounts
   */
  internalTransfer = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw errors.unauthorized();
      }

      const validationResult = internalTransferSchema.safeParse(req.body);

      if (!validationResult.success) {
        throw errors.validation('Invalid request body', validationResult.error.errors);
      }

      const { fromAccountId, toAccountId, amount, description } = validationResult.data;

      const transaction = await transactionService.internalTransfer({
        userId: req.user.userId,
        fromAccountId,
        toAccountId,
        amount,
        description,
      });

      const txWithAccounts: any = transaction;

      res.status(201).json({
        success: true,
        message: 'Transfer completed successfully',
        data: {
          id: transaction.id,
          type: transaction.type,
          amount: Number(transaction.amount).toFixed(2),
          currency: transaction.currency,
          status: transaction.status,
          referenceNumber: transaction.referenceNumber,
          description: transaction.description,
          createdAt: transaction.createdAt,
          completedAt: transaction.completedAt,
          fromAccount: txWithAccounts.fromAccount
            ? {
                id: txWithAccounts.fromAccount.id,
                accountNumber: `****${txWithAccounts.fromAccount.accountNumber.slice(-4)}`,
                accountType: txWithAccounts.fromAccount.accountType,
              }
            : null,
          toAccount: txWithAccounts.toAccount
            ? {
                id: txWithAccounts.toAccount.id,
                accountNumber: `****${txWithAccounts.toAccount.accountNumber.slice(-4)}`,
                accountType: txWithAccounts.toAccount.accountType,
              }
            : null,
        },
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );

  /**
   * POST /api/transactions/p2p
   * Perform P2P transfer to another user
   */
  p2pTransfer = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw errors.unauthorized();
      }

      const validationResult = p2pTransferSchema.safeParse(req.body);

      if (!validationResult.success) {
        throw errors.validation('Invalid request body', validationResult.error.errors);
      }

      const { recipientEmail, fromAccountId, amount, memo } = validationResult.data;

      const p2pTransfer = await transactionService.p2pTransfer({
        senderId: req.user.userId,
        recipientEmail,
        fromAccountId,
        amount,
        memo,
      });

      const transferWithRelations: any = p2pTransfer;

      res.status(201).json({
        success: true,
        message: 'P2P transfer completed successfully',
        data: {
          id: p2pTransfer.id,
          amount: Number(p2pTransfer.amount).toFixed(2),
          currency: p2pTransfer.currency,
          status: p2pTransfer.status,
          memo: p2pTransfer.memo,
          createdAt: p2pTransfer.createdAt,
          completedAt: p2pTransfer.completedAt,
          sender: transferWithRelations.sender
            ? {
                id: transferWithRelations.sender.id,
                email: transferWithRelations.sender.email,
                fullName: transferWithRelations.sender.fullName,
              }
            : null,
          recipient: transferWithRelations.recipient
            ? {
                id: transferWithRelations.recipient.id,
                email: transferWithRelations.recipient.email,
                fullName: transferWithRelations.recipient.fullName,
              }
            : null,
        },
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );

  /**
   * GET /api/transactions
   * Get transaction history with filters and pagination
   */
  getTransactions = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw errors.unauthorized();
      }

      const validationResult = transactionFiltersSchema.safeParse(req.query);

      if (!validationResult.success) {
        throw errors.validation('Invalid query parameters', validationResult.error.errors);
      }

      const filters = {
        ...(validationResult.data as any),
        userId: req.user.userId,
      } as any;

      const result = await transactionService.getTransactionHistory(filters);

      // Format transactions for response
      const formattedTransactions = result.transactions.map((txn) => {
        const txWithAccounts: any = txn;
        return {
          id: txn.id,
          type: txn.type,
          amount: Number(txn.amount).toFixed(2),
          currency: txn.currency,
          status: txn.status,
          description: txn.description,
          referenceNumber: txn.referenceNumber,
          createdAt: txn.createdAt,
          completedAt: txn.completedAt,
          fromAccount: txWithAccounts.fromAccount
            ? {
                id: txWithAccounts.fromAccount.id,
                accountNumber: `****${txWithAccounts.fromAccount.accountNumber.slice(-4)}`,
                accountType: txWithAccounts.fromAccount.accountType,
              }
            : null,
          toAccount: txWithAccounts.toAccount
            ? {
                id: txWithAccounts.toAccount.id,
                accountNumber: `****${txWithAccounts.toAccount.accountNumber.slice(-4)}`,
                accountType: txWithAccounts.toAccount.accountType,
              }
            : null,
        };
      });

      res.status(200).json({
        success: true,
        data: formattedTransactions,
        pagination: {
          page: result.page,
          limit: filters.limit,
          total: result.total,
          totalPages: result.totalPages,
        },
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );

  /**
   * GET /api/transactions/:id
   * Get specific transaction details
   */
  getTransactionById = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw errors.unauthorized();
      }

      const transactionId = req.params.id;

      if (!transactionId) {
        throw errors.validation('Transaction ID is required');
      }

      const transaction = await transactionService.getTransactionById(
        transactionId,
        req.user.userId
      );

      const txWithAccounts: any = transaction;

      res.status(200).json({
        success: true,
        data: {
          id: transaction.id,
          type: transaction.type,
          amount: Number(transaction.amount).toFixed(2),
          currency: transaction.currency,
          status: transaction.status,
          description: transaction.description,
          referenceNumber: transaction.referenceNumber,
          metadata: transaction.metadata,
          failureReason: transaction.failureReason,
          createdAt: transaction.createdAt,
          completedAt: transaction.completedAt,
          fromAccount: txWithAccounts.fromAccount
            ? {
                id: txWithAccounts.fromAccount.id,
                accountNumber: `****${txWithAccounts.fromAccount.accountNumber.slice(-4)}`,
                accountType: txWithAccounts.fromAccount.accountType,
              }
            : null,
          toAccount: txWithAccounts.toAccount
            ? {
                id: txWithAccounts.toAccount.id,
                accountNumber: `****${txWithAccounts.toAccount.accountNumber.slice(-4)}`,
                accountType: txWithAccounts.toAccount.accountType,
              }
            : null,
        },
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );

  /**
   * GET /api/transactions/balance-history/:accountId
   * Get account balance history
   */
  getBalanceHistory = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw errors.unauthorized();
      }

      const accountId = req.params.accountId;
      const days = parseInt(req.query.days as string) || 30;

      if (!accountId) {
        throw errors.validation('Account ID is required');
      }

      if (days < 1 || days > 365) {
        throw errors.validation('Days must be between 1 and 365');
      }

      const balanceHistory = await transactionService.getBalanceHistory(
        accountId,
        req.user.userId,
        days
      );

      res.status(200).json({
        success: true,
        data: balanceHistory,
        meta: {
          accountId,
          days,
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );
}

export const transactionController = new TransactionController();
