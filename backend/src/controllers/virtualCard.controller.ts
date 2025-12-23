/**
 * Virtual Card Controller
 * HTTP request handlers for virtual card endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { virtualCardService } from '@/services/virtualCard.service';
import { asyncHandler, errors } from '@/middleware/errorHandler';
import { CardType } from '@prisma/client';

// =============================================================================
// Validation Schemas
// =============================================================================

const createVirtualCardSchema = z.object({
  linkedAccountId: z.string().uuid('Invalid account ID'),
  cardName: z.string().min(1).max(50, 'Card name must be 50 characters or less'),
  cardType: z.nativeEnum(CardType),
  spendingLimit: z.number().positive().max(10000).optional(),
});

const updateSpendingLimitSchema = z.object({
  spendingLimit: z.number().positive().max(10000, 'Maximum spending limit is $10,000'),
});

// =============================================================================
// Virtual Card Controller
// =============================================================================

export class VirtualCardController {
  /**
   * POST /api/cards
   * Create a new virtual card
   */
  createCard = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw errors.unauthorized();
      }

      const validationResult = createVirtualCardSchema.safeParse(req.body);

      if (!validationResult.success) {
        throw errors.validation('Invalid request body', validationResult.error.errors);
      }

      const cardPayload = validationResult.data as any;

      const virtualCard = await virtualCardService.createVirtualCard({
        userId: req.user.userId,
        ...cardPayload,
      });

      res.status(201).json({
        success: true,
        message: 'Virtual card created successfully',
        data: {
          id: virtualCard.id,
          cardName: virtualCard.cardName,
          cardType: virtualCard.cardType,
          status: virtualCard.status,
          spendingLimit: virtualCard.spendingLimit,
          expiryDate: virtualCard.expiryDate,
          createdAt: virtualCard.createdAt,
        },
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );

  /**
   * GET /api/cards
   * List all virtual cards
   */
  listCards = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw errors.unauthorized();
      }

      const cards = await virtualCardService.listVirtualCards(req.user.userId);

      res.status(200).json({
        success: true,
        data: {
          cards,
          count: cards.length,
        },
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );

  /**
   * GET /api/cards/:id
   * Get virtual card details
   */
  getCard = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw errors.unauthorized();
      }

      const { id } = req.params;

      if (!id) {
        throw errors.validation('Card ID is required');
      }

      const card = await virtualCardService.getCardById(req.user.userId, id);

      res.status(200).json({
        success: true,
        data: card,
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );

  /**
   * GET /api/cards/:id/details
   * Get full card details (including card number and CVV)
   */
  getFullCardDetails = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw errors.unauthorized();
      }

      const { id } = req.params;

      if (!id) {
        throw errors.validation('Card ID is required');
      }

      const cardDetails = await virtualCardService.getFullCardDetails(
        req.user.userId,
        id
      );

      res.status(200).json({
        success: true,
        data: cardDetails,
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );

  /**
   * POST /api/cards/:id/freeze
   * Freeze a virtual card
   */
  freezeCard = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw errors.unauthorized();
      }

      const { id } = req.params;

      if (!id) {
        throw errors.validation('Card ID is required');
      }

      const card = await virtualCardService.freezeCard(req.user.userId, id);

      res.status(200).json({
        success: true,
        message: 'Card frozen successfully',
        data: {
          id: card.id,
          status: card.status,
        },
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );

  /**
   * POST /api/cards/:id/unfreeze
   * Unfreeze a virtual card
   */
  unfreezeCard = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw errors.unauthorized();
      }

      const { id } = req.params;

      if (!id) {
        throw errors.validation('Card ID is required');
      }

      const card = await virtualCardService.unfreezeCard(req.user.userId, id);

      res.status(200).json({
        success: true,
        message: 'Card unfrozen successfully',
        data: {
          id: card.id,
          status: card.status,
        },
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );

  /**
   * DELETE /api/cards/:id
   * Cancel a virtual card
   */
  cancelCard = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw errors.unauthorized();
      }

      const { id } = req.params;

      if (!id) {
        throw errors.validation('Card ID is required');
      }

      const card = await virtualCardService.cancelCard(req.user.userId, id);

      res.status(200).json({
        success: true,
        message: 'Card cancelled successfully',
        data: {
          id: card.id,
          status: card.status,
        },
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );

  /**
   * PATCH /api/cards/:id/limit
   * Update card spending limit
   */
  updateSpendingLimit = asyncHandler(
    async (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        throw errors.unauthorized();
      }

      const { id } = req.params;

      if (!id) {
        throw errors.validation('Card ID is required');
      }

      const validationResult = updateSpendingLimitSchema.safeParse(req.body);

      if (!validationResult.success) {
        throw errors.validation('Invalid request body', validationResult.error.errors);
      }

      const card = await virtualCardService.updateSpendingLimit({
        userId: req.user.userId,
        cardId: id,
        spendingLimit: validationResult.data.spendingLimit,
      });

      res.status(200).json({
        success: true,
        message: 'Spending limit updated successfully',
        data: {
          id: card.id,
          spendingLimit: card.spendingLimit,
        },
        meta: {
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
        },
      });
    }
  );
}

export const virtualCardController = new VirtualCardController();
