/**
 * Savings Goal Service
 * Handles savings goal creation, contributions, and management
 */

import { PrismaClient, SavingsGoal, SavingsGoalStatus } from '@prisma/client';
import { log } from '@/utils/logger';
import { errors } from '@/middleware/errorHandler';

const prisma = new PrismaClient();

// =============================================================================
// Types
// =============================================================================

export interface CreateSavingsGoalInput {
  userId: string;
  accountId: string;
  name: string;
  targetAmount: number;
  deadline?: Date;
  category?: string;
}

export interface UpdateSavingsGoalInput {
  userId: string;
  goalId: string;
  name?: string;
  targetAmount?: number;
  deadline?: Date;
  category?: string;
}

export interface ContributeToGoalInput {
  userId: string;
  goalId: string;
  amount: number;
}

export interface WithdrawFromGoalInput {
  userId: string;
  goalId: string;
  amount: number;
}

// =============================================================================
// Savings Goal Service
// =============================================================================

export class SavingsGoalService {
  /**
   * Create a new savings goal
   */
  async createSavingsGoal(input: CreateSavingsGoalInput): Promise<SavingsGoal> {
    const { userId, accountId, name, targetAmount, deadline, category } = input;

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw errors.notFound('User');
    }

    // Validate target amount
    if (targetAmount <= 0) {
      throw errors.validation('Target amount must be positive');
    }

    if (targetAmount > 1000000) {
      throw errors.validation('Maximum target amount is $1,000,000');
    }

    // Validate deadline (must be in the future)
    if (deadline && deadline <= new Date()) {
      throw errors.validation('Deadline must be in the future');
    }

