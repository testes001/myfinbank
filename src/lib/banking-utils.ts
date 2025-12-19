import { FINBANK_ROUTING_NUMBER, ROUTING_NUMBER_DATABASE } from "@/lib/seed";

// Generate unique account number (10-12 digits)
export function generateAccountNumber(): string {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${timestamp}${random}`;
}

// Validate routing number format
export function isValidRoutingNumber(routingNumber: string): boolean {
  return /^\d{9}$/.test(routingNumber);
}

// Validate account number format (10-12 digits as per banking standards)
export function isValidAccountNumber(accountNumber: string): boolean {
  return /^\d{10,12}$/.test(accountNumber);
}

// Get bank name from routing number
export function getBankName(routingNumber: string): string | null {
  return ROUTING_NUMBER_DATABASE[routingNumber] || null;
}

// Check if routing number is internal (FinBank)
export function isInternalTransfer(routingNumber: string): boolean {
  return routingNumber === FINBANK_ROUTING_NUMBER;
}

// Format account number for display (e.g., ****1234)
export function maskAccountNumber(accountNumber: string): string {
  if (accountNumber.length < 4) return accountNumber;
  return '*'.repeat(accountNumber.length - 4) + accountNumber.slice(-4);
}

// Format routing number for display
export function formatRoutingNumber(routingNumber: string): string {
  return routingNumber.replace(/(\d{3})(\d{3})(\d{3})/, '$1-$2-$3');
}

// Category detection for auto-categorization
export function categorizeTransaction(description: string | null): string {
  if (!description) return "other";

  const desc = description.toLowerCase();

  if (desc.includes('grocery') || desc.includes('supermarket') || desc.includes('food')) return "groceries";
  if (desc.includes('gas') || desc.includes('fuel')) return "transportation";
  if (desc.includes('restaurant') || desc.includes('cafe') || desc.includes('dining')) return "dining";
  if (desc.includes('utility') || desc.includes('electric') || desc.includes('water')) return "utilities";
  if (desc.includes('rent') || desc.includes('mortgage')) return "housing";
  if (desc.includes('entertainment') || desc.includes('movie') || desc.includes('streaming')) return "entertainment";
  if (desc.includes('health') || desc.includes('medical') || desc.includes('pharmacy')) return "healthcare";
  if (desc.includes('travel') || desc.includes('flight') || desc.includes('hotel')) return "travel";
  if (desc.includes('shopping') || desc.includes('retail')) return "shopping";

  return "other";
}

// Get category icon and color
export function getCategoryStyle(category: string): { icon: string; color: string } {
  const styles: Record<string, { icon: string; color: string }> = {
    groceries: { icon: "🛒", color: "green" },
    transportation: { icon: "⛽", color: "orange" },
    dining: { icon: "🍽️", color: "red" },
    utilities: { icon: "💡", color: "yellow" },
    housing: { icon: "🏠", color: "blue" },
    entertainment: { icon: "🎬", color: "purple" },
    healthcare: { icon: "⚕️", color: "pink" },
    travel: { icon: "✈️", color: "cyan" },
    shopping: { icon: "🛍️", color: "indigo" },
    other: { icon: "💰", color: "gray" },
  };

  return styles[category] || styles.other;
}

// Transaction fee calculator
export function calculateTransferFee(
  amount: number,
  transferType: 'internal' | 'ach' | 'wire_domestic' | 'wire_international'
): number {
  switch (transferType) {
    case 'internal':
      return 0; // Free for internal FinBank transfers
    case 'ach':
      return 0; // Free for ACH
    case 'wire_domestic':
      return 25; // $25 fee for domestic wires
    case 'wire_international':
      return 45; // $45 fee for international wires
    default:
      return 0;
  }
}

// Get transfer type based on routing number
export function getTransferType(routingNumber: string): 'internal' | 'ach' | 'wire' {
  if (isInternalTransfer(routingNumber)) {
    return 'internal';
  }
  // For simplicity, we'll default to ACH for external transfers
  // In a real app, user would select wire vs ACH
  return 'ach';
}

// Simulate processing time for different transfer types
export function getProcessingTime(transferType: 'internal' | 'ach' | 'wire_domestic' | 'wire_international'): string {
  switch (transferType) {
    case 'internal':
      return 'Instant';
    case 'ach':
      return '1-3 business days';
    case 'wire_domestic':
      return 'Same business day';
    case 'wire_international':
      return '1-5 business days';
    default:
      return 'Processing';
  }
}

// Credit score simulator
export function generateMockCreditScore(): {
  score: number;
  category: 'Poor' | 'Fair' | 'Good' | 'Very Good' | 'Excellent';
  factors: string[];
} {
  const score = Math.floor(Math.random() * (850 - 580 + 1)) + 580;

  let category: 'Poor' | 'Fair' | 'Good' | 'Very Good' | 'Excellent';
  if (score < 580) category = 'Poor';
  else if (score < 670) category = 'Fair';
  else if (score < 740) category = 'Good';
  else if (score < 800) category = 'Very Good';
  else category = 'Excellent';

  const factors = [
    "Payment history (35% of score)",
    "Credit utilization (30% of score)",
    "Length of credit history (15% of score)",
    "Credit mix (10% of score)",
    "New credit inquiries (10% of score)"
  ];

  return { score, category, factors };
}
