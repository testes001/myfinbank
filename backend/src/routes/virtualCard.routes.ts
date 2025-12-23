/**
 * Virtual Card Routes
 */

import { Router } from 'express';
import { virtualCardController } from '@/controllers/virtualCard.controller';
import { authenticate } from '@/middleware/auth';

const router = Router();

// All virtual card routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/cards
 * @desc    Create a new virtual card
 * @access  Private
 */
router.post('/', virtualCardController.createCard);

/**
 * @route   GET /api/cards
 * @desc    List all virtual cards
 * @access  Private
 */
router.get('/', virtualCardController.listCards);

/**
 * @route   GET /api/cards/:id
 * @desc    Get virtual card details
 * @access  Private
 */
router.get('/:id', virtualCardController.getCard);

/**
 * @route   GET /api/cards/:id/details
 * @desc    Get full card details (card number, CVV)
 * @access  Private
 */
router.get('/:id/details', virtualCardController.getFullCardDetails);

/**
 * @route   POST /api/cards/:id/freeze
 * @desc    Freeze a virtual card
 * @access  Private
 */
router.post('/:id/freeze', virtualCardController.freezeCard);

/**
 * @route   POST /api/cards/:id/unfreeze
 * @desc    Unfreeze a virtual card
 * @access  Private
 */
router.post('/:id/unfreeze', virtualCardController.unfreezeCard);

/**
 * @route   DELETE /api/cards/:id
 * @desc    Cancel a virtual card
 * @access  Private
 */
router.delete('/:id', virtualCardController.cancelCard);

/**
 * @route   PATCH /api/cards/:id/limit
 * @desc    Update card spending limit
 * @access  Private
 */
router.patch('/:id/limit', virtualCardController.updateSpendingLimit);

export default router;
