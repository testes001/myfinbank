/**
 * Authentication Routes
 */

import { Router } from 'express';
import { authController } from '@/controllers/auth.controller';
import { authenticate } from '@/middleware/auth';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', authController.login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', authController.refreshToken);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, authController.logout);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authenticate, authController.me);

/**
 * @route   POST /api/auth/verification-code
 * @desc    Send verification code email
 * @access  Public
 */
router.post('/verification-code', authController.sendVerificationCode);

/**
 * @route   POST /api/auth/verify
 * @desc    Verify email with code
 * @access  Public
 */
router.post('/verify', authController.verify);

/**
 * @route   POST /api/auth/password/forgot
 * @desc    Request password reset code
 * @access  Public
 */
router.post('/password/forgot', authController.requestPasswordReset);

/**
 * @route   POST /api/auth/password/reset
 * @desc    Reset password with verification code
 * @access  Public
 */
router.post('/password/reset', authController.resetPassword);

export default router;
