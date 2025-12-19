import { AccountORM, type AccountModel } from "@/components/data/orm/orm_account";
import {
  TransactionORM,
  type TransactionModel,
  TransactionTransactionType,
  TransactionStatus,
} from "@/components/data/orm/orm_transaction";
import { FilterBuilder, SortBuilder, CreateValue } from "@/components/data/orm/client";
import { Direction, DataType } from "@/components/data/orm/common";
import { addAuditLog } from "@/lib/admin-storage";

const accountOrm = AccountORM.getInstance();
const transactionOrm = TransactionORM.getInstance();

export async function transferFunds(
  fromAccountId: string,
  toAccountId: string,
  amount: number,
  description?: string
): Promise<TransactionModel> {
  if (amount <= 0) {
    throw new Error("Amount must be greater than zero");
  }

  const fromAccounts = await accountOrm.getAccountById(fromAccountId);
  const toAccounts = await accountOrm.getAccountById(toAccountId);

  if (fromAccounts.length === 0 || toAccounts.length === 0) {
    addAuditLog({
      actor: fromAccountId,
      actorType: "user",
      action: "transfer_failed",
      resource: "transaction",
      details: { fromAccountId, toAccountId, amount, reason: "Account not found" },
      status: "failed",
    });
    throw new Error("Account not found");
  }

  const fromAccount = fromAccounts[0];
  const toAccount = toAccounts[0];

  const currentBalance = parseFloat(fromAccount.balance);
  if (currentBalance < amount) {
    addAuditLog({
      actor: fromAccount.user_id,
      actorType: "user",
      action: "transfer_failed",
      resource: "transaction",
      details: { fromAccountId, toAccountId, amount, reason: "Insufficient funds" },
      status: "failed",
    });
    throw new Error("Insufficient funds");
  }

  const newFromBalance = currentBalance - amount;
  const newToBalance = parseFloat(toAccount.balance) + amount;

  await accountOrm.setAccountById(fromAccountId, {
    ...fromAccount,
    balance: newFromBalance.toFixed(2),
  });

  await accountOrm.setAccountById(toAccountId, {
    ...toAccount,
    balance: newToBalance.toFixed(2),
  });

  const [transaction] = await transactionOrm.insertTransaction([
    {
      from_account_id: fromAccountId,
      to_account_id: toAccountId,
      amount: amount.toFixed(2),
      transaction_type: 0,
      status: 0,
      description: description || null,
      id: "",
      data_creator: "",
      data_updater: "",
      create_time: "",
      update_time: "",
    },
  ]);

  addAuditLog({
    actor: fromAccount.user_id,
    actorType: "user",
    action: "transfer_completed",
    resource: "transaction",
    resourceId: transaction.id,
    details: { fromAccountId, toAccountId, amount, description },
    status: "success",
  });

  return transaction;
}

export async function getTransactionsByAccountId(
  accountId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<{ transactions: TransactionModel[]; totalPages: number }> {
  const fromFilter = new FilterBuilder().equal("from_account_id", CreateValue(DataType.string, accountId)).build();
  const toFilter = new FilterBuilder().equal("to_account_id", CreateValue(DataType.string, accountId)).build();

  const sort = new SortBuilder().descending("create_time").build();

  const [fromTransactions] = await transactionOrm.listTransaction(
    fromFilter,
    sort,
    { number: page, size: pageSize }
  );

  const [toTransactions] = await transactionOrm.listTransaction(
    toFilter,
    sort,
    { number: page, size: pageSize }
  );

  const allTransactions = [...fromTransactions, ...toTransactions];

  const uniqueTransactions = Array.from(
    new Map(allTransactions.map(t => [t.id, t])).values()
  );

  uniqueTransactions.sort((a, b) => {
    const aTime = parseInt(a.create_time);
    const bTime = parseInt(b.create_time);
    return bTime - aTime;
  });

  const paginatedTransactions = uniqueTransactions.slice(0, pageSize);

  return {
    transactions: paginatedTransactions,
    totalPages: Math.ceil(uniqueTransactions.length / pageSize),
  };
}

export async function getRecentTransactions(
  accountId: string,
  limit: number = 5
): Promise<TransactionModel[]> {
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
  const date = new Date(parseInt(timestamp) * 1000);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function getTransactionType(
  transaction: TransactionModel,
  currentAccountId: string
): "sent" | "received" {
  return transaction.from_account_id === currentAccountId ? "sent" : "received";
}
