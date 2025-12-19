/**
 * Recurring Transfers Management
 * Provides scheduled payment support for the banking app
 */

export type RecurringFrequency = "daily" | "weekly" | "biweekly" | "monthly" | "quarterly" | "yearly";
export type RecurringStatus = "active" | "paused" | "completed" | "cancelled";

export interface RecurringTransfer {
  id: string;
  userId: string;
  fromAccountId: string;
  toAccountId: string;
  recipientName: string;
  recipientEmail?: string;
  amount: number;
  frequency: RecurringFrequency;
  description?: string;
  startDate: string;
  endDate?: string;
  nextExecutionDate: string;
  lastExecutionDate?: string;
  executionCount: number;
  maxExecutions?: number;
  status: RecurringStatus;
  createdAt: string;
  updatedAt: string;
}

const RECURRING_TRANSFERS_KEY = "banking_recurring_transfers";

function generateId(): string {
  return `rt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Calculate next execution date based on frequency
export function calculateNextExecutionDate(
  currentDate: Date,
  frequency: RecurringFrequency
): Date {
  const next = new Date(currentDate);

  switch (frequency) {
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "biweekly":
      next.setDate(next.getDate() + 14);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    case "quarterly":
      next.setMonth(next.getMonth() + 3);
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + 1);
      break;
  }

  return next;
}

// Get all recurring transfers for a user
export function getRecurringTransfers(userId: string): RecurringTransfer[] {
  const data = localStorage.getItem(RECURRING_TRANSFERS_KEY);
  if (!data) return [];

  try {
    const allTransfers = JSON.parse(data) as RecurringTransfer[];
    return allTransfers
      .filter(t => t.userId === userId)
      .sort((a, b) => new Date(a.nextExecutionDate).getTime() - new Date(b.nextExecutionDate).getTime());
  } catch {
    return [];
  }
}

// Get a single recurring transfer
export function getRecurringTransfer(transferId: string): RecurringTransfer | null {
  const data = localStorage.getItem(RECURRING_TRANSFERS_KEY);
  if (!data) return null;

  try {
    const allTransfers = JSON.parse(data) as RecurringTransfer[];
    return allTransfers.find(t => t.id === transferId) || null;
  } catch {
    return null;
  }
}

// Create a new recurring transfer
export function createRecurringTransfer(
  transfer: Omit<RecurringTransfer, "id" | "executionCount" | "status" | "createdAt" | "updatedAt" | "nextExecutionDate" | "lastExecutionDate">
): RecurringTransfer {
  const data = localStorage.getItem(RECURRING_TRANSFERS_KEY);
  const allTransfers: RecurringTransfer[] = data ? JSON.parse(data) : [];

  const now = new Date().toISOString();
  const startDate = new Date(transfer.startDate);

  // If start date is in the past, set next execution to tomorrow
  const nextExecution = startDate <= new Date()
    ? calculateNextExecutionDate(new Date(), transfer.frequency)
    : startDate;

  const newTransfer: RecurringTransfer = {
    ...transfer,
    id: generateId(),
    executionCount: 0,
    status: "active",
    nextExecutionDate: nextExecution.toISOString(),
    createdAt: now,
    updatedAt: now,
  };

  allTransfers.push(newTransfer);
  localStorage.setItem(RECURRING_TRANSFERS_KEY, JSON.stringify(allTransfers));

  return newTransfer;
}

// Update a recurring transfer
export function updateRecurringTransfer(
  transferId: string,
  updates: Partial<Omit<RecurringTransfer, "id" | "userId" | "createdAt">>
): RecurringTransfer | null {
  const data = localStorage.getItem(RECURRING_TRANSFERS_KEY);
  if (!data) return null;

  const allTransfers: RecurringTransfer[] = JSON.parse(data);
  const index = allTransfers.findIndex(t => t.id === transferId);

  if (index === -1) return null;

  const updated: RecurringTransfer = {
    ...allTransfers[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  allTransfers[index] = updated;
  localStorage.setItem(RECURRING_TRANSFERS_KEY, JSON.stringify(allTransfers));

  return updated;
}

// Pause a recurring transfer
export function pauseRecurringTransfer(transferId: string): RecurringTransfer | null {
  return updateRecurringTransfer(transferId, { status: "paused" });
}

// Resume a recurring transfer
export function resumeRecurringTransfer(transferId: string): RecurringTransfer | null {
  const transfer = getRecurringTransfer(transferId);
  if (!transfer) return null;

  // Recalculate next execution date from today
  const nextExecution = calculateNextExecutionDate(new Date(), transfer.frequency);

  return updateRecurringTransfer(transferId, {
    status: "active",
    nextExecutionDate: nextExecution.toISOString(),
  });
}

// Cancel a recurring transfer
export function cancelRecurringTransfer(transferId: string): RecurringTransfer | null {
  return updateRecurringTransfer(transferId, { status: "cancelled" });
}

// Delete a recurring transfer
export function deleteRecurringTransfer(transferId: string): boolean {
  const data = localStorage.getItem(RECURRING_TRANSFERS_KEY);
  if (!data) return false;

  const allTransfers: RecurringTransfer[] = JSON.parse(data);
  const filtered = allTransfers.filter(t => t.id !== transferId);

  if (filtered.length === allTransfers.length) return false;

  localStorage.setItem(RECURRING_TRANSFERS_KEY, JSON.stringify(filtered));
  return true;
}

// Mark a transfer as executed and update next execution date
export function markTransferExecuted(transferId: string): RecurringTransfer | null {
  const transfer = getRecurringTransfer(transferId);
  if (!transfer || transfer.status !== "active") return null;

  const now = new Date();
  const newCount = transfer.executionCount + 1;

  // Check if transfer should be completed
  let newStatus: RecurringStatus = "active";

  // Check max executions
  if (transfer.maxExecutions && newCount >= transfer.maxExecutions) {
    newStatus = "completed";
  }

  // Check end date
  if (transfer.endDate && new Date(transfer.endDate) <= now) {
    newStatus = "completed";
  }

  const nextExecution = newStatus === "active"
    ? calculateNextExecutionDate(now, transfer.frequency)
    : now;

  return updateRecurringTransfer(transferId, {
    executionCount: newCount,
    lastExecutionDate: now.toISOString(),
    nextExecutionDate: nextExecution.toISOString(),
    status: newStatus,
  });
}

// Get upcoming recurring transfers (within next N days)
export function getUpcomingTransfers(userId: string, days: number = 7): RecurringTransfer[] {
  const transfers = getRecurringTransfers(userId);
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() + days);

  return transfers.filter(t =>
    t.status === "active" &&
    new Date(t.nextExecutionDate) <= cutoff
  );
}

// Get transfers due today
export function getTransfersDueToday(userId: string): RecurringTransfer[] {
  const transfers = getRecurringTransfers(userId);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return transfers.filter(t => {
    if (t.status !== "active") return false;
    const execDate = new Date(t.nextExecutionDate);
    return execDate >= today && execDate < tomorrow;
  });
}

// Format frequency for display
export function formatFrequency(frequency: RecurringFrequency): string {
  switch (frequency) {
    case "daily":
      return "Daily";
    case "weekly":
      return "Weekly";
    case "biweekly":
      return "Every 2 Weeks";
    case "monthly":
      return "Monthly";
    case "quarterly":
      return "Quarterly";
    case "yearly":
      return "Yearly";
    default:
      return frequency;
  }
}

// Get status badge color
export function getStatusColor(status: RecurringStatus): string {
  switch (status) {
    case "active":
      return "green";
    case "paused":
      return "yellow";
    case "completed":
      return "blue";
    case "cancelled":
      return "red";
    default:
      return "gray";
  }
}
