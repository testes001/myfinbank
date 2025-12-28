import { apiFetch } from "./api-client";

export interface TransactionDTO {
  id: string;
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  status: string;
  description?: string | null;
  createdAt: string;
}

// Legacy shape expected by UI components
export interface TransactionModel {
  id: string;
  from_account_id: string;
  to_account_id: string;
  amount: string;
  status: number | string;
  description?: string | null;
  create_time: string; // seconds since epoch as string
  transaction_type?: number;
  data_creator?: string;
  data_updater?: string;
  update_time?: string;
}

function dtoToModel(tx: TransactionDTO): TransactionModel {
  return {
    id: tx.id,
    from_account_id: tx.fromAccountId,
    to_account_id: tx.toAccountId,
    amount: tx.amount.toFixed(2),
    status: tx.status,
    description: tx.description,
    create_time: Math.floor(new Date(tx.createdAt).getTime() / 1000).toString(),
    update_time: tx.createdAt,
  };
}

export async function transferFunds(
  fromAccountId: string,
  toAccountId: string,
  amount: number,
  description?: string,
): Promise<TransactionModel> {
  const resp = await apiFetch(`/api/transactions/transfer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fromAccountId, toAccountId, amount, description }),
  });
  if (!resp.ok) {
    const msg = (await resp.json().catch(() => null))?.message || "Transfer failed";
    throw new Error(msg);
  }
  const data = await resp.json();
  return dtoToModel(data.data);
}

export async function getTransactionsByAccountId(
  accountId: string,
  page: number = 1,
  pageSize: number = 20,
): Promise<{ transactions: TransactionModel[]; totalPages: number }> {
  const params = new URLSearchParams({ accountId, page: String(page), pageSize: String(pageSize) });
  const resp = await apiFetch(`/api/transactions?${params.toString()}`);
  if (!resp.ok) {
    const msg = (await resp.json().catch(() => null))?.message || "Failed to load transactions";
    throw new Error(msg);
  }
  const data = await resp.json();
  const txs = (data.data as TransactionDTO[]).map(dtoToModel);
  return {
    transactions: txs,
    totalPages: data.pagination?.totalPages ?? 1,
  };
}

export async function getRecentTransactions(accountId: string, limit: number = 5): Promise<TransactionModel[]> {
  const { transactions } = await getTransactionsByAccountId(accountId, 1, limit);
  return transactions;
}

export function formatCurrency(amount: string | number): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(num);
}

export function formatDate(timestamp: string): string {
  const date = new Date(Number.parseInt(timestamp, 10) * 1000 || timestamp);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function getTransactionType(transaction: TransactionModel, currentAccountId: string): "sent" | "received" {
  return transaction.from_account_id === currentAccountId ? "sent" : "received";
}

export async function p2pTransfer(
  fromAccountId: string,
  recipientEmail: string,
  amount: number,
  memo?: string,
): Promise<void> {
  const resp = await apiFetch(`/api/transactions/p2p`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fromAccountId, recipientEmail, amount, memo }),
  });
  if (!resp.ok) {
    const msg = (await resp.json().catch(() => null))?.message || "P2P transfer failed";
    throw new Error(msg);
  }
}

export async function payBill(
  accountId: string,
  payeeName: string,
  payeeAccountNumber: string,
  amount: number,
  category: string,
  paymentDate?: string, // Backend handles immediate, this is for future scheduling if implemented
  frequency: "once" | "weekly" | "monthly" = "once",
): Promise<TransactionModel> {
  const resp = await apiFetch(`/api/transactions/bill-pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ accountId, payeeName, payeeAccountNumber, amount, category, paymentDate, frequency }),
  });
  if (!resp.ok) {
    const msg = (await resp.json().catch(() => null))?.message || "Bill payment failed";
    throw new Error(msg);
  }
  const data = await resp.json();
  return dtoToModel(data.data);
}
