/**
 * User Routes
 */

import { Router } from 'express';
import { userController } from '@/controllers/user.controller';
import { authenticate } from '@/middleware/auth';

const router = Router();

// All user routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile with enhanced details
 * @access  Private
 */
router.get('/me', userController.getProfile);

/**
 * @route   PATCH /api/users/me
 * @desc    Update user profile (name, phone)
 * @access  Private
 */
router.patch('/me', userController.updateProfile);

/**
 * @route   DELETE /api/users/me
 * @desc    Delete user account (soft delete)
 * @access  Private
 */
router.delete('/me', userController.deleteAccount);

/**
 * @route   PATCH /api/users/me/password
 * @desc    Change user password
 * @access  Private
 */
router.patch('/me/password', userController.changePassword);

/**
 * @route   GET /api/users/me/settings
 * @desc    Get user settings (notifications, security, preferences)
 * @access  Private
 */
router.get('/me/settings', userController.getSettings);

/**
 * @route   PATCH /api/users/me/settings
 * @desc    Update user settings
 * @access  Private
 */
router.patch('/me/settings', userController.updateSettings);

/**
 * @route   GET /api/users/me/activity
 * @desc    Get user activity summary
 * @access  Private
 */
router.get('/me/activity', userController.getActivity);

export default router;
