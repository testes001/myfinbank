/**
 * Virtual Card Service
 * Handles virtual card creation, management, and operations
 */

import { PrismaClient } from '@prisma/client';
import { config } from '@/config';
import { log } from '@/utils/logger';
import { errors } from '@/middleware/errorHandler';
import { encrypt, decrypt } from '@/utils/encryption';

const prisma = new PrismaClient();
const CardStatus = {
  ACTIVE: 'ACTIVE',
  FROZEN: 'FROZEN',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const;
const CardType = {
  SINGLE_USE: 'SINGLE_USE',
  MERCHANT_LOCKED: 'MERCHANT_LOCKED',
  RECURRING: 'RECURRING',
  STANDARD: 'STANDARD',
} as const;

// =============================================================================
// Types
// =============================================================================

export interface CreateVirtualCardInput {
  userId: string;
  linkedAccountId: string;
  cardName: string;
  cardType: string;
  spendingLimit?: number;
}

export interface UpdateSpendingLimitInput {
  userId: string;
  cardId: string;
  spendingLimit: number;
}

// =============================================================================
// Virtual Card Service
// =============================================================================

export class VirtualCardService {
  /**
   * Create a new virtual card
   */
  async createVirtualCard(input: CreateVirtualCardInput): Promise<any> {
    const { userId, linkedAccountId, cardName, cardType, spendingLimit } = input;

    // Verify account exists and belongs to user
    const account = await prisma.account.findUnique({
      where: { id: linkedAccountId },
      include: { user: true },
    });

    if (!account) {
      throw errors.notFound('Account');
    }

    if (account.userId !== userId) {
      throw errors.forbidden('You do not have access to this account');
    }

    if (account.status !== 'ACTIVE') {
      throw errors.validation('Account must be active to create a card');
    }

    // Check if user has reached card limit (e.g., max 10 cards per user)
    const existingCards = await prisma.virtualCard.count({
      where: {
        userId,
        status: {
          not: CardStatus.CANCELLED,
        },
      },
    });

    if (existingCards >= 10) {
      throw errors.validation('Maximum card limit reached (10 cards per user)');
    }

    // Generate card number and CVV
    const cardNumber = this.generateCardNumber();
    const cvv = this.generateCVV();
    const expiryDate = this.generateExpiryDate();

    // Encrypt sensitive card data
    const encryptedCardNumber = encrypt(cardNumber);
    const encryptedCVV = encrypt(cvv);

    // Create virtual card
    const virtualCard = await prisma.virtualCard.create({
      data: {
        userId,
        linkedAccountId,
        cardName,
        cardNumber: encryptedCardNumber,
        cvv: encryptedCVV,
        expiryDate,
        cardType,
        status: CardStatus.ACTIVE,
        spendingLimit: spendingLimit || 1000.0, // Default $1000 limit
      },
    });

    // Create audit log
    await this.createAuditLog(userId, 'CREATE_VIRTUAL_CARD', virtualCard.id, {
      linkedAccountId,
      cardType,
      cardName,
    });

    log.info('Virtual card created', {
      userId,
      cardId: virtualCard.id,
      linkedAccountId,
      cardType,
    });

    return virtualCard;
  }

  /**
   * List all virtual cards for a user
   */
  async listVirtualCards(userId: string): Promise<any[]> {
    const cards = await prisma.virtualCard.findMany({
      where: {
        userId,
      },
      include: {
        linkedAccount: {
          select: {
            id: true,
            accountNumber: true,
            accountType: true,
            balance: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Return cards with masked card numbers (don't expose full number)
    return cards.map((card: any) => ({
      id: card.id,
      cardName: card.cardName,
      lastFourDigits: this.getLastFourDigits(card.cardNumber),
      cardType: card.cardType,
      status: card.status,
      spendingLimit: card.spendingLimit,
      expiryDate: card.expiryDate,
      createdAt: card.createdAt,
      account: card.linkedAccount,
    }));
  }

  /**
   * Get virtual card by ID
   */
  async getCardById(userId: string, cardId: string): Promise<any> {
    const card = await prisma.virtualCard.findUnique({
      where: { id: cardId },
      include: {
        linkedAccount: {
          select: {
            id: true,
            accountNumber: true,
            accountType: true,
            balance: true,
          },
        },
      },
    });

    if (!card) {
      throw errors.notFound('Virtual card');
    }

    // Verify ownership
    if (card.userId !== userId) {
      throw errors.forbidden('You do not have access to this card');
    }

    // Return card details with masked card number
    return {
      id: card.id,
      cardName: card.cardName,
      lastFourDigits: this.getLastFourDigits(card.cardNumber),
      cardType: card.cardType,
      status: card.status,
      spendingLimit: card.spendingLimit,
      expiryDate: card.expiryDate,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
      account: card.linkedAccount,
    };
  }

  /**
   * Get full card details (including card number and CVV)
   * Only for specific operations like viewing card details
   */
  async getFullCardDetails(userId: string, cardId: string): Promise<any> {
    const card = await prisma.virtualCard.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      throw errors.notFound('Virtual card');
    }

    // Verify ownership
    if (card.userId !== userId) {
      throw errors.forbidden('You do not have access to this card');
    }

    if (card.status === CardStatus.CANCELLED) {
      throw errors.validation('Cannot view details of a cancelled card');
    }

    // Decrypt card number and CVV
    const cardNumber = decrypt(card.cardNumber as string);
    const cvv = decrypt(card.cvv as string);

    // Create audit log for viewing sensitive card details
    await this.createAuditLog(userId, 'VIEW_CARD_DETAILS', cardId, {
      cardName: card.cardName,
    });

    log.info('Card details viewed', {
      userId,
      cardId,
    });

    return {
      id: card.id,
      cardName: card.cardName,
      cardNumber,
      cvv,
      expiryDate: card.expiryDate,
      cardType: card.cardType,
      status: card.status,
      spendingLimit: card.spendingLimit,
    };
  }

  /**
   * Freeze a virtual card
   */
  async freezeCard(userId: string, cardId: string): Promise<any> {
    const card = await prisma.virtualCard.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      throw errors.notFound('Virtual card');
    }

    if (card.userId !== userId) {
      throw errors.forbidden('You do not have access to this card');
    }

    if (card.status === CardStatus.CANCELLED) {
      throw errors.validation('Cannot freeze a cancelled card');
    }

    if (card.status === CardStatus.FROZEN) {
      throw errors.validation('Card is already frozen');
    }

    // Freeze card
    const updatedCard = await prisma.virtualCard.update({
      where: { id: cardId },
      data: {
        status: CardStatus.FROZEN,
      },
    });

    // Create audit log
    await this.createAuditLog(userId, 'FREEZE_CARD', cardId, {
      cardName: card.cardName,
    });

    log.info('Virtual card frozen', {
      userId,
      cardId,
    });

    return updatedCard;
  }

  /**
   * Unfreeze a virtual card
   */
  async unfreezeCard(userId: string, cardId: string): Promise<any> {
    const card = await prisma.virtualCard.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      throw errors.notFound('Virtual card');
    }

    if (card.userId !== userId) {
      throw errors.forbidden('You do not have access to this card');
    }

    if (card.status === CardStatus.CANCELLED) {
      throw errors.validation('Cannot unfreeze a cancelled card');
    }

    if (card.status === CardStatus.ACTIVE) {
      throw errors.validation('Card is already active');
    }

    // Unfreeze card
    const updatedCard = await prisma.virtualCard.update({
      where: { id: cardId },
      data: {
        status: CardStatus.ACTIVE,
      },
    });

    // Create audit log
    await this.createAuditLog(userId, 'UNFREEZE_CARD', cardId, {
      cardName: card.cardName,
    });

    log.info('Virtual card unfrozen', {
      userId,
      cardId,
    });

    return updatedCard;
  }

  /**
   * Cancel a virtual card (permanent action)
   */
  async cancelCard(userId: string, cardId: string): Promise<any> {
    const card = await prisma.virtualCard.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      throw errors.notFound('Virtual card');
    }

    if (card.userId !== userId) {
      throw errors.forbidden('You do not have access to this card');
    }

    if (card.status === CardStatus.CANCELLED) {
      throw errors.validation('Card is already cancelled');
    }

    // Cancel card
    const updatedCard = await prisma.virtualCard.update({
      where: { id: cardId },
      data: {
        status: CardStatus.CANCELLED,
      },
    });

    // Create audit log
    await this.createAuditLog(userId, 'CANCEL_CARD', cardId, {
      cardName: card.cardName,
    });

    log.info('Virtual card cancelled', {
      userId,
      cardId,
    });

    return updatedCard;
  }

  /**
   * Update card spending limit
   */
  async updateSpendingLimit(input: UpdateSpendingLimitInput): Promise<any> {
    const { userId, cardId, spendingLimit } = input;

    if (spendingLimit < 0) {
      throw errors.validation('Spending limit must be positive');
    }

    if (spendingLimit > 10000) {
      throw errors.validation('Maximum spending limit is $10,000');
    }

    const card = await prisma.virtualCard.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      throw errors.notFound('Virtual card');
    }

    if (card.userId !== userId) {
      throw errors.forbidden('You do not have access to this card');
    }

    if (card.status === CardStatus.CANCELLED) {
      throw errors.validation('Cannot update limit of a cancelled card');
    }

    // Update spending limit
    const updatedCard = await prisma.virtualCard.update({
      where: { id: cardId },
      data: {
        spendingLimit,
      },
    });

    // Create audit log
    await this.createAuditLog(userId, 'UPDATE_CARD_LIMIT', cardId, {
      oldLimit: card.spendingLimit,
      newLimit: spendingLimit,
    });

    log.info('Card spending limit updated', {
      userId,
      cardId,
      oldLimit: card.spendingLimit,
      newLimit: spendingLimit,
    });

    return updatedCard;
  }

  /**
   * Generate a 16-digit card number (Luhn algorithm compliant)
   */
  private generateCardNumber(): string {
    // Use a test BIN (Bank Identification Number) for virtual cards
    // Real implementation would use actual bank BIN
    const bin = '4532'; // Visa test BIN

    // Generate 11 random digits
    let digits = bin;
    for (let i = 0; i < 11; i++) {
      digits += Math.floor(Math.random() * 10);
    }

    // Calculate Luhn check digit
    const checkDigit = this.calculateLuhnCheckDigit(digits);
    const cardNumber = digits + checkDigit;

    // Format as XXXX-XXXX-XXXX-XXXX
    return cardNumber.match(/.{1,4}/g)?.join('-') || cardNumber;
  }

  /**
   * Calculate Luhn check digit
   */
  private calculateLuhnCheckDigit(digits: string): number {
    let sum = 0;
    let isEven = true;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return (10 - (sum % 10)) % 10;
  }

  /**
   * Generate a 3-digit CVV
   */
  private generateCVV(): string {
    const cvv = Math.floor(100 + Math.random() * 900);
    return cvv.toString();
  }

  /**
   * Generate expiry date (3 years from now)
   */
  private generateExpiryDate(): string {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 3);
    return date.toISOString();
  }

  /**
   * Get last 4 digits of card number
   */
  private getLastFourDigits(encryptedCardNumber: string | null): string {
    if (!encryptedCardNumber) {
      return '****';
    }

    try {
      const cardNumber = decrypt(encryptedCardNumber);
      const digits = cardNumber.replace(/-/g, '');
      return digits.slice(-4);
    } catch (error) {
      log.error('Failed to decrypt card number for masking', error as Error);
      return '****';
    }
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
          resource: 'virtual_card',
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

export const virtualCardService = new VirtualCardService();
