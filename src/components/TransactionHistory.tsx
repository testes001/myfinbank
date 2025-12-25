import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getTransactionsByAccountId, formatCurrency, formatDate, getTransactionType } from "@/lib/transactions";
import type { TransactionModel } from "@/lib/transactions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TransactionSkeleton } from "@/components/LoadingSkeleton";
import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownLeft } from "lucide-react";

export function TransactionHistory() {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState<TransactionModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "sent" | "received">("all");
  const observerTarget = useRef<HTMLDivElement>(null);

  const loadTransactions = async (pageNum: number, append: boolean = false) => {
    if (!currentUser) return;

    try {
      if (!append) setIsLoading(true);
      else setIsLoadingMore(true);

      const { transactions: txs, totalPages } = await getTransactionsByAccountId(
        currentUser.account.id,
        pageNum,
        20
      );

      if (append) {
        setTransactions((prev) => [...prev, ...txs]);
      } else {
        setTransactions(txs);
      }

      setHasMore(pageNum < totalPages);
    } catch (error) {
      console.error("Failed to load transactions:", error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadTransactions(nextPage, true);
    }
  }, [page, isLoadingMore, hasMore]);

  useEffect(() => {
    loadTransactions(1);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const target = observerTarget.current;
    if (target) {
      observer.observe(target);
    }

    return () => {
      if (target) {
        observer.unobserve(target);
      }
    };
  }, [loadMore, hasMore, isLoadingMore]);

  if (!currentUser) return null;

  const filteredTransactions = transactions.filter((tx) => {
    if (filter === "all") return true;
    const type = getTransactionType(tx, currentUser.account.id);
    return type === filter;
  });

  return (
    <div className="min-h-screen p-4 pt-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Transaction History</h1>
          <p className="text-white/60">View all your transactions</p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            onClick={() => setFilter("all")}
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            className={
              filter === "all"
                ? "bg-gradient-to-r from-blue-500 to-purple-500"
                : "border-white/20 bg-white/10 text-white hover:bg-white/20"
            }
          >
            All
          </Button>
          <Button
            onClick={() => setFilter("sent")}
            variant={filter === "sent" ? "default" : "outline"}
            size="sm"
            className={
              filter === "sent"
                ? "bg-gradient-to-r from-blue-500 to-purple-500"
                : "border-white/20 bg-white/10 text-white hover:bg-white/20"
            }
          >
            Sent
          </Button>
          <Button
            onClick={() => setFilter("received")}
            variant={filter === "received" ? "default" : "outline"}
            size="sm"
            className={
              filter === "received"
                ? "bg-gradient-to-r from-blue-500 to-purple-500"
                : "border-white/20 bg-white/10 text-white hover:bg-white/20"
            }
          >
            Received
          </Button>
        </div>

        {isLoading ? (
          <TransactionSkeleton />
        ) : filteredTransactions.length === 0 ? (
          <Card className="border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
            <p className="text-white/60">No transactions found</p>
            <p className="mt-1 text-sm text-white/40">
              {filter !== "all"
                ? `No ${filter} transactions yet`
                : "Start sending money to see your activity"}
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredTransactions.map((tx, index) => {
              const type = getTransactionType(tx, currentUser.account.id);
              const isSent = type === "sent";

              return (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`rounded-full p-2 ${
                        isSent ? "bg-red-500/20" : "bg-green-500/20"
                      }`}
                    >
                      {isSent ? (
                        <ArrowUpRight className="size-5 text-red-400" />
                      ) : (
                        <ArrowDownLeft className="size-5 text-green-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-white">
                            {isSent ? "Sent Money" : "Received Money"}
                          </p>
                          <p className="text-sm text-white/60">{formatDate(tx.create_time)}</p>
                          {tx.description && (
                            <p className="mt-1 text-sm text-white/40">{tx.description}</p>
                          )}
                        </div>
                        <p
                          className={`text-lg font-semibold ${
                            isSent ? "text-red-400" : "text-green-400"
                          }`}
                        >
                          {isSent ? "-" : "+"}
                          {formatCurrency(tx.amount)}
                        </p>
                      </div>
                      <div className="mt-2 flex gap-2 text-xs text-white/40">
                        <span>ID: {tx.id.slice(0, 8)}...</span>
                        <span className="capitalize">{tx.status === 0 ? "Completed" : "Pending"}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {hasMore && (
              <div ref={observerTarget} className="py-4 text-center">
                {isLoadingMore && (
                  <div className="text-sm text-white/60">Loading more...</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
