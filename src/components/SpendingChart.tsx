import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import type { TransactionModel } from "@/lib/transactions";
import { getTransactionType } from "@/lib/transactions";

interface SpendingChartProps {
  transactions: TransactionModel[];
  accountId: string;
}

export function SpendingChart({ transactions, accountId }: SpendingChartProps) {
  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        timestamp: Math.floor(date.getTime() / 1000),
        spent: 0,
        received: 0,
      };
    });

    for (const tx of transactions) {
      const txTimestamp = Number.parseInt(tx.create_time);
      const type = getTransactionType(tx, accountId);
      const amount = Number.parseFloat(tx.amount);

      for (const day of last7Days) {
        const dayStart = day.timestamp;
        const dayEnd = dayStart + 86400;

        if (txTimestamp >= dayStart && txTimestamp < dayEnd) {
          if (type === "sent") {
            day.spent += amount;
          } else {
            day.received += amount;
          }
          break;
        }
      }
    }

    return last7Days;
  }, [transactions, accountId]);

  return (
    <Card className="border-white/10 bg-white/5 p-4 backdrop-blur-xl">
      <h3 className="mb-4 text-sm font-semibold text-white/80">Spending Trends (Last 7 Days)</h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorSpent" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
          <XAxis
            dataKey="date"
            stroke="#ffffff40"
            style={{ fontSize: "12px" }}
            tick={{ fill: "#ffffff60" }}
          />
          <YAxis
            stroke="#ffffff40"
            style={{ fontSize: "12px" }}
            tick={{ fill: "#ffffff60" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(15, 23, 42, 0.9)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: "8px",
              color: "#fff",
            }}
            labelStyle={{ color: "#fff" }}
          />
          <Area
            type="monotone"
            dataKey="spent"
            stroke="#ef4444"
            fillOpacity={1}
            fill="url(#colorSpent)"
            name="Spent"
          />
          <Area
            type="monotone"
            dataKey="received"
            stroke="#10b981"
            fillOpacity={1}
            fill="url(#colorReceived)"
            name="Received"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}
