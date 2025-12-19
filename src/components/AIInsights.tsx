import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  PiggyBank,
  Target,
  Lightbulb,
  ChevronRight,
  RefreshCw,
  CreditCard,
  ShoppingBag,
  Utensils,
  Car,
  Home,
  Zap,
  CheckCircle2,
  Clock,
  ArrowRight,
  Brain,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/transactions";
import type { TransactionModel } from "@/components/data/orm/orm_transaction";

interface InsightType {
  id: string;
  type: "warning" | "opportunity" | "achievement" | "tip" | "forecast";
  title: string;
  description: string;
  impact?: string;
  action?: string;
  priority: number; // 1-5, 5 being highest
  category?: string;
  amount?: number;
  icon: React.ReactNode;
}

interface AIInsightsProps {
  transactions: TransactionModel[];
  balance: number;
  compact?: boolean;
}

// Simulated AI analysis functions
function analyzeSpendingPatterns(transactions: TransactionModel[], accountId: string): InsightType[] {
  const insights: InsightType[] = [];
  const now = new Date();
  const thisMonth = now.getMonth();
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;

  // Calculate spending by category (simplified)
  const monthlySpending = transactions
    .filter((tx) => {
      const txDate = new Date(tx.create_time);
      return txDate.getMonth() === thisMonth && tx.from_account_id === accountId;
    })
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

  const lastMonthSpending = transactions
    .filter((tx) => {
      const txDate = new Date(tx.create_time);
      return txDate.getMonth() === lastMonth && tx.from_account_id === accountId;
    })
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

  // Spending trend insight
  if (lastMonthSpending > 0) {
    const spendingChange = ((monthlySpending - lastMonthSpending) / lastMonthSpending) * 100;

    if (spendingChange > 20) {
      insights.push({
        id: "spending_increase",
        type: "warning",
        title: "Spending Increase Detected",
        description: `Your spending is up ${spendingChange.toFixed(0)}% compared to last month.`,
        impact: `You've spent ${formatCurrency(monthlySpending - lastMonthSpending)} more than usual`,
        action: "Review your recent transactions to identify areas to cut back",
        priority: 4,
        icon: <TrendingUp className="size-5 text-red-400" />,
      });
    } else if (spendingChange < -15) {
      insights.push({
        id: "spending_decrease",
        type: "achievement",
        title: "Great Spending Control!",
        description: `Your spending is down ${Math.abs(spendingChange).toFixed(0)}% compared to last month.`,
        impact: `You've saved ${formatCurrency(Math.abs(monthlySpending - lastMonthSpending))}`,
        priority: 3,
        icon: <TrendingDown className="size-5 text-green-400" />,
      });
    }
  }

  return insights;
}

function generateSmartTips(balance: number, transactions: TransactionModel[]): InsightType[] {
  const tips: InsightType[] = [];

  // Balance-based tips
  if (balance < 500) {
    tips.push({
      id: "low_balance_tip",
      type: "warning",
      title: "Build Your Safety Net",
      description: "Your balance is below the recommended minimum for emergencies.",
      action: "Consider setting up automatic transfers to savings",
      priority: 5,
      icon: <AlertTriangle className="size-5 text-amber-400" />,
    });
  }

  if (balance > 5000) {
    tips.push({
      id: "high_balance_opportunity",
      type: "opportunity",
      title: "Maximize Your Money",
      description: "You have funds that could be earning more interest.",
      impact: "A high-yield savings account could earn you $50-100+ per year",
      action: "Transfer excess funds to a savings goal",
      priority: 3,
      icon: <PiggyBank className="size-5 text-green-400" />,
    });
  }

  // Transaction pattern tips
  const recentTransactions = transactions.slice(0, 10);
  const hasRecurringPayments = recentTransactions.some(
    (tx) => tx.description?.toLowerCase().includes("subscription") ||
      tx.description?.toLowerCase().includes("monthly")
  );

  if (hasRecurringPayments) {
    tips.push({
      id: "subscription_review",
      type: "tip",
      title: "Review Your Subscriptions",
      description: "We detected recurring payments in your account.",
      action: "Review and cancel unused subscriptions to save money",
      priority: 2,
      icon: <RefreshCw className="size-5 text-blue-400" />,
    });
  }

  // Generic smart tips
  const smartTips = [
    {
      id: "round_up_savings",
      type: "opportunity" as const,
      title: "Round-Up Savings",
      description: "Enable round-up savings to automatically save spare change from each purchase.",
      impact: "Average users save $30-50 per month with round-ups",
      priority: 2,
      icon: <Zap className="size-5 text-purple-400" />,
    },
    {
      id: "direct_deposit_bonus",
      type: "opportunity" as const,
      title: "Direct Deposit Benefits",
      description: "Set up direct deposit to unlock premium features and faster access to funds.",
      action: "Set up direct deposit in your profile settings",
      priority: 2,
      icon: <DollarSign className="size-5 text-green-400" />,
    },
    {
      id: "bill_pay_schedule",
      type: "tip" as const,
      title: "Automate Your Bills",
      description: "Set up automatic bill payments to avoid late fees and improve credit score.",
      impact: "Never miss a payment and save on late fees",
      priority: 2,
      icon: <Clock className="size-5 text-blue-400" />,
    },
  ];

  // Add a random smart tip
  const randomTip = smartTips[Math.floor(Math.random() * smartTips.length)];
  tips.push(randomTip);

  return tips;
}

