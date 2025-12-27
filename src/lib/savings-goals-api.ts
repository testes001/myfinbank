/**
 * Savings Goals API
 * Frontend API client for savings goal management
 */

import { apiFetch } from "./api-client";

export interface SavingsGoal {
  id: string;
  userId: string;
  accountId: string;
  name: string;
  category?: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  status: "ACTIVE" | "PAUSED" | "COMPLETED" | "CANCELLED";
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface CreateSavingsGoalInput {
  accountId: string;
  name: string;
  targetAmount: number;
  deadline?: string;
  category?: string;
}

export interface UpdateSavingsGoalInput {
  name?: string;
  targetAmount?: number;
  deadline?: string;
  category?: string;
}

export interface ContributeToGoalInput {
  amount: number;
}

export interface WithdrawFromGoalInput {
  amount: number;
}

/**
 * List all savings goals for the current user
 */
export async function listSavingsGoals(token?: string): Promise<SavingsGoal[]> {
  const resp = await apiFetch("/api/savings-goals", {
    method: "GET",
    tokenOverride: token,
  });

  if (!resp.ok) {
    const msg =
      (await resp.json().catch(() => null))?.message ||
      "Failed to load savings goals";
    throw new Error(msg);
  }

  const data = await resp.json();
  return data.data as SavingsGoal[];
}

/**
 * Get a specific savings goal
 */
export async function getSavingsGoal(
  goalId: string,
  token?: string
): Promise<SavingsGoal> {
  const resp = await apiFetch(`/api/savings-goals/${goalId}`, {
    method: "GET",
    tokenOverride: token,
  });

  if (!resp.ok) {
    const msg =
      (await resp.json().catch(() => null))?.message ||
      "Failed to load savings goal";
    throw new Error(msg);
  }

  const data = await resp.json();
  return data.data as SavingsGoal;
}

/**
 * Create a new savings goal
 */
export async function createSavingsGoal(
  input: CreateSavingsGoalInput,
  token?: string
): Promise<SavingsGoal> {
  const resp = await apiFetch("/api/savings-goals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    tokenOverride: token,
  });

  if (!resp.ok) {
    const msg =
      (await resp.json().catch(() => null))?.message ||
      "Failed to create savings goal";
    throw new Error(msg);
  }

  const data = await resp.json();
  return data.data as SavingsGoal;
}

/**
 * Update a savings goal
 */
export async function updateSavingsGoal(
  goalId: string,
  input: UpdateSavingsGoalInput,
  token?: string
): Promise<SavingsGoal> {
  const resp = await apiFetch(`/api/savings-goals/${goalId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    tokenOverride: token,
  });

  if (!resp.ok) {
    const msg =
      (await resp.json().catch(() => null))?.message ||
      "Failed to update savings goal";
    throw new Error(msg);
  }

  const data = await resp.json();
  return data.data as SavingsGoal;
}

/**
 * Contribute funds to a savings goal
 */
export async function contributeToGoal(
  goalId: string,
  input: ContributeToGoalInput,
  token?: string
): Promise<SavingsGoal> {
  const resp = await apiFetch(`/api/savings-goals/${goalId}/contribute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    tokenOverride: token,
  });

  if (!resp.ok) {
    const msg =
      (await resp.json().catch(() => null))?.message ||
      "Failed to contribute to savings goal";
    throw new Error(msg);
  }

  const data = await resp.json();
  return data.data as SavingsGoal;
}

/**
 * Withdraw funds from a savings goal
 */
export async function withdrawFromGoal(
  goalId: string,
  input: WithdrawFromGoalInput,
  token?: string
): Promise<SavingsGoal> {
  const resp = await apiFetch(`/api/savings-goals/${goalId}/withdraw`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    tokenOverride: token,
  });

  if (!resp.ok) {
    const msg =
      (await resp.json().catch(() => null))?.message ||
      "Failed to withdraw from savings goal";
    throw new Error(msg);
  }

  const data = await resp.json();
  return data.data as SavingsGoal;
}

/**
 * Pause a savings goal
 */
export async function pauseSavingsGoal(
  goalId: string,
  token?: string
): Promise<SavingsGoal> {
  const resp = await apiFetch(`/api/savings-goals/${goalId}/pause`, {
    method: "POST",
    tokenOverride: token,
  });

  if (!resp.ok) {
    const msg =
      (await resp.json().catch(() => null))?.message ||
      "Failed to pause savings goal";
    throw new Error(msg);
  }

  const data = await resp.json();
  return data.data as SavingsGoal;
}

/**
 * Resume a paused savings goal
 */
export async function resumeSavingsGoal(
  goalId: string,
  token?: string
): Promise<SavingsGoal> {
  const resp = await apiFetch(`/api/savings-goals/${goalId}/resume`, {
    method: "POST",
    tokenOverride: token,
  });

  if (!resp.ok) {
    const msg =
      (await resp.json().catch(() => null))?.message ||
      "Failed to resume savings goal";
    throw new Error(msg);
  }

  const data = await resp.json();
  return data.data as SavingsGoal;
}

/**
 * Delete/cancel a savings goal
 */
export async function deleteSavingsGoal(
  goalId: string,
  token?: string
): Promise<void> {
  const resp = await apiFetch(`/api/savings-goals/${goalId}`, {
    method: "DELETE",
    tokenOverride: token,
  });

  if (!resp.ok) {
    const msg =
      (await resp.json().catch(() => null))?.message ||
      "Failed to delete savings goal";
    throw new Error(msg);
  }
}
