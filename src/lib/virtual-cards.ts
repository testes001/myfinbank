/**
 * Virtual Card Management
 * Provides virtual card number generation for secure online shopping
 */

export type VirtualCardStatus = "active" | "frozen" | "expired" | "cancelled";
export type VirtualCardType = "single_use" | "merchant_locked" | "recurring" | "standard";
export type CardNetwork = "visa" | "mastercard" | "amex" | "discover";

export interface VirtualCard {
  id: string;
  userId: string;
  accountId: string;
  cardNumber: string; // Last 4 digits visible, rest masked
  fullCardNumber: string; // Encrypted/stored version
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  nickname: string;
  type: VirtualCardType;
  network: CardNetwork; // Card network (Visa, Mastercard, etc.)
  merchantLock?: string; // Merchant name if locked to specific merchant
  spendingLimit?: number;
  spentAmount: number;
  singleUseUsed: boolean;
  status: VirtualCardStatus;
  createdAt: string;
  expiresAt: string;
  lastUsedAt?: string;
}

// Card network BINs (Bank Identification Numbers)
const CARD_NETWORK_BINS: Record<CardNetwork, string[]> = {
  visa: ["4"], // Visa starts with 4
  mastercard: ["51", "52", "53", "54", "55", "22", "23", "24", "25", "26", "27"], // Mastercard 51-55, 2221-2720
  amex: ["34", "37"], // American Express starts with 34 or 37
  discover: ["6011", "644", "645", "646", "647", "648", "649", "65"], // Discover patterns
};

// Card network lengths
const CARD_NETWORK_LENGTHS: Record<CardNetwork, number> = {
  visa: 16,
  mastercard: 16,
  amex: 15,
  discover: 16,
};

const VIRTUAL_CARDS_KEY = "banking_virtual_cards";

