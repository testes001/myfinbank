/**
 * KYC Routes
 */

import { Router } from 'express';
import { kycController } from '@/controllers/kyc.controller';
import { authenticate } from '@/middleware/auth';

const router = Router();

// All KYC routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/kyc/submit
 * @desc    Submit KYC verification
 * @access  Private
 */
router.post('/submit', kycController.submitKYC);

/**
 * @route   POST /api/kyc/upload
 * @desc    Upload KYC document (ID, proof of address)
 * @access  Private
 */
router.post('/upload', kycController.uploadDocument);

/**
 * @route   GET /api/kyc/status
 * @desc    Get KYC verification status
 * @access  Private
 */
router.get('/status', kycController.getStatus);

export default router;
