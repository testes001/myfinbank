/**
 * Transaction Routes
 */

import { Router } from 'express';
import { transactionController } from '@/controllers/transaction.controller';
import { authenticate } from '@/middleware/auth';

const router = Router();

// All transaction routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/transactions/transfer
 * @desc    Perform internal transfer between user's own accounts
 * @access  Private
 */
router.post('/transfer', transactionController.internalTransfer);

/**
 * @route   POST /api/transactions/p2p
 * @desc    Perform P2P transfer to another user
 * @access  Private
 */
router.post('/p2p', transactionController.p2pTransfer);

/**
 * @route   GET /api/transactions
 * @desc    Get transaction history with filters and pagination
 * @access  Private
 */
router.get('/', transactionController.getTransactions);

/**
 * @route   GET /api/transactions/balance-history/:accountId
 * @desc    Get account balance history
 * @access  Private
 */
router.get('/balance-history/:accountId', transactionController.getBalanceHistory);

/**
 * @route   GET /api/transactions/:id
 * @desc    Get specific transaction details
 * @access  Private
 */
router.get('/:id', transactionController.getTransactionById);

export default router;
