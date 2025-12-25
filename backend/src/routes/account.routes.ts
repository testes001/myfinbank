/**
 * Account Routes
 */

import { Router } from 'express';
import { accountController } from '@/controllers/account.controller';
import { authenticate } from '@/middleware/auth';
import { accountLookupController } from '@/controllers/accountLookup.controller';

const router = Router();

// All account routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/accounts
 * @desc    Get user's accounts
 * @access  Private
 */
router.get('/', accountController.getAccounts);

/**
 * @route   POST /api/accounts
 * @desc    Create new account
 * @access  Private
 */
router.post('/', accountController.createAccount);

/**
 * @route   GET /api/accounts/:id
 * @desc    Get account by ID
 * @access  Private
 */
router.get('/:id', accountController.getAccountById);

/**
 * @route   GET /api/accounts/:id/balance
 * @desc    Get account balance
 * @access  Private
 */
router.get('/:id/balance', accountController.getBalance);

/**
 * @route POST /api/accounts/lookup
 * @desc Lookup internal account by accountNumber
 * @access Private
 */
router.post('/lookup', accountLookupController.lookupByNumber);

export default router;
