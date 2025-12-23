/**
 * Savings Goal Controller
 * HTTP request handlers for savings goal endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { savingsGoalService } from '@/services/savingsGoal.service';
import { asyncHandler, errors } from '@/middleware/errorHandler';

// =============================================================================
// Validation Schemas
// =============================================================================

const createSavingsGoalSchema = z.object({
  accountId: z.string().uuid('Invalid account ID'),
  name: z.string().min(1).max(100, 'Goal name must be 100 characters or less'),
  targetAmount: z.number().positive().max(1000000),
  deadline: z.string().datetime().optional(),
  category: z.string().max(50).optional(),
});

const updateSavingsGoalSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  targetAmount: z.number().positive().max(1000000).optional(),
  deadline: z.string().datetime().optional(),
  category: z.string().max(50).optional(),
});

const contributeSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
});

const withdrawSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
});

// =============================================================================
// Savings Goal Controller
// =============================================================================

export class SavingsGoalController {
  /**
   * POST /api/savings-goals
   * Create a new savings goal
   */
  createGoal = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw errors.unauthorized();
      }

      const validationResult = createSavingsGoalSchema.safeParse(req.body);

      if (!validationResult.success) {
        throw errors.validation('Invalid request body', validationResult.error.errors);
      }

      const { deadline, ...rest } = validationResult.data;

      const savingsGoal = await savingsGoalService.createSavingsGoal({
        userId: req.user.userId,
        deadline: deadline ? new Date(deadline) : undefined,
        ...rest,
      });

      res.status(201).json({
        success: true,
        message: 'Savings goal created successfully',
        data: {
          id: savingsGoal.id,
          name: savingsGoal.name,
          targetAmount: savingsGoal.targetAmount,
          currentAmount: savingsGoal.currentAmount,
          deadline: savingsGoal.deadline,
          category: savingsGoal.category,
          status: savingsGoal.status,
          createdAt: savingsGoal.createdAt,
        },
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );

  /**
   * GET /api/savings-goals
   * List all savings goals
   */
  listGoals = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw errors.unauthorized();
      }

      const goals = await savingsGoalService.listSavingsGoals(req.user.userId);

      res.status(200).json({
        success: true,
        data: {
          goals,
          count: goals.length,
        },
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );

  /**
   * GET /api/savings-goals/:id
   * Get savings goal details
   */
  getGoal = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw errors.unauthorized();
      }

      const { id } = req.params;

      if (!id) {
        throw errors.validation('Goal ID is required');
      }

      const goal = await savingsGoalService.getSavingsGoalById(req.user.userId, id);

      res.status(200).json({
        success: true,
        data: goal,
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );

  /**
   * POST /api/savings-goals/:id/contribute
   * Contribute to a savings goal
   */
  contribute = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw errors.unauthorized();
      }

      const { id } = req.params;

      if (!id) {
        throw errors.validation('Goal ID is required');
      }

      const validationResult = contributeSchema.safeParse(req.body);

      if (!validationResult.success) {
        throw errors.validation('Invalid request body', validationResult.error.errors);
      }

      const goal = await savingsGoalService.contributeToGoal({
        userId: req.user.userId,
        goalId: id,
        amount: validationResult.data.amount,
      });

      res.status(200).json({
        success: true,
        message: 'Contribution successful',
        data: {
          id: goal.id,
          currentAmount: Number(goal.currentAmount),
          targetAmount: Number(goal.targetAmount),
          status: goal.status,
          progress: Number(goal.targetAmount) > 0
            ? Math.round((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100)
            : 0,
        },
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );

  /**
   * POST /api/savings-goals/:id/withdraw
   * Withdraw from a savings goal
   */
  withdraw = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw errors.unauthorized();
      }

      const { id } = req.params;

      if (!id) {
        throw errors.validation('Goal ID is required');
      }

      const validationResult = withdrawSchema.safeParse(req.body);

      if (!validationResult.success) {
        throw errors.validation('Invalid request body', validationResult.error.errors);
      }

      const goal = await savingsGoalService.withdrawFromGoal({
        userId: req.user.userId,
        goalId: id,
        amount: validationResult.data.amount,
      });

      res.status(200).json({
        success: true,
        message: 'Withdrawal successful',
        data: {
          id: goal.id,
          currentAmount: Number(goal.currentAmount),
          targetAmount: Number(goal.targetAmount),
          status: goal.status,
          progress: Number(goal.targetAmount) > 0
            ? Math.round((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100)
            : 0,
        },
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );

  /**
   * PATCH /api/savings-goals/:id
   * Update a savings goal
   */
  updateGoal = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw errors.unauthorized();
      }

      const { id } = req.params;

      if (!id) {
        throw errors.validation('Goal ID is required');
      }

      const validationResult = updateSavingsGoalSchema.safeParse(req.body);

      if (!validationResult.success) {
        throw errors.validation('Invalid request body', validationResult.error.errors);
      }

      const { deadline, ...rest } = validationResult.data;

      const goal = await savingsGoalService.updateSavingsGoal({
        userId: req.user.userId,
        goalId: id,
        deadline: deadline ? new Date(deadline) : undefined,
        ...rest,
      });

      res.status(200).json({
        success: true,
        message: 'Savings goal updated successfully',
        data: {
          id: goal.id,
          name: goal.name,
          targetAmount: goal.targetAmount,
          currentAmount: goal.currentAmount,
          deadline: goal.deadline,
          category: goal.category,
          status: goal.status,
        },
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );

  /**
   * POST /api/savings-goals/:id/pause
   * Pause a savings goal
   */
  pauseGoal = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw errors.unauthorized();
      }

      const { id } = req.params;

      if (!id) {
        throw errors.validation('Goal ID is required');
      }

      const goal = await savingsGoalService.pauseGoal(req.user.userId, id);

      res.status(200).json({
        success: true,
        message: 'Goal paused successfully',
        data: {
          id: goal.id,
          status: goal.status,
        },
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );

  /**
   * POST /api/savings-goals/:id/resume
   * Resume a paused savings goal
   */
  resumeGoal = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw errors.unauthorized();
      }

      const { id } = req.params;

      if (!id) {
        throw errors.validation('Goal ID is required');
      }

      const goal = await savingsGoalService.resumeGoal(req.user.userId, id);

      res.status(200).json({
        success: true,
        message: 'Goal resumed successfully',
        data: {
          id: goal.id,
          status: goal.status,
        },
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );

  /**
   * DELETE /api/savings-goals/:id
   * Cancel a savings goal
   */
  cancelGoal = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw errors.unauthorized();
      }

      const { id } = req.params;

      if (!id) {
        throw errors.validation('Goal ID is required');
      }

      const goal = await savingsGoalService.cancelGoal(req.user.userId, id);

      res.status(200).json({
        success: true,
        message: 'Goal cancelled successfully. Funds have been returned to your account.',
        data: {
          id: goal.id,
          status: goal.status,
        },
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );
}

export const savingsGoalController = new SavingsGoalController();
