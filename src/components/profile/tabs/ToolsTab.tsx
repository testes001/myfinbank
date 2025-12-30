import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  TrendingUp,
  PieChart,
  Target,
  Award,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronRight,
  Download,
  Calendar,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface SpendingData {
  category: string;
  amount: number;
  percentage: number;
}

interface Budget {
  category: string;
  limit: number;
  spent: number;
  percentage: number;
}

interface CreditScore {
  score: number;
  rating: string;
  factors: string[];
  lastUpdated: string;
}

interface ToolsTabProps {
  creditScore: CreditScore;
  showCreditScore: boolean;
  spendingData: SpendingData[];
  budgets: Budget[];
  onToggleCreditScore: () => void;
  onOpenCreditScoreModal: () => void;
  onOpenSpendingAnalyticsModal: () => void;
  onOpenBudgetingModal: () => void;
}

export function ToolsTab({
  creditScore,
  showCreditScore,
  spendingData,
  budgets,
  onToggleCreditScore,
  onOpenCreditScoreModal,
  onOpenSpendingAnalyticsModal,
  onOpenBudgetingModal,
}: ToolsTabProps) {
  const getCreditScoreColor = (score: number) => {
    if (score >= 750) return "text-green-400";
    if (score >= 670) return "text-blue-400";
    if (score >= 580) return "text-amber-400";
    return "text-red-400";
  };

  const getCreditScoreGradient = (score: number) => {
    if (score >= 750) return "from-green-500 to-emerald-500";
    if (score >= 670) return "from-blue-500 to-cyan-500";
    if (score >= 580) return "from-amber-500 to-orange-500";
    return "from-red-500 to-rose-500";
  };

  const handleExportSpending = () => {
    toast.success("Spending report exported successfully");
  };

  const handleExportBudgets = () => {
    toast.success("Budget report exported successfully");
  };

  const totalSpending = spendingData.reduce((sum, item) => sum + item.amount, 0);
  const overBudgetCount = budgets.filter((b) => b.percentage > 100).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Credit Score */}
      <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-purple-500/20">
              <Award className="size-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Credit Score</h3>
              <p className="text-sm text-white/60">
                Last updated: {creditScore.lastUpdated}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={onToggleCreditScore}
            className="text-white/60 hover:bg-white/10"
          >
            {showCreditScore ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </Button>
        </div>

        <div
          className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${getCreditScoreGradient(creditScore.score)} p-6`}
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/80">
                  Your Credit Score
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  {showCreditScore ? (
                    <>
                      <span
                        className={`text-5xl font-bold text-white`}
                      >
                        {creditScore.score}
                      </span>
                      <span className="text-xl text-white/80">/850</span>
                    </>
                  ) : (
                    <span className="text-5xl font-bold text-white">•••</span>
                  )}
                </div>
                <Badge className="mt-2 bg-white/20 text-white">
                  {creditScore.rating}
                </Badge>
              </div>
              <div className="flex size-24 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                <Award className="size-12 text-white" />
              </div>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        <div className="mt-4 space-y-2">
          <Button
            onClick={onOpenCreditScoreModal}
            variant="outline"
            className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20 justify-between"
          >
            <span>View Detailed Report</span>
            <ChevronRight className="size-4" />
          </Button>
          <Alert className="bg-blue-500/10 border-blue-500/20">
            <Sparkles className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-200 text-sm">
              Your credit score has improved by 15 points this month. Keep up
              the good work!
            </AlertDescription>
          </Alert>
        </div>
      </Card>

      {/* Spending Analytics */}
      <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-cyan-500/20">
              <PieChart className="size-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Spending Analytics
              </h3>
              <p className="text-sm text-white/60">
                This month: ${totalSpending.toLocaleString()}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportSpending}
            className="border-white/20 bg-white/10 text-white hover:bg-white/20"
          >
            <Download className="mr-2 size-3" />
            Export
          </Button>
        </div>

        <div className="space-y-3">
          {spendingData.slice(0, 5).map((item, index) => (
            <motion.div
              key={item.category}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/80">{item.category}</span>
                <span className="font-medium text-white">
                  ${item.amount.toLocaleString()}
                </span>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.percentage}%` }}
                  transition={{ delay: index * 0.05 + 0.2, duration: 0.5 }}
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
                />
              </div>
            </motion.div>
          ))}
        </div>

        <Button
          onClick={onOpenSpendingAnalyticsModal}
          variant="outline"
          className="mt-4 w-full border-white/20 bg-white/10 text-white hover:bg-white/20 justify-between"
        >
          <span>View Full Analytics</span>
          <ChevronRight className="size-4" />
        </Button>
      </Card>

      {/* Budget Tracking */}
      <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/20">
              <Target className="size-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Budget Tracking
              </h3>
              <p className="text-sm text-white/60">
                {budgets.length} active {budgets.length === 1 ? "budget" : "budgets"}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleExportBudgets}
              className="border-white/20 bg-white/10 text-white hover:bg-white/20"
            >
              <Download className="size-3" />
            </Button>
            <Button
              size="sm"
              onClick={onOpenBudgetingModal}
              className="bg-amber-500 hover:bg-amber-600 text-white"
            >
              Manage
            </Button>
          </div>
        </div>

        {overBudgetCount > 0 && (
          <Alert className="mb-4 bg-red-500/10 border-red-500/20">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-200 text-sm">
              {overBudgetCount} {overBudgetCount === 1 ? "budget is" : "budgets are"} over
              limit this month. Review your spending to stay on track.
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {budgets.map((budget, index) => (
            <motion.div
              key={budget.category}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`rounded-lg p-4 border ${
                budget.percentage > 100
                  ? "bg-red-500/5 border-red-500/20"
                  : budget.percentage > 80
                    ? "bg-amber-500/5 border-amber-500/20"
                    : "bg-white/5 border-white/10"
              }`}
            >
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-white">{budget.category}</h4>
                  <p className="text-sm text-white/60">
                    ${budget.spent.toLocaleString()} of $
                    {budget.limit.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <Badge
                    className={
                      budget.percentage > 100
                        ? "bg-red-500/20 text-red-400"
                        : budget.percentage > 80
                          ? "bg-amber-500/20 text-amber-400"
                          : "bg-green-500/20 text-green-400"
                    }
                  >
                    {budget.percentage}%
                  </Badge>
                </div>
              </div>
              <Progress
                value={Math.min(budget.percentage, 100)}
                className="h-2"
              />
              {budget.percentage > 100 && (
                <p className="mt-2 text-xs text-red-400">
                  ${(budget.spent - budget.limit).toLocaleString()} over budget
                </p>
              )}
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Monthly Summary */}
      <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-indigo-500/20">
            <Calendar className="size-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              This Month's Summary
            </h3>
            <p className="text-sm text-white/60">Financial overview</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-white/5 p-4 border border-white/10">
            <div className="flex items-center gap-2 text-sm text-white/60 mb-1">
              <DollarSign className="size-4" />
              <span>Total Spending</span>
            </div>
            <p className="text-2xl font-bold text-white">
              ${totalSpending.toLocaleString()}
            </p>
            <div className="mt-2 flex items-center gap-1 text-xs text-red-400">
              <ArrowUp className="size-3" />
              <span>12% vs last month</span>
            </div>
          </div>

          <div className="rounded-lg bg-white/5 p-4 border border-white/10">
            <div className="flex items-center gap-2 text-sm text-white/60 mb-1">
              <Target className="size-4" />
              <span>Budget Used</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {Math.round(
                (budgets.reduce((sum, b) => sum + b.spent, 0) /
                  budgets.reduce((sum, b) => sum + b.limit, 0)) *
                  100
              )}
              %
            </p>
            <div className="mt-2 flex items-center gap-1 text-xs text-green-400">
              <ArrowDown className="size-3" />
              <span>5% vs last month</span>
            </div>
          </div>

          <div className="rounded-lg bg-white/5 p-4 border border-white/10">
            <div className="flex items-center gap-2 text-sm text-white/60 mb-1">
              <TrendingUp className="size-4" />
              <span>Largest Category</span>
            </div>
            <p className="text-lg font-bold text-white">
              {spendingData[0]?.category || "N/A"}
            </p>
            <p className="mt-1 text-xs text-white/60">
              ${spendingData[0]?.amount.toLocaleString() || 0}
            </p>
          </div>

          <div className="rounded-lg bg-white/5 p-4 border border-white/10">
            <div className="flex items-center gap-2 text-sm text-white/60 mb-1">
              <AlertCircle className="size-4" />
              <span>Over Budget</span>
            </div>
            <p className="text-2xl font-bold text-white">{overBudgetCount}</p>
            <p className="mt-1 text-xs text-white/60">
              {overBudgetCount === 0 ? "Great job!" : "Needs attention"}
            </p>
          </div>
        </div>
      </Card>

      {/* Financial Tips */}
      <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-3">
          <Sparkles className="size-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Financial Tips</h3>
        </div>
        <ul className="space-y-2 text-sm text-white/60">
          {overBudgetCount > 0 && (
            <li className="flex items-start gap-2">
              <span className="mt-1 size-1.5 rounded-full bg-red-400" />
              <span>
                Review your {overBudgetCount > 1 ? "over-budget categories" : "over-budget category"} and adjust your spending habits
              </span>
            </li>
          )}
          {creditScore.score < 750 && (
            <li className="flex items-start gap-2">
              <span className="mt-1 size-1.5 rounded-full bg-amber-400" />
              <span>
                Pay bills on time and keep credit utilization below 30% to improve your score
              </span>
            </li>
          )}
          <li className="flex items-start gap-2">
            <span className="mt-1 size-1.5 rounded-full bg-blue-400" />
            <span>Set up automatic savings transfers on payday</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 size-1.5 rounded-full bg-blue-400" />
            <span>Review your spending analytics monthly to identify trends</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 size-1.5 rounded-full bg-blue-400" />
            <span>
              Consider the 50/30/20 rule: 50% needs, 30% wants, 20% savings
            </span>
          </li>
        </ul>
      </Card>
    </motion.div>
  );
}