function generateId(): string {
  return `vc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Luhn algorithm for generating valid card numbers
 * The Luhn algorithm (or mod-10 algorithm) is used to validate credit card numbers
 */
function calculateLuhnCheckDigit(partialCardNumber: string): number {
  const digits = partialCardNumber.split("").map(Number).reverse();
  let sum = 0;

  for (let i = 0; i < digits.length; i++) {
    let digit = digits[i];
    if (i % 2 === 0) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
  }

  return (10 - (sum % 10)) % 10;
}

/**
 * Validate a card number using Luhn algorithm
 */
export function validateLuhn(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, "").split("").map(Number).reverse();
  let sum = 0;

  for (let i = 0; i < digits.length; i++) {
    let digit = digits[i];
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
  }

  return sum % 10 === 0;
}

/**
 * Generate a card number for a specific network with valid Luhn checksum
 */
function generateCardNumber(network: CardNetwork = "visa"): string {
  const bins = CARD_NETWORK_BINS[network];
  const length = CARD_NETWORK_LENGTHS[network];

  // Pick a random BIN for this network
  const bin = bins[Math.floor(Math.random() * bins.length)];

  // Generate remaining digits (length - 1 for check digit - bin length)
  let partialNumber = bin;
  const remainingDigits = length - 1 - bin.length;

  for (let i = 0; i < remainingDigits; i++) {
    partialNumber += Math.floor(Math.random() * 10).toString();
  }

  // Calculate and append Luhn check digit
  const checkDigit = calculateLuhnCheckDigit(partialNumber);
  const fullNumber = partialNumber + checkDigit.toString();

  return fullNumber;
}

/**
 * Detect card network from card number
 */
export function detectCardNetwork(cardNumber: string): CardNetwork | null {
  const cleaned = cardNumber.replace(/\D/g, "");

  // Check each network's BINs
  for (const [network, bins] of Object.entries(CARD_NETWORK_BINS)) {
    for (const bin of bins) {
      if (cleaned.startsWith(bin)) {
        return network as CardNetwork;
      }
    }
  }

  return null;
}

/**
 * Get network display name
 */
export function getNetworkDisplayName(network: CardNetwork): string {
  switch (network) {
    case "visa":
      return "Visa";
    case "mastercard":
      return "Mastercard";
    case "amex":
      return "American Express";
    case "discover":
      return "Discover";
    default:
      return network;
  }
}

// Generate CVV
function generateCVV(): string {
  return Math.floor(100 + Math.random() * 900).toString();
}

// Generate expiry date (1-3 years from now)
function generateExpiry(): { month: string; year: string; expiresAt: string } {
  const now = new Date();
  const yearsToAdd = Math.floor(Math.random() * 3) + 1;
  const expiry = new Date(now.getFullYear() + yearsToAdd, now.getMonth(), 1);

  const month = (expiry.getMonth() + 1).toString().padStart(2, "0");
  const year = expiry.getFullYear().toString().slice(-2);

  return {
    month,
    year,
    expiresAt: expiry.toISOString(),
  };
}

// Mask card number (show only last 4)
export function maskCardNumber(cardNumber: string): string {
  if (cardNumber.length !== 16) return cardNumber;
  return `•••• •••• •••• ${cardNumber.slice(-4)}`;
}

// Format card number with spaces
export function formatCardNumber(cardNumber: string): string {
  if (cardNumber.length !== 16) return cardNumber;
  return cardNumber.match(/.{1,4}/g)?.join(" ") || cardNumber;
}

// Get all virtual cards for a user
export function getVirtualCards(userId: string): VirtualCard[] {
  const data = localStorage.getItem(VIRTUAL_CARDS_KEY);
  if (!data) return [];

  try {
    const allCards = JSON.parse(data) as VirtualCard[];
    return allCards
      .filter(c => c.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch {
    return [];
  }
}

// Get a single virtual card
export function getVirtualCard(cardId: string): VirtualCard | null {
  const data = localStorage.getItem(VIRTUAL_CARDS_KEY);
  if (!data) return null;

  try {
    const allCards = JSON.parse(data) as VirtualCard[];
    return allCards.find(c => c.id === cardId) || null;
  } catch {
    return null;
  }
}

// Create a new virtual card
export function createVirtualCard(
  userId: string,
  accountId: string,
  options: {
    nickname: string;
    type: VirtualCardType;
    network?: CardNetwork;
    merchantLock?: string;
    spendingLimit?: number;
  }
): VirtualCard {
  const data = localStorage.getItem(VIRTUAL_CARDS_KEY);
  const allCards: VirtualCard[] = data ? JSON.parse(data) : [];

  // Default to Visa if no network specified
  const network = options.network || "visa";
  const cardNumber = generateCardNumber(network);
  const cvv = generateCVV();
  const expiry = generateExpiry();

  const newCard: VirtualCard = {
    id: generateId(),
    userId,
    accountId,
    cardNumber: cardNumber.slice(-4),
    fullCardNumber: cardNumber,
    expiryMonth: expiry.month,
    expiryYear: expiry.year,
    cvv,
    nickname: options.nickname,
    type: options.type,
    network,
    merchantLock: options.merchantLock,
    spendingLimit: options.spendingLimit,
    spentAmount: 0,
    singleUseUsed: false,
    status: "active",
    createdAt: new Date().toISOString(),
    expiresAt: expiry.expiresAt,
  };

  allCards.push(newCard);
  localStorage.setItem(VIRTUAL_CARDS_KEY, JSON.stringify(allCards));

  return newCard;
}

// Update a virtual card
export function updateVirtualCard(
  cardId: string,
  updates: Partial<Pick<VirtualCard, "nickname" | "spendingLimit" | "merchantLock" | "status">>
): VirtualCard | null {
  const data = localStorage.getItem(VIRTUAL_CARDS_KEY);
  if (!data) return null;

  const allCards: VirtualCard[] = JSON.parse(data);
  const index = allCards.findIndex(c => c.id === cardId);

  if (index === -1) return null;

  const updated: VirtualCard = {
    ...allCards[index],
    ...updates,
  };

  allCards[index] = updated;
  localStorage.setItem(VIRTUAL_CARDS_KEY, JSON.stringify(allCards));

  return updated;
}

// Freeze a virtual card
export function freezeVirtualCard(cardId: string): VirtualCard | null {
  return updateVirtualCard(cardId, { status: "frozen" });
}

// Unfreeze a virtual card
export function unfreezeVirtualCard(cardId: string): VirtualCard | null {
  const card = getVirtualCard(cardId);
  if (!card || card.status !== "frozen") return null;

  // Check if expired
  if (new Date(card.expiresAt) < new Date()) {
    return updateVirtualCard(cardId, { status: "expired" });
  }

  return updateVirtualCard(cardId, { status: "active" });
}

// Cancel a virtual card
export function cancelVirtualCard(cardId: string): VirtualCard | null {
  return updateVirtualCard(cardId, { status: "cancelled" });
}

// Delete a virtual card permanently
export function deleteVirtualCard(cardId: string): boolean {
  const data = localStorage.getItem(VIRTUAL_CARDS_KEY);
  if (!data) return false;

  const allCards: VirtualCard[] = JSON.parse(data);
  const filtered = allCards.filter(c => c.id !== cardId);

  if (filtered.length === allCards.length) return false;

  localStorage.setItem(VIRTUAL_CARDS_KEY, JSON.stringify(filtered));
  return true;
}

// Record a transaction on a virtual card
export function recordCardTransaction(cardId: string, amount: number): {
  success: boolean;
  message: string;
  card?: VirtualCard;
} {
  const card = getVirtualCard(cardId);

  if (!card) {
    return { success: false, message: "Card not found" };
  }

  if (card.status !== "active") {
    return { success: false, message: `Card is ${card.status}` };
  }

  if (new Date(card.expiresAt) < new Date()) {
    updateVirtualCard(cardId, { status: "expired" });
    return { success: false, message: "Card has expired" };
  }

  if (card.type === "single_use" && card.singleUseUsed) {
    return { success: false, message: "Single-use card has already been used" };
  }

  if (card.spendingLimit && (card.spentAmount + amount) > card.spendingLimit) {
    return { success: false, message: "Transaction would exceed spending limit" };
  }

  // Update spent amount and usage
  const data = localStorage.getItem(VIRTUAL_CARDS_KEY);
  if (!data) return { success: false, message: "Error updating card" };

  const allCards: VirtualCard[] = JSON.parse(data);
  const index = allCards.findIndex(c => c.id === cardId);

  if (index === -1) return { success: false, message: "Card not found" };

  allCards[index] = {
    ...allCards[index],
    spentAmount: allCards[index].spentAmount + amount,
    singleUseUsed: card.type === "single_use" ? true : card.singleUseUsed,
    lastUsedAt: new Date().toISOString(),
    status: card.type === "single_use" ? "cancelled" : card.status,
  };

  localStorage.setItem(VIRTUAL_CARDS_KEY, JSON.stringify(allCards));

  return {
    success: true,
    message: "Transaction recorded",
    card: allCards[index],
  };
}

// Get active card count
export function getActiveCardCount(userId: string): number {
  return getVirtualCards(userId).filter(c => c.status === "active").length;
}

// Get card type display name
export function getCardTypeDisplay(type: VirtualCardType): string {
  switch (type) {
    case "single_use":
      return "Single Use";
    case "merchant_locked":
      return "Merchant Locked";
    case "recurring":
      return "Recurring Payments";
    case "standard":
      return "Standard";
    default:
      return type;
  }
}

// Get status color for badges
export function getCardStatusColor(status: VirtualCardStatus): string {
  switch (status) {
    case "active":
      return "green";
    case "frozen":
      return "blue";
    case "expired":
      return "yellow";
    case "cancelled":
      return "red";
    default:
      return "gray";
  }
}
