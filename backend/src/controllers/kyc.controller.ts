/**
 * KYC Controller
 * HTTP request handlers for KYC endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { kycService } from '@/services/kyc.service';
import { asyncHandler, errors } from '@/middleware/errorHandler';

// =============================================================================
// Validation Schemas
// =============================================================================

const submitKYCSchema = z.object({
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  ssn: z.string().regex(/^\d{3}-?\d{2}-?\d{4}$/, 'Invalid SSN format'),
  address: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().length(2),
    zipCode: z.string().regex(/^\d{5}(-\d{4})?$/),
    country: z.string().length(2),
  }),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  idDocumentType: z.enum(['PASSPORT', 'DRIVERS_LICENSE', 'NATIONAL_ID']),
});

const uploadDocumentSchema = z.object({
  documentType: z.enum(['ID_FRONT', 'ID_BACK', 'PROOF_OF_ADDRESS']),
  fileUrl: z.string().url('Invalid file URL'),
});

// =============================================================================
// KYC Controller
// =============================================================================

export class KYCController {
  /**
   * POST /api/kyc/submit
   * Submit KYC verification
   */
  submitKYC = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw errors.unauthorized();
      }

      const validationResult = submitKYCSchema.safeParse(req.body);

      if (!validationResult.success) {
        throw errors.validation('Invalid request body', validationResult.error.errors);
      }

      const kycVerification = await kycService.submitKYC({
        userId: req.user.userId,
        ...validationResult.data,
      });

      res.status(201).json({
        success: true,
        message: 'KYC verification submitted successfully',
        data: {
          id: kycVerification.id,
          status: kycVerification.status,
          submittedAt: kycVerification.submittedAt,
        },
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );

  /**
   * POST /api/kyc/upload
   * Upload KYC document
   */
  uploadDocument = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw errors.unauthorized();
      }

      const validationResult = uploadDocumentSchema.safeParse(req.body);

      if (!validationResult.success) {
        throw errors.validation('Invalid request body', validationResult.error.errors);
      }

      const kycVerification = await kycService.uploadDocument({
        userId: req.user.userId,
        ...validationResult.data,
      });

      res.status(200).json({
        success: true,
        message: 'Document uploaded successfully',
        data: {
          id: kycVerification.id,
          status: kycVerification.status,
          documentsUploaded: {
            idFront: !!kycVerification.idDocumentFrontUrl,
            idBack: !!kycVerification.idDocumentBackUrl,
          },
        },
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );

  /**
   * GET /api/kyc/status
   * Get KYC verification status
   */
  getStatus = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw errors.unauthorized();
      }

      const status = await kycService.getKYCStatus(req.user.userId);

      res.status(200).json({
        success: true,
        data: status,
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );
}

export const kycController = new KYCController();
