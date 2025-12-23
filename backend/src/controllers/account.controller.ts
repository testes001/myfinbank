/**
 * Account Controller
 * HTTP request handlers for account endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { accountService } from '@/services/account.service';
import { asyncHandler, errors } from '@/middleware/errorHandler';
import { AccountType } from '@prisma/client';

// Validation schemas
const createAccountSchema = z.object({
  accountType: z.enum(['CHECKING', 'SAVINGS', 'INVESTMENT']),
  currency: z.string().length(3).optional().default('USD'),
  initialDeposit: z.number().min(0).optional().default(0),
});

export class AccountController {
  /**
   * GET /api/accounts
   * Get user's accounts
   */
  getAccounts = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw errors.unauthorized();
    }

    const accounts = await accountService.getUserAccounts(req.user.userId);

    // Mask account numbers for response
    const maskedAccounts = accounts.map((account) => ({
      ...account,
      accountNumber: accountService.maskAccountNumber(account.accountNumber),
      balance: Number(account.balance).toFixed(2),
      availableBalance: Number(account.availableBalance).toFixed(2),
    }));

    res.status(200).json({
      success: true,
      data: maskedAccounts,
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
      },
    });
  });

  /**
   * GET /api/accounts/:id
   * Get account by ID
   */
  getAccountById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw errors.unauthorized();
    }

    const { id } = req.params;
    const account = await accountService.getAccountById(id, req.user.userId);

    res.status(200).json({
      success: true,
      data: {
        ...account,
        balance: Number(account.balance).toFixed(2),
        availableBalance: Number(account.availableBalance).toFixed(2),
      },
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
      },
    });
  });

  /**
   * POST /api/accounts
   * Create new account
   */
  createAccount = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw errors.unauthorized();
    }

    // Validate input
    const validationResult = createAccountSchema.safeParse(req.body);
    if (!validationResult.success) {
      throw errors.validation('Invalid input', validationResult.error.format());
    }

    const { accountType, currency, initialDeposit } = validationResult.data;

    // Create account
    const account = await accountService.createAccount({
      userId: req.user.userId,
      accountType: accountType as AccountType,
      currency,
      initialDeposit,
    });

    res.status(201).json({
      success: true,
      data: {
        ...account,
        accountNumber: accountService.maskAccountNumber(account.accountNumber),
        balance: Number(account.balance).toFixed(2),
        availableBalance: Number(account.availableBalance).toFixed(2),
      },
      message: 'Account created successfully',
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
      },
    });
  });

  /**
   * GET /api/accounts/:id/balance
   * Get account balance
   */
  getBalance = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw errors.unauthorized();
    }

    const { id } = req.params;
    const balance = await accountService.getAccountBalance(id, req.user.userId);

    res.status(200).json({
      success: true,
      data: {
        balance: balance.balance.toFixed(2),
        availableBalance: balance.availableBalance.toFixed(2),
      },
      meta: {
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
      },
    });
  });
}

export const accountController = new AccountController();