function generateSpendingForecast(
  transactions: TransactionModel[],
  balance: number,
  accountId: string
): InsightType | null {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOfMonth = now.getDate();
  const daysRemaining = daysInMonth - dayOfMonth;

  // Calculate average daily spending
  const monthlySpending = transactions
    .filter((tx) => {
      const txDate = new Date(tx.create_time);
      return txDate.getMonth() === now.getMonth() && tx.from_account_id === accountId;
    })
    .reduce((sum, tx) => sum + parseFloat(tx.amount), 0);

  if (dayOfMonth < 5) return null; // Not enough data

  const avgDailySpending = monthlySpending / dayOfMonth;
  const projectedMonthEnd = balance - avgDailySpending * daysRemaining;

  if (projectedMonthEnd < 0) {
    return {
      id: "negative_forecast",
      type: "warning",
      title: "Budget Alert",
      description: `At your current spending rate, you may overdraft before month-end.`,
      impact: `Projected shortfall: ${formatCurrency(Math.abs(projectedMonthEnd))}`,
      action: "Reduce daily spending or add funds to avoid overdraft",
      priority: 5,
      icon: <AlertTriangle className="size-5 text-red-400" />,
    };
  }

  if (projectedMonthEnd > balance * 0.3) {
    return {
      id: "positive_forecast",
      type: "forecast",
      title: "Month-End Outlook",
      description: "You're on track to end the month with healthy savings!",
      impact: `Projected balance: ${formatCurrency(projectedMonthEnd)}`,
      priority: 2,
      icon: <Target className="size-5 text-green-400" />,
    };
  }

  return null;
}

