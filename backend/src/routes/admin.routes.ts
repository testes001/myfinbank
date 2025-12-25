/**
 * Admin Routes
 * Routes for admin authentication and management
 */

import { Router } from 'express';
import { adminController } from '@/controllers/admin.controller';
import {
  authenticateAdmin,
  requireSuperAdmin,
  requireAnyAdmin,
} from '@/middleware/adminAuth';
import { adminKycController } from '@/controllers/adminKyc.controller';

const router = Router();

// =============================================================================
// Public Admin Routes (No Authentication Required)
// =============================================================================

/**
 * @route   POST /api/admin/login
 * @desc    Admin login
 * @access  Public
 */
router.post('/login', adminController.login);

/**
 * @route   POST /api/admin/refresh
 * @desc    Refresh admin access token
 * @access  Public (requires refresh token)
 */
router.post('/refresh', adminController.refreshToken);

// =============================================================================
// Protected Admin Routes (Authentication Required)
// =============================================================================

/**
 * @route   POST /api/admin/logout
 * @desc    Admin logout
 * @access  Private (Any Admin)
 */
router.post('/logout', authenticateAdmin, adminController.logout);

/**
 * @route   GET /api/admin/session
 * @desc    Get current admin session
 * @access  Private (Any Admin)
 */
router.get('/session', authenticateAdmin, adminController.getSession);

/**
 * @route   POST /api/admin/logout-all
 * @desc    Logout from all devices
 * @access  Private (Any Admin)
 */
router.post('/logout-all', authenticateAdmin, adminController.logoutAllSessions);

// =============================================================================
// SUPERADMIN Only Routes
// =============================================================================

/**
 * @route   POST /api/admin/create
 * @desc    Create new admin user
 * @access  Private (SUPERADMIN only)
 */
router.post('/create', authenticateAdmin, requireSuperAdmin, adminController.createAdmin);

/**
 * @route   GET /api/admin/list
 * @desc    List all admin users
 * @access  Private (SUPERADMIN only)
 */
router.get('/list', authenticateAdmin, requireSuperAdmin, adminController.listAdmins);

// =============================================================================
// KYC Review (Admin)
// =============================================================================
router.get('/kyc/pending', authenticateAdmin, requireAnyAdmin, adminKycController.listPending);
router.get('/kyc/:id', authenticateAdmin, requireAnyAdmin, adminKycController.getById);
router.post('/kyc/:id/approve', authenticateAdmin, requireAnyAdmin, adminKycController.approve);
router.post('/kyc/:id/reject', authenticateAdmin, requireAnyAdmin, adminKycController.reject);

export default router;
