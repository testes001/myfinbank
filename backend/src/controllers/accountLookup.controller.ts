import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { asyncHandler, errors } from '@/middleware/errorHandler';
import { prisma } from '@/config/database';

const lookupSchema = z.object({
  accountNumber: z.string().min(6).max(20),
});

class AccountLookupController {
  lookupByNumber = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const validation = lookupSchema.safeParse(req.body);
    if (!validation.success) {
      throw errors.validation('Invalid request body', validation.error.errors);
    }

    const { accountNumber } = validation.data;
    const account = await prisma.account.findFirst({
      where: { accountNumber },
      include: {
        user: {
          select: { id: true, email: true, fullName: true },
        },
      },
    });

    if (!account) {
      throw errors.notFound('Account');
    }

    res.status(200).json({
      success: true,
      data: {
        id: account.id,
        accountNumber: `****${account.accountNumber.slice(-4)}`,
        accountType: account.accountType,
        user: account.user,
      },
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
    });
  });
}

export const accountLookupController = new AccountLookupController();