    // Verify account exists and belongs to user
    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw errors.notFound('Account');
    }

    if (account.userId !== userId) {
      throw errors.forbidden('You do not have access to this account');
    }

    // Check if user has reached goal limit (e.g., max 20 goals per user)
    const existingGoals = await prisma.savingsGoal.count({
      where: {
        userId,
        status: {
          not: SavingsGoalStatus.CANCELLED,
        },
      },
    });

    if (existingGoals >= 20) {
      throw errors.validation('Maximum goal limit reached (20 goals per user)');
    }

    // Create savings goal
    const savingsGoal = await prisma.savingsGoal.create({
      data: {
        userId,
        accountId,
        name,
        targetAmount,
        currentAmount: 0,
        deadline,
        category: category || 'General',
        status: SavingsGoalStatus.ACTIVE,
      } as any,
    });

    // Create audit log
    await this.createAuditLog(userId, 'CREATE_SAVINGS_GOAL', savingsGoal.id, {
      name,
      targetAmount,
      deadline,
    });

    log.info('Savings goal created', {
      userId,
      goalId: savingsGoal.id,
      name,
      targetAmount,
    });

    return savingsGoal;
  }

  /**
   * List all savings goals for a user
   */
  async listSavingsGoals(userId: string): Promise<any[]> {
    const goals = await prisma.savingsGoal.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate progress for each goal
    return goals.map((goal: any) => ({
      id: goal.id,
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      progress: goal.targetAmount > 0
        ? Math.round((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100)
        : 0,
      deadline: goal.deadline,
      category: goal.category,
      status: goal.status,
      daysRemaining: goal.deadline
        ? Math.ceil((goal.deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : null,
      createdAt: goal.createdAt,
    }));
  }

  /**
   * Get savings goal by ID
   */
  async getSavingsGoalById(userId: string, goalId: string): Promise<any> {
    const goal = await (prisma as any).savingsGoal.findUnique({
      where: { id: goalId },
    });

    if (!goal) {
      throw errors.notFound('Savings goal');
    }

    // Verify ownership
    if (goal.userId !== userId) {
      throw errors.forbidden('You do not have access to this goal');
    }

    const progress = Number(goal.targetAmount) > 0
      ? Math.round((Number(goal.currentAmount) / Number(goal.targetAmount)) * 100)
      : 0;

    const daysRemaining = goal.deadline
      ? Math.ceil((goal.deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : null;

    return {
      id: goal.id,
      name: goal.name,
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      progress,
      deadline: goal.deadline,
      daysRemaining,
      category: goal.category,
      status: goal.status,
      createdAt: goal.createdAt,
      updatedAt: goal.updatedAt,
    };
  }

  /**
   * Contribute to a savings goal
   * Transfers money from account balance to goal
   */
  async contributeToGoal(input: ContributeToGoalInput): Promise<SavingsGoal> {
    const { userId, goalId, amount } = input;

    if (amount <= 0) {
      throw errors.validation('Contribution amount must be positive');
    }

    const goal = await prisma.savingsGoal.findUnique({
      where: { id: goalId },
    });

    if (!goal) {
      throw errors.notFound('Savings goal');
    }

    // Verify ownership of goal
    if (goal.userId !== userId) {
      throw errors.forbidden('You do not have access to this goal');
    }

    // Verify account exists and belongs to user
    const account = await prisma.account.findUnique({
      where: { id: (goal as any).accountId },
    });

    if (!account) {
      throw errors.notFound('Account');
    }

    if (account.userId !== userId) {
      throw errors.forbidden('You do not have access to this account');
    }

    // Check goal status
    if (goal.status === SavingsGoalStatus.CANCELLED) {
      throw errors.validation('Cannot contribute to a cancelled goal');
    }

    if (goal.status === SavingsGoalStatus.PAUSED) {
      throw errors.validation('Cannot contribute to a paused goal');
    }

    if (goal.status === SavingsGoalStatus.COMPLETED) {
      throw errors.validation('Goal is already completed');
    }

    // Check if account has sufficient balance
    if (Number(account.balance) < amount) {
      throw errors.validation('Insufficient account balance');
    }

    // Perform contribution in transaction
    const updatedGoal = await prisma.$transaction(async (tx: any) => {
      // Deduct from account balance
      await tx.account.update({
        where: { id: (goal as any).accountId },
        data: {
          balance: {
            decrement: amount,
          },
        },
      });

      // Add to goal current amount
      const updated = await tx.savingsGoal.update({
        where: { id: goalId },
        data: {
          currentAmount: {
            increment: amount,
          },
        },
      });

      // Check if goal is now completed
      if (Number(updated.currentAmount) >= Number(updated.targetAmount)) {
        return await tx.savingsGoal.update({
          where: { id: goalId },
          data: {
            status: SavingsGoalStatus.COMPLETED,
          },
        });
      }

      return updated;
    });

    // Create audit log
    await this.createAuditLog(userId, 'CONTRIBUTE_TO_GOAL', goalId, {
      amount,
      newCurrentAmount: updatedGoal.currentAmount,
    });

    log.info('Contribution made to savings goal', {
      userId,
      goalId,
      amount,
      currentAmount: updatedGoal.currentAmount,
    });

    return updatedGoal;
  }

  /**
   * Withdraw from a savings goal
   * Transfers money from goal back to account balance
   */
  async withdrawFromGoal(input: WithdrawFromGoalInput): Promise<SavingsGoal> {
    const { userId, goalId, amount } = input;

    if (amount <= 0) {
      throw errors.validation('Withdrawal amount must be positive');
    }

    const goal = await (prisma as any).savingsGoal.findUnique({
      where: { id: goalId },
      include: {
        account: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    if (!goal) {
      throw errors.notFound('Savings goal');
    }

    // Verify ownership
    if (goal.account.userId !== userId) {
      throw errors.forbidden('You do not have access to this goal');
    }

    // Check goal status
    if (goal.status === SavingsGoalStatus.CANCELLED) {
      throw errors.validation('Cannot withdraw from a cancelled goal');
    }

    // Check if goal has sufficient balance
    if (Number(goal.currentAmount) < amount) {
      throw errors.validation('Insufficient goal balance');
    }

    // Perform withdrawal in transaction
    const updatedGoal = await prisma.$transaction(async (tx: any) => {
      // Add to account balance
      await tx.account.update({
        where: { id: (goal as any).accountId },
        data: {
          balance: {
            increment: amount,
          },
        },
      });

      // Deduct from goal current amount
      const updated = await tx.savingsGoal.update({
        where: { id: goalId },
        data: {
          currentAmount: {
            decrement: amount,
          },
        },
      });

      // If goal was completed but now is not, change status back to ACTIVE
      if (
        goal.status === SavingsGoalStatus.COMPLETED &&
        Number(updated.currentAmount) < Number(updated.targetAmount)
      ) {
        return await tx.savingsGoal.update({
          where: { id: goalId },
          data: {
            status: SavingsGoalStatus.ACTIVE,
          },
        });
      }

      return updated;
    });

    // Create audit log
    await this.createAuditLog(userId, 'WITHDRAW_FROM_GOAL', goalId, {
      amount,
      newCurrentAmount: updatedGoal.currentAmount,
    });

    log.info('Withdrawal made from savings goal', {
      userId,
      goalId,
      amount,
      currentAmount: updatedGoal.currentAmount,
    });

    return updatedGoal;
  }

  /**
   * Update a savings goal
   */
  async updateSavingsGoal(input: UpdateSavingsGoalInput): Promise<SavingsGoal> {
    const { userId, goalId, name, targetAmount, deadline, category } = input;

    const goal = await (prisma as any).savingsGoal.findUnique({
      where: { id: goalId },
      include: {
        account: {
          select: { userId: true },
        },
      },
    });

    if (!goal) {
      throw errors.notFound('Savings goal');
    }

    // Verify ownership
    if (goal.account.userId !== userId) {
      throw errors.forbidden('You do not have access to this goal');
    }

    if (goal.status === SavingsGoalStatus.CANCELLED) {
      throw errors.validation('Cannot update a cancelled goal');
    }

    // Validate target amount if provided
    if (targetAmount !== undefined) {
      if (targetAmount <= 0) {
        throw errors.validation('Target amount must be positive');
      }

      if (targetAmount > 1000000) {
        throw errors.validation('Maximum target amount is $1,000,000');
      }

      // Don't allow reducing target below current amount
      if (targetAmount < goal.currentAmount) {
        throw errors.validation('Cannot set target amount below current saved amount');
      }
    }

    // Validate deadline if provided
    if (deadline && deadline <= new Date()) {
      throw errors.validation('Deadline must be in the future');
    }

    // Build update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (targetAmount !== undefined) updateData.targetAmount = targetAmount;
    if (deadline !== undefined) updateData.deadline = deadline;
    if (category !== undefined) updateData.category = category;

    // Update goal
    const updatedGoal = await prisma.savingsGoal.update({
      where: { id: goalId },
      data: updateData,
    });

    // Create audit log
    await this.createAuditLog(userId, 'UPDATE_SAVINGS_GOAL', goalId, {
      changes: updateData,
    });

    log.info('Savings goal updated', {
      userId,
      goalId,
      changes: updateData,
    });

    return updatedGoal;
  }

  /**
   * Pause a savings goal
   */
  async pauseGoal(userId: string, goalId: string): Promise<SavingsGoal> {
    const goal = await (prisma as any).savingsGoal.findUnique({
      where: { id: goalId },
      include: {
        account: {
          select: { userId: true },
        },
      },
    });

    if (!goal) {
      throw errors.notFound('Savings goal');
    }

    if (goal.account.userId !== userId) {
      throw errors.forbidden('You do not have access to this goal');
    }

    if (goal.status === SavingsGoalStatus.CANCELLED) {
      throw errors.validation('Cannot pause a cancelled goal');
    }

    if (goal.status === SavingsGoalStatus.COMPLETED) {
      throw errors.validation('Cannot pause a completed goal');
    }

    if (goal.status === SavingsGoalStatus.PAUSED) {
      throw errors.validation('Goal is already paused');
    }

    const updatedGoal = await prisma.savingsGoal.update({
      where: { id: goalId },
      data: {
        status: SavingsGoalStatus.PAUSED,
      },
    });

    await this.createAuditLog(userId, 'PAUSE_GOAL', goalId, {});

    log.info('Savings goal paused', { userId, goalId });

    return updatedGoal;
  }

  /**
   * Resume a paused savings goal
   */
  async resumeGoal(userId: string, goalId: string): Promise<SavingsGoal> {
    const goal = await (prisma as any).savingsGoal.findUnique({
      where: { id: goalId },
      include: {
        account: {
          select: { userId: true },
        },
      },
    });

    if (!goal) {
      throw errors.notFound('Savings goal');
    }

    if (goal.account.userId !== userId) {
      throw errors.forbidden('You do not have access to this goal');
    }

    if (goal.status !== SavingsGoalStatus.PAUSED) {
      throw errors.validation('Goal is not paused');
    }

    const updatedGoal = await prisma.savingsGoal.update({
      where: { id: goalId },
      data: {
        status: SavingsGoalStatus.ACTIVE,
      },
    });

    await this.createAuditLog(userId, 'RESUME_GOAL', goalId, {});

    log.info('Savings goal resumed', { userId, goalId });

    return updatedGoal;
  }

  /**
   * Cancel a savings goal
   * Returns all funds to the account
   */
  async cancelGoal(userId: string, goalId: string): Promise<SavingsGoal> {
    const goal = await (prisma as any).savingsGoal.findUnique({
      where: { id: goalId },
      include: {
        account: {
          select: {
            id: true,
            userId: true,
          },
        },
      },
    });

    if (!goal) {
      throw errors.notFound('Savings goal');
    }

    if (goal.account.userId !== userId) {
      throw errors.forbidden('You do not have access to this goal');
    }

    if (goal.status === SavingsGoalStatus.CANCELLED) {
      throw errors.validation('Goal is already cancelled');
    }

    // Cancel goal and return funds in transaction
    const updatedGoal = await prisma.$transaction(async (tx: any) => {
      // If there's money in the goal, return it to the account
      if (Number(goal.currentAmount) > 0) {
        await tx.account.update({
          where: { id: (goal as any).accountId },
          data: {
            balance: {
              increment: Number(goal.currentAmount),
            },
          },
        });
      }

      // Cancel the goal
      return await tx.savingsGoal.update({
        where: { id: goalId },
        data: {
          status: SavingsGoalStatus.CANCELLED,
        },
      });
    });

    await this.createAuditLog(userId, 'CANCEL_GOAL', goalId, {
      fundsReturned: goal.currentAmount,
    });

    log.info('Savings goal cancelled', {
      userId,
      goalId,
      fundsReturned: goal.currentAmount,
    });

    return updatedGoal;
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
          resource: 'savings_goal',
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

export const savingsGoalService = new SavingsGoalService();
