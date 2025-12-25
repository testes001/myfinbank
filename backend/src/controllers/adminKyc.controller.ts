import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { asyncHandler, errors } from '@/middleware/errorHandler';
import { kycService } from '@/services/kyc.service';

const approveSchema = z.object({
  reviewerId: z.string().optional(),
});

const rejectSchema = z.object({
  reviewerId: z.string().optional(),
  reason: z.string().min(3, 'Rejection reason required'),
});

export class AdminKycController {
  listPending = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) {
      throw errors.unauthorized();
    }

    const pending = await kycService.listPending();

    res.status(200).json({
      success: true,
      data: pending,
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
    });
  });

  getById = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) {
      throw errors.unauthorized();
    }

    const kyc = await kycService.getById(req.params.id);

    res.status(200).json({
      success: true,
      data: kyc,
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
    });
  });

  approve = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) {
      throw errors.unauthorized();
    }

    const validation = approveSchema.safeParse(req.body);
    if (!validation.success) {
      throw errors.validation('Invalid request body', validation.error.errors);
    }

    const reviewer = validation.data.reviewerId || req.admin.adminId;
    const result = await kycService.approveKYC(req.params.id, reviewer);

    res.status(200).json({
      success: true,
      message: 'KYC approved',
      data: { id: result.id, status: result.status, reviewedAt: result.reviewedAt },
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
    });
  });

  reject = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) {
      throw errors.unauthorized();
    }

    const validation = rejectSchema.safeParse(req.body);
    if (!validation.success) {
      throw errors.validation('Invalid request body', validation.error.errors);
    }

    const reviewer = validation.data.reviewerId || req.admin.adminId;
    const result = await kycService.rejectKYC(req.params.id, reviewer, validation.data.reason);

    res.status(200).json({
      success: true,
      message: 'KYC rejected',
      data: { id: result.id, status: result.status, reviewedAt: result.reviewedAt },
      meta: { requestId: req.requestId, timestamp: new Date().toISOString() },
    });
  });
}

export const adminKycController = new AdminKycController();
