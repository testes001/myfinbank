/**
 * KYC Service
 * Handles KYC verification submissions and status checks
 */

import { PrismaClient, KYCStatus, UserStatus, KYCVerification } from '@prisma/client';
import { config } from '@/config';
import { log } from '@/utils/logger';
import { errors } from '@/middleware/errorHandler';
import { encrypt, decrypt } from '@/utils/encryption';

const prisma = new PrismaClient();

// =============================================================================
// Types
// =============================================================================

export interface SubmitKYCInput {
  userId: string;
  dateOfBirth: string; // YYYY-MM-DD
  ssn: string; // Will be encrypted
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  phoneNumber: string;
  idDocumentType: 'PASSPORT' | 'DRIVERS_LICENSE' | 'NATIONAL_ID';
}

export interface KYCDocumentUpload {
  userId: string;
  documentType: 'ID_FRONT' | 'ID_BACK' | 'PROOF_OF_ADDRESS';
  fileUrl: string;
}

// =============================================================================
// KYC Service
// =============================================================================

export class KYCService {
  /**
   * Submit KYC verification
   */
  async submitKYC(input: SubmitKYCInput): Promise<KYCVerification> {
    const { userId, dateOfBirth, ssn, address, phoneNumber, idDocumentType } = input;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        kycVerifications: {
          where: {
            status: { in: [KYCStatus.PENDING, KYCStatus.UNDER_REVIEW, KYCStatus.APPROVED] },
          },
        },
      },
    });

    if (!user) {
      throw errors.notFound('User');
    }

    // Check if there's already an active KYC submission
    if (user.kycVerifications.length > 0) {
      const existingKYC = user.kycVerifications[0];
      if (existingKYC.status === KYCStatus.APPROVED) {
        throw errors.validation('KYC verification is already approved');
      }
      if (existingKYC.status === KYCStatus.UNDER_REVIEW) {
        throw errors.validation('KYC verification is currently under review');
      }
      if (existingKYC.status === KYCStatus.PENDING) {
        throw errors.validation('KYC verification is already submitted and pending review');
      }
    }

    // Validate date of birth (must be 18+)
    const dob = new Date(dateOfBirth);
    const age = this.calculateAge(dob);
    if (age < 18) {
      throw errors.validation('Must be at least 18 years old');
    }

    // Validate SSN format (simple validation)
    if (!/^\d{3}-?\d{2}-?\d{4}$/.test(ssn)) {
      throw errors.validation('Invalid SSN format');
    }

    // Encrypt sensitive data
    const encryptedDOB = encrypt(dateOfBirth);
    const encryptedSSN = encrypt(ssn);
    const encryptedAddress = encrypt(JSON.stringify(address));

    // Create KYC verification record
    const kycVerification = await prisma.kYCVerification.create({
      data: {
        userId,
        dateOfBirth: encryptedDOB,
        ssn: encryptedSSN,
        address: encryptedAddress as any,
        phoneNumber,
        idDocumentType,
        status: KYCStatus.PENDING,
        submittedAt: new Date(),
      },
    });

    // Update user KYC status
    await prisma.user.update({
      where: { id: userId },
      data: {
        kycStatus: KYCStatus.PENDING,
      },
    });

    // Auto-approve if demo mode is enabled
    if (config.kycAutoApproveDemo) {
      await this.approveKYC(kycVerification.id, 'SYSTEM');
    }

    // Create audit log
    await this.createAuditLog(userId, 'SUBMIT_KYC', kycVerification.id, {
      idDocumentType,
    });

    log.info('KYC verification submitted', {
      userId,
      kycId: kycVerification.id,
      idDocumentType,
    });

    return kycVerification;
  }

  /**
   * Upload KYC document
   */
  async uploadDocument(input: KYCDocumentUpload): Promise<KYCVerification> {
    const { userId, documentType, fileUrl } = input;

    // Get user's latest KYC verification
    const kycVerification = await prisma.kYCVerification.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!kycVerification) {
      throw errors.notFound('KYC verification not found. Please submit KYC first.');
    }

    if (kycVerification.status === KYCStatus.APPROVED) {
      throw errors.validation('KYC is already approved');
    }

    // Update document URLs
    const updateData: any = {};
    if (documentType === 'ID_FRONT') {
      updateData.idDocumentFrontUrl = fileUrl;
    } else if (documentType === 'ID_BACK') {
      updateData.idDocumentBackUrl = fileUrl;
    }

    const updated = await prisma.kYCVerification.update({
      where: { id: kycVerification.id },
      data: updateData,
    });

    // Create audit log
    await this.createAuditLog(userId, 'UPLOAD_KYC_DOCUMENT', kycVerification.id, {
      documentType,
    });

    log.info('KYC document uploaded', {
      userId,
      kycId: kycVerification.id,
      documentType,
    });

    return updated;
  }

  /**
   * Get KYC status for user
   */
  async getKYCStatus(userId: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        kycStatus: true,
        status: true,
      },
    });

    if (!user) {
      throw errors.notFound('User');
    }

    // Get latest KYC verification
    const kycVerification = await prisma.kYCVerification.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    if (!kycVerification) {
      return {
        kycStatus: user.kycStatus,
        userStatus: user.status,
        verification: null,
        requirements: {
          personalInfo: false,
          idDocument: false,
        },
      };
    }

    return {
      kycStatus: user.kycStatus,
      userStatus: user.status,
      verification: {
        id: kycVerification.id,
        status: kycVerification.status,
        idDocumentType: kycVerification.idDocumentType,
        submittedAt: kycVerification.submittedAt,
        reviewedAt: kycVerification.reviewedAt,
        rejectionReason: kycVerification.rejectionReason,
      },
      requirements: {
        personalInfo: !!kycVerification.dateOfBirth,
        idDocumentFront: !!kycVerification.idDocumentFrontUrl,
        idDocumentBack: !!kycVerification.idDocumentBackUrl,
      },
    };
  }

  /**
   * Approve KYC (admin/system function)
   */
  async approveKYC(kycId: string, reviewerId: string): Promise<KYCVerification> {
    const kycVerification = await prisma.kYCVerification.findUnique({
      where: { id: kycId },
      include: { user: true },
    });

    if (!kycVerification) {
      throw errors.notFound('KYC verification');
    }

    if (kycVerification.status === KYCStatus.APPROVED) {
      throw errors.validation('KYC is already approved');
    }

    // Update KYC verification
    const updated = await prisma.kYCVerification.update({
      where: { id: kycId },
      data: {
        status: KYCStatus.APPROVED,
        reviewedAt: new Date(),
        reviewerId,
        verificationScore: 100,
      },
    });

    // Update user status
    await prisma.user.update({
      where: { id: kycVerification.userId },
      data: {
        kycStatus: KYCStatus.APPROVED,
        status: UserStatus.ACTIVE,
      },
    });

    // Create audit log
    await this.createAuditLog(kycVerification.userId, 'APPROVE_KYC', kycId, {
      reviewerId,
    });

    log.info('KYC verification approved', {
      userId: kycVerification.userId,
      kycId,
      reviewerId,
    });

    return updated;
  }

  /**
   * Reject KYC (admin function)
   */
  async rejectKYC(
    kycId: string,
    reviewerId: string,
    reason: string
  ): Promise<KYCVerification> {
    const kycVerification = await prisma.kYCVerification.findUnique({
      where: { id: kycId },
    });

    if (!kycVerification) {
      throw errors.notFound('KYC verification');
    }

    // Update KYC verification
    const updated = await prisma.kYCVerification.update({
      where: { id: kycId },
      data: {
        status: KYCStatus.REJECTED,
        reviewedAt: new Date(),
        reviewerId,
        rejectionReason: reason,
      },
    });

    // Update user status
    await prisma.user.update({
      where: { id: kycVerification.userId },
      data: {
        kycStatus: KYCStatus.REJECTED,
      },
    });

    // Create audit log
    await this.createAuditLog(kycVerification.userId, 'REJECT_KYC', kycId, {
      reviewerId,
      reason,
    });

    log.info('KYC verification rejected', {
      userId: kycVerification.userId,
      kycId,
      reviewerId,
      reason,
    });

    return updated;
  }

  /**
   * Calculate age from date of birth
   */
  private calculateAge(dateOfBirth: Date): number {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Create audit log entry
   */
  private async createAuditLog(
    userId: string,
    action: string,
    resourceId: string,
    metadata: any
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          actorId: userId,
          action,
          resource: 'kyc',
          resourceId,
          status: 'SUCCESS',
          metadata,
        } as any,
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }
}

export const kycService = new KYCService();
