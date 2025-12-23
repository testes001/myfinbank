/**
 * Savings Goal Routes
 */

import { Router } from 'express';
import { savingsGoalController } from '@/controllers/savingsGoal.controller';
import { authenticate } from '@/middleware/auth';

const router = Router();

// All savings goal routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/savings-goals
 * @desc    Create a new savings goal
 * @access  Private
 */
router.post('/', savingsGoalController.createGoal);

/**
 * @route   GET /api/savings-goals
 * @desc    List all savings goals
 * @access  Private
 */
router.get('/', savingsGoalController.listGoals);

/**
 * @route   GET /api/savings-goals/:id
 * @desc    Get savings goal details
 * @access  Private
 */
router.get('/:id', savingsGoalController.getGoal);

/**
 * @route   PATCH /api/savings-goals/:id
 * @desc    Update a savings goal
 * @access  Private
 */
router.patch('/:id', savingsGoalController.updateGoal);

/**
 * @route   POST /api/savings-goals/:id/contribute
 * @desc    Contribute to a savings goal
 * @access  Private
 */
router.post('/:id/contribute', savingsGoalController.contribute);

/**
 * @route   POST /api/savings-goals/:id/withdraw
 * @desc    Withdraw from a savings goal
 * @access  Private
 */
router.post('/:id/withdraw', savingsGoalController.withdraw);

/**
 * @route   POST /api/savings-goals/:id/pause
 * @desc    Pause a savings goal
 * @access  Private
 */
router.post('/:id/pause', savingsGoalController.pauseGoal);

/**
 * @route   POST /api/savings-goals/:id/resume
 * @desc    Resume a paused savings goal
 * @access  Private
 */
router.post('/:id/resume', savingsGoalController.resumeGoal);

/**
 * @route   DELETE /api/savings-goals/:id
 * @desc    Cancel a savings goal
 * @access  Private
 */
router.delete('/:id', savingsGoalController.cancelGoal);

export default router;