export function AIInsights({ transactions, balance, compact = false }: AIInsightsProps) {
  const { currentUser } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dismissedInsights, setDismissedInsights] = useState<string[]>([]);

  // Generate insights
  const insights = useMemo(() => {
    if (!currentUser) return [];

    const accountId = currentUser.account.id;
    let allInsights: InsightType[] = [];

    // Analyze spending patterns
    allInsights = [...allInsights, ...analyzeSpendingPatterns(transactions, accountId)];

    // Generate smart tips
    allInsights = [...allInsights, ...generateSmartTips(balance, transactions)];

    // Generate forecast
    const forecast = generateSpendingForecast(transactions, balance, accountId);
    if (forecast) {
      allInsights.push(forecast);
    }

    // Sort by priority (highest first) and filter dismissed
    return allInsights
      .filter((i) => !dismissedInsights.includes(i.id))
      .sort((a, b) => b.priority - a.priority);
  }, [currentUser, transactions, balance, dismissedInsights]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate AI analysis delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1500);
  };

  const handleDismiss = (insightId: string) => {
    setDismissedInsights([...dismissedInsights, insightId]);
  };

  const getTypeColor = (type: InsightType["type"]) => {
    switch (type) {
      case "warning":
        return "border-amber-500/30 bg-amber-500/10";
      case "opportunity":
        return "border-green-500/30 bg-green-500/10";
      case "achievement":
        return "border-blue-500/30 bg-blue-500/10";
      case "tip":
        return "border-purple-500/30 bg-purple-500/10";
      case "forecast":
        return "border-cyan-500/30 bg-cyan-500/10";
      default:
        return "border-white/10 bg-white/5";
    }
  };

  const getTypeBadge = (type: InsightType["type"]) => {
    switch (type) {
      case "warning":
        return <Badge className="bg-amber-500/20 text-amber-400 text-xs">Alert</Badge>;
      case "opportunity":
        return <Badge className="bg-green-500/20 text-green-400 text-xs">Opportunity</Badge>;
      case "achievement":
        return <Badge className="bg-blue-500/20 text-blue-400 text-xs">Achievement</Badge>;
      case "tip":
        return <Badge className="bg-purple-500/20 text-purple-400 text-xs">Tip</Badge>;
      case "forecast":
        return <Badge className="bg-cyan-500/20 text-cyan-400 text-xs">Forecast</Badge>;
      default:
        return null;
    }
  };

  if (compact) {
    // Compact view for dashboard
    const topInsight = insights[0];

    if (!topInsight) {
      return (
        <Card className="border-white/10 bg-gradient-to-br from-purple-500/10 to-blue-500/10 p-4 backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="size-5 text-purple-400" />
            <h3 className="font-semibold text-white">AI Insights</h3>
          </div>
          <p className="text-white/60 text-sm">
            No personalized insights available yet. Start using your account to get recommendations!
          </p>
        </Card>
      );
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card
          className={`border ${getTypeColor(topInsight.type)} p-4 backdrop-blur-xl`}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5">{topInsight.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="size-4 text-purple-400" />
                <span className="text-xs text-purple-400 font-medium">AI Insight</span>
                {getTypeBadge(topInsight.type)}
              </div>
              <h4 className="font-semibold text-white text-sm">{topInsight.title}</h4>
              <p className="text-white/60 text-xs mt-1 line-clamp-2">
                {topInsight.description}
              </p>
              {topInsight.action && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-blue-400 hover:bg-blue-500/20 h-6 px-2 mt-2 text-xs"
                >
                  {topInsight.action}
                  <ChevronRight className="size-3 ml-1" />
                </Button>
              )}
            </div>
          </div>
          {insights.length > 1 && (
            <p className="text-xs text-white/40 text-center mt-3">
              +{insights.length - 1} more insights available
            </p>
          )}
        </Card>
      </motion.div>
    );
  }

  // Full view
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="size-6 text-purple-400" />
          <div>
            <h2 className="text-xl font-bold text-white">AI Insights</h2>
            <p className="text-white/60 text-sm">Personalized recommendations for you</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="border-white/20 text-white hover:bg-white/10"
        >
          <RefreshCw className={`size-4 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Insights Grid */}
      {insights.length === 0 ? (
        <Card className="border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
          <Sparkles className="size-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No insights yet</h3>
          <p className="text-white/60">
            Start making transactions to receive personalized AI recommendations!
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {insights.map((insight, index) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`border ${getTypeColor(insight.type)} p-4 backdrop-blur-xl`}
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1">{insight.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-white">{insight.title}</h4>
                          {getTypeBadge(insight.type)}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDismiss(insight.id)}
                          className="text-white/40 hover:text-white/60 h-6 px-2 text-xs"
                        >
                          Dismiss
                        </Button>
                      </div>
                      <p className="text-white/70 text-sm">{insight.description}</p>

                      {insight.impact && (
                        <div className="mt-2 flex items-center gap-2 text-sm">
                          <Lightbulb className="size-4 text-amber-400" />
                          <span className="text-amber-200">{insight.impact}</span>
                        </div>
                      )}

                      {insight.action && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-3 border-white/20 text-white hover:bg-white/10"
                        >
                          {insight.action}
                          <ArrowRight className="size-3 ml-2" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Quick Stats */}
      <Card className="border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
          <TrendingUp className="size-4 text-green-400" />
          Quick Financial Health Check
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{formatCurrency(balance)}</div>
            <p className="text-xs text-white/60">Current Balance</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {transactions.filter(
                (tx) => tx.to_account_id === currentUser?.account.id
              ).length}
            </div>
            <p className="text-xs text-white/60">Deposits This Month</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-400">{insights.length}</div>
            <p className="text-xs text-white/60">Active Insights</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
