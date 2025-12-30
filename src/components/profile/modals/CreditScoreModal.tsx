import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Award,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Target,
  Sparkles,
  ArrowUp,
} from "lucide-react";

interface CreditScore {
  score: number;
  rating: string;
  factors: string[];
  lastUpdated: string;
}

interface CreditScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  creditScore: CreditScore;
}

export default function CreditScoreModal({
  isOpen,
  onClose,
  creditScore,
}: CreditScoreModalProps) {
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

  const getScorePercentage = (score: number) => {
    return (score / 850) * 100;
  };

  const scoreRanges = [
    { min: 300, max: 579, label: "Poor", color: "bg-red-500" },
    { min: 580, max: 669, label: "Fair", color: "bg-amber-500" },
    { min: 670, max: 739, label: "Good", color: "bg-blue-500" },
    { min: 740, max: 799, label: "Very Good", color: "bg-cyan-500" },
    { min: 800, max: 850, label: "Excellent", color: "bg-green-500" },
  ];

  const mockFactors = [
    {
      title: "Payment History",
      impact: "Positive",
      description: "You've made all payments on time for the past 24 months",
      icon: CheckCircle2,
      color: "text-green-400",
    },
    {
      title: "Credit Utilization",
      impact: "Neutral",
      description: "You're using 28% of your available credit",
      icon: AlertCircle,
      color: "text-amber-400",
    },
    {
      title: "Credit Age",
      impact: "Positive",
      description: "Your average account age is 7 years",
      icon: CheckCircle2,
      color: "text-green-400",
    },
    {
      title: "Recent Inquiries",
      impact: "Negative",
      description: "You have 3 hard inquiries in the past 6 months",
      icon: XCircle,
      color: "text-red-400",
    },
  ];

  const mockHistory = [
    { month: "Jan", score: 720 },
    { month: "Feb", score: 725 },
    { month: "Mar", score: 728 },
    { month: "Apr", score: 732 },
    { month: "May", score: 735 },
    { month: "Jun", score: creditScore.score },
  ];

  const scoreTrend = creditScore.score - mockHistory[0].score;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-white/10 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 backdrop-blur-xl sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <div className="flex size-10 items-center justify-center rounded-full bg-purple-500/20">
              <Award className="size-5 text-purple-400" />
            </div>
            Credit Score Report
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Detailed analysis of your credit score and factors
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-180px)] pr-2">
          {/* Score Display */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${getCreditScoreGradient(creditScore.score)} p-8`}
          >
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/80">
                    Your Credit Score
                  </p>
                  <div className="mt-2 flex items-baseline gap-3">
                    <span className="text-6xl font-bold text-white">
                      {creditScore.score}
                    </span>
                    <span className="text-2xl text-white/80">/850</span>
                  </div>
                  <Badge className="mt-3 bg-white/20 text-white text-base px-3 py-1">
                    {creditScore.rating}
                  </Badge>
                  <div className="mt-3 flex items-center gap-2 text-sm text-white/80">
                    <Calendar className="size-4" />
                    <span>Updated: {creditScore.lastUpdated}</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex size-28 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
                    <Award className="size-16 text-white" />
                  </div>
                  {scoreTrend !== 0 && (
                    <Badge className="bg-white/20 text-white flex items-center gap-1">
                      {scoreTrend > 0 ? (
                        <>
                          <TrendingUp className="size-3" />
                          <span>+{scoreTrend} pts</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="size-3" />
                          <span>{scoreTrend} pts</span>
                        </>
                      )}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </motion.div>

          {/* Score Range Visualization */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-lg bg-white/5 p-6 border border-white/10"
          >
            <h4 className="text-sm font-medium text-white/80 mb-4">
              Score Range
            </h4>
            <div className="space-y-3">
              <div className="relative h-8 rounded-full overflow-hidden bg-white/5">
                {scoreRanges.map((range, index) => (
                  <div
                    key={range.label}
                    className={`absolute h-full ${range.color}`}
                    style={{
                      left: `${((range.min - 300) / 550) * 100}%`,
                      width: `${((range.max - range.min + 1) / 550) * 100}%`,
                    }}
                  />
                ))}
                <motion.div
                  initial={{ left: 0 }}
                  animate={{ left: `${getScorePercentage(creditScore.score)}%` }}
                  transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
                  className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
                  style={{ marginLeft: "-2px" }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                    <div className="rounded-full bg-white px-2 py-1 text-xs font-bold text-slate-900">
                      {creditScore.score}
                    </div>
                  </div>
                </motion.div>
              </div>
              <div className="flex justify-between text-xs text-white/60">
                <span>300</span>
                <span>850</span>
              </div>
              <div className="grid grid-cols-5 gap-2 mt-4">
                {scoreRanges.map((range) => (
                  <div key={range.label} className="text-center">
                    <div className={`h-2 rounded-full ${range.color} mb-1`} />
                    <p className="text-xs text-white/60">{range.label}</p>
                    <p className="text-xs text-white/40">
                      {range.min}-{range.max}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Score Factors */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-lg bg-white/5 p-6 border border-white/10"
          >
            <h4 className="text-sm font-medium text-white/80 mb-4 flex items-center gap-2">
              <Target className="size-4" />
              Factors Affecting Your Score
            </h4>
            <div className="space-y-3">
              {mockFactors.map((factor, index) => (
                <motion.div
                  key={factor.title}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-start gap-3 rounded-lg bg-white/5 p-3"
                >
                  <factor.icon className={`size-5 ${factor.color} mt-0.5`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-white text-sm">
                        {factor.title}
                      </p>
                      <Badge
                        className={
                          factor.impact === "Positive"
                            ? "bg-green-500/20 text-green-400"
                            : factor.impact === "Negative"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-amber-500/20 text-amber-400"
                        }
                      >
                        {factor.impact}
                      </Badge>
                    </div>
                    <p className="text-xs text-white/60">{factor.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Score History Trend */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-lg bg-white/5 p-6 border border-white/10"
          >
            <h4 className="text-sm font-medium text-white/80 mb-4 flex items-center gap-2">
              <TrendingUp className="size-4" />
              6-Month Trend
            </h4>
            <div className="flex items-end justify-between gap-2 h-32">
              {mockHistory.map((item, index) => {
                const heightPercent = ((item.score - 650) / 200) * 100;
                return (
                  <motion.div
                    key={item.month}
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercent}%` }}
                    transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                    className="flex-1 flex flex-col items-center gap-2"
                  >
                    <div
                      className={`w-full rounded-t-md bg-gradient-to-t ${getCreditScoreGradient(item.score)}`}
                      style={{ height: "100%" }}
                    />
                    <p className="text-xs text-white/60">{item.month}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Tips for Improvement */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-6 border border-blue-500/20"
          >
            <h4 className="text-sm font-medium text-white/80 mb-3 flex items-center gap-2">
              <Sparkles className="size-4 text-blue-400" />
              Ways to Improve Your Score
            </h4>
            <ul className="space-y-2 text-sm text-white/70">
              <li className="flex items-start gap-2">
                <ArrowUp className="size-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Keep your credit utilization below 30%</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowUp className="size-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Always pay your bills on time</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowUp className="size-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Avoid opening too many new accounts at once</span>
              </li>
              <li className="flex items-start gap-2">
                <ArrowUp className="size-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span>Keep old credit accounts open to maintain credit history</span>
              </li>
            </ul>
          </motion.div>

          {/* Info Alert */}
          <Alert className="bg-white/5 border-white/10">
            <AlertCircle className="h-4 w-4 text-white/60" />
            <AlertDescription className="text-white/60 text-sm">
              Your credit score is updated monthly. Check back regularly to track
              your progress and see how your financial habits impact your score.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button
            onClick={onClose}
            className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
