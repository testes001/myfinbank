import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Target,
  Plus,
  Sparkles,
  Trophy,
  Flame,
  Star,
  TrendingUp,
  Plane,
  Home,
  Car,
  GraduationCap,
  Gift,
  ShoppingBag,
  Umbrella,
  Heart,
  Zap,
  CheckCircle2,
  Edit,
  Trash2,
  ArrowUpRight,
  Calendar,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/transactions";

// Goal categories with icons and colors
const GOAL_CATEGORIES = [
  { id: "vacation", name: "Vacation", icon: Plane, color: "from-blue-500 to-cyan-500" },
  { id: "home", name: "Home", icon: Home, color: "from-amber-500 to-orange-500" },
  { id: "car", name: "Car", icon: Car, color: "from-red-500 to-pink-500" },
  { id: "education", name: "Education", icon: GraduationCap, color: "from-purple-500 to-violet-500" },
  { id: "gift", name: "Gift", icon: Gift, color: "from-pink-500 to-rose-500" },
  { id: "shopping", name: "Shopping", icon: ShoppingBag, color: "from-green-500 to-emerald-500" },
  { id: "emergency", name: "Emergency Fund", icon: Umbrella, color: "from-slate-500 to-gray-600" },
  { id: "health", name: "Health", icon: Heart, color: "from-red-400 to-rose-500" },
  { id: "other", name: "Other", icon: Star, color: "from-indigo-500 to-blue-500" },
];

// Achievement badges
const ACHIEVEMENTS = [
  { id: "first_goal", name: "Goal Setter", description: "Created your first savings goal", icon: Target },
  { id: "streak_7", name: "Week Warrior", description: "7-day saving streak", icon: Flame },
  { id: "streak_30", name: "Monthly Master", description: "30-day saving streak", icon: Trophy },
  { id: "goal_50", name: "Halfway There", description: "Reached 50% of a goal", icon: TrendingUp },
  { id: "goal_complete", name: "Goal Crusher", description: "Completed a savings goal", icon: Sparkles },
  { id: "five_goals", name: "Ambitious", description: "Created 5 savings goals", icon: Star },
];

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  category: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  autoSaveAmount?: number;
  autoSaveFrequency?: "daily" | "weekly" | "monthly";
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  streakDays: number;
  lastContribution?: string;
}

const GOALS_STORAGE_KEY = "finbank_savings_goals";

// Storage functions
function getGoals(userId: string): SavingsGoal[] {
  try {
    const stored = localStorage.getItem(GOALS_STORAGE_KEY);
    if (!stored) return [];
    const allGoals: Record<string, SavingsGoal[]> = JSON.parse(stored);
    return allGoals[userId] || [];
  } catch {
    return [];
  }
}

function saveGoals(userId: string, goals: SavingsGoal[]): void {
  try {
    const stored = localStorage.getItem(GOALS_STORAGE_KEY);
    const allGoals: Record<string, SavingsGoal[]> = stored ? JSON.parse(stored) : {};
    allGoals[userId] = goals;
    localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(allGoals));
  } catch (error) {
    console.error("Failed to save goals:", error);
  }
}

interface SavingsGoalsProps {
  compact?: boolean;
}

export function SavingsGoals({ compact = false }: SavingsGoalsProps) {
  const { currentUser } = useAuth();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showContributeModal, setShowContributeModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<SavingsGoal | null>(null);
  const [showAchievements, setShowAchievements] = useState(false);
  const [earnedAchievements, setEarnedAchievements] = useState<string[]>([]);

  // Form state for creating goals
  const [newGoal, setNewGoal] = useState({
    name: "",
    category: "",
    targetAmount: "",
    deadline: "",
    autoSaveAmount: "",
    autoSaveFrequency: "" as "" | "daily" | "weekly" | "monthly",
  });

  // Contribution amount
  const [contributeAmount, setContributeAmount] = useState("");

  // Load goals on mount
  useEffect(() => {
    if (currentUser) {
      const userGoals = getGoals(currentUser.user.id);
      setGoals(userGoals);
      checkAchievements(userGoals);
    }
  }, [currentUser]);

  const checkAchievements = (userGoals: SavingsGoal[]) => {
    const achievements: string[] = [];

    // First goal achievement
    if (userGoals.length >= 1) achievements.push("first_goal");
    if (userGoals.length >= 5) achievements.push("five_goals");

    // Check for completed goals
    if (userGoals.some((g) => g.completedAt)) achievements.push("goal_complete");

    // Check for 50% progress
    if (userGoals.some((g) => g.currentAmount >= g.targetAmount * 0.5)) {
      achievements.push("goal_50");
    }

    // Check for streaks
    const maxStreak = Math.max(...userGoals.map((g) => g.streakDays), 0);
    if (maxStreak >= 7) achievements.push("streak_7");
    if (maxStreak >= 30) achievements.push("streak_30");

    setEarnedAchievements(achievements);
  };

  const handleCreateGoal = () => {
    if (!currentUser) return;
    if (!newGoal.name || !newGoal.category || !newGoal.targetAmount) {
      toast.error("Please fill in all required fields");
      return;
    }

    const goal: SavingsGoal = {
      id: `goal_${Date.now()}`,
      userId: currentUser.user.id,
      name: newGoal.name,
      category: newGoal.category,
      targetAmount: parseFloat(newGoal.targetAmount),
      currentAmount: 0,
      deadline: newGoal.deadline || undefined,
      autoSaveAmount: newGoal.autoSaveAmount ? parseFloat(newGoal.autoSaveAmount) : undefined,
      autoSaveFrequency: newGoal.autoSaveFrequency || undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      streakDays: 0,
    };

    const updatedGoals = [...goals, goal];
    setGoals(updatedGoals);
    saveGoals(currentUser.user.id, updatedGoals);
    checkAchievements(updatedGoals);

    setNewGoal({
      name: "",
      category: "",
      targetAmount: "",
      deadline: "",
      autoSaveAmount: "",
      autoSaveFrequency: "",
    });
    setShowCreateModal(false);
    toast.success("Savings goal created!");

    // Check for first goal achievement
    if (updatedGoals.length === 1) {
      setTimeout(() => {
        toast.success("Achievement Unlocked: Goal Setter!", {
          icon: <Trophy className="size-5 text-amber-400" />,
        });
      }, 500);
    }
  };

  const handleContribute = () => {
    if (!currentUser || !selectedGoal) return;
    const amount = parseFloat(contributeAmount);

    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const updatedGoals = goals.map((g) => {
      if (g.id === selectedGoal.id) {
        const newAmount = Math.min(g.currentAmount + amount, g.targetAmount);
        const isComplete = newAmount >= g.targetAmount;

        // Update streak
        const lastContrib = g.lastContribution ? new Date(g.lastContribution) : null;
        const now = new Date();
        let newStreak = g.streakDays;

        if (lastContrib) {
          const daysDiff = Math.floor(
            (now.getTime() - lastContrib.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysDiff === 1) {
            newStreak += 1;
          } else if (daysDiff > 1) {
            newStreak = 1;
          }
        } else {
          newStreak = 1;
        }

        return {
          ...g,
          currentAmount: newAmount,
          updatedAt: now.toISOString(),
          completedAt: isComplete ? now.toISOString() : undefined,
          streakDays: newStreak,
          lastContribution: now.toISOString(),
        };
      }
      return g;
    });

    setGoals(updatedGoals);
    saveGoals(currentUser.user.id, updatedGoals);
    checkAchievements(updatedGoals);

    const updatedGoal = updatedGoals.find((g) => g.id === selectedGoal.id);
    if (updatedGoal && updatedGoal.completedAt && !selectedGoal.completedAt) {
      toast.success("Congratulations! Goal completed!", {
        icon: <Sparkles className="size-5 text-amber-400" />,
      });
    } else {
      toast.success(`Added ${formatCurrency(amount)} to ${selectedGoal.name}`);
    }

    setContributeAmount("");
    setShowContributeModal(false);
    setSelectedGoal(null);
  };

  const handleDeleteGoal = (goalId: string) => {
    if (!currentUser) return;
    const updatedGoals = goals.filter((g) => g.id !== goalId);
    setGoals(updatedGoals);
    saveGoals(currentUser.user.id, updatedGoals);
    toast.success("Goal deleted");
  };

  const getCategoryInfo = (categoryId: string) => {
    return GOAL_CATEGORIES.find((c) => c.id === categoryId) || GOAL_CATEGORIES[8];
  };

  const totalSaved = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const totalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  if (compact) {
    // Compact view for dashboard
    return (
      <Card className="border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="size-5 text-green-400" />
            <h3 className="font-semibold text-white">Savings Goals</h3>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowCreateModal(true)}
            className="text-blue-400 hover:bg-blue-500/20 h-7 px-2"
          >
            <Plus className="size-4" />
          </Button>
        </div>

        {goals.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-white/60 text-sm mb-2">No savings goals yet</p>
            <Button
              size="sm"
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-500"
            >
              <Plus className="size-4 mr-1" />
              Create Goal
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {goals.slice(0, 2).map((goal) => {
              const category = getCategoryInfo(goal.category);
              const progress = (goal.currentAmount / goal.targetAmount) * 100;
              const Icon = category.icon;

              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`size-8 rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center`}
                      >
                        <Icon className="size-4 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{goal.name}</p>
                        <p className="text-xs text-white/60">
                          {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                        </p>
                      </div>
                    </div>
                    {goal.streakDays > 0 && (
                      <Badge className="bg-amber-500/20 text-amber-400 text-xs">
                        <Flame className="size-3 mr-1" />
                        {goal.streakDays}
                      </Badge>
                    )}
                  </div>
                  <div className="relative">
                    <Progress value={progress} className="h-2" />
                    {goal.completedAt && (
                      <div className="absolute right-0 -top-1">
                        <CheckCircle2 className="size-4 text-green-400" />
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
            {goals.length > 2 && (
              <p className="text-xs text-white/40 text-center">
                +{goals.length - 2} more goals
              </p>
            )}
          </div>
        )}

        {/* Create Goal Modal */}
        <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
          <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Target className="size-5 text-green-400" />
                Create Savings Goal
              </DialogTitle>
              <DialogDescription className="text-white/60">
                Set a goal and track your progress
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-white/80">Goal Name</Label>
                <Input
                  value={newGoal.name}
                  onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                  placeholder="e.g., Summer Vacation"
                  className="mt-1 bg-white/10 border-white/20 text-white"
                />
              </div>
              <div>
                <Label className="text-white/80">Category</Label>
                <Select
                  value={newGoal.category}
                  onValueChange={(value) => setNewGoal({ ...newGoal, category: value })}
                >
                  <SelectTrigger className="mt-1 bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20">
                    {GOAL_CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <SelectItem key={cat.id} value={cat.id} className="text-white">
                          <div className="flex items-center gap-2">
                            <Icon className="size-4" />
                            {cat.name}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white/80">Target Amount</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">$</span>
                  <Input
                    type="number"
                    value={newGoal.targetAmount}
                    onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                    placeholder="1000"
                    className="pl-7 bg-white/10 border-white/20 text-white"
                  />
                </div>
              </div>
              <div>
                <Label className="text-white/80">Target Date (Optional)</Label>
                <Input
                  type="date"
                  value={newGoal.deadline}
                  onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                  className="mt-1 bg-white/10 border-white/20 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-white/80">Auto-Save Amount</Label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">$</span>
                    <Input
                      type="number"
                      value={newGoal.autoSaveAmount}
                      onChange={(e) => setNewGoal({ ...newGoal, autoSaveAmount: e.target.value })}
                      placeholder="50"
                      className="pl-7 bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-white/80">Frequency</Label>
                  <Select
                    value={newGoal.autoSaveFrequency}
                    onValueChange={(value) =>
                      setNewGoal({
                        ...newGoal,
                        autoSaveFrequency: value as "" | "daily" | "weekly" | "monthly",
                      })
                    }
                  >
                    <SelectTrigger className="mt-1 bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/20">
                      <SelectItem value="daily" className="text-white">Daily</SelectItem>
                      <SelectItem value="weekly" className="text-white">Weekly</SelectItem>
                      <SelectItem value="monthly" className="text-white">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateGoal}
                className="bg-gradient-to-r from-green-500 to-emerald-500"
              >
                Create Goal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    );
  }

  // Full view
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Target className="size-6 text-green-400" />
            Savings Goals
          </h2>
          <p className="text-white/60 text-sm">Track your progress and earn achievements</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowAchievements(true)}
            className="border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
          >
            <Trophy className="size-4 mr-1" />
            {earnedAchievements.length}
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-green-500 to-emerald-500"
          >
            <Plus className="size-4 mr-1" />
            New Goal
          </Button>
        </div>
      </div>

      {/* Overall Progress */}
      {goals.length > 0 && (
        <Card className="border-white/10 bg-gradient-to-br from-green-500/20 to-emerald-500/20 p-4 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-white/60 text-sm">Total Saved</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(totalSaved)}</p>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-sm">Overall Target</p>
              <p className="text-2xl font-bold text-white">{formatCurrency(totalTarget)}</p>
            </div>
          </div>
          <Progress value={overallProgress} className="h-3" />
          <p className="text-center text-sm text-white/60 mt-2">
            {overallProgress.toFixed(1)}% of total goals
          </p>
        </Card>
      )}

      {/* Goals List */}
      {goals.length === 0 ? (
        <Card className="border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
          <Target className="size-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No savings goals yet</h3>
          <p className="text-white/60 mb-4">
            Start saving towards something meaningful. Create your first goal!
          </p>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-green-500 to-emerald-500"
          >
            <Plus className="size-4 mr-1" />
            Create Your First Goal
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <AnimatePresence>
            {goals.map((goal) => {
              const category = getCategoryInfo(goal.category);
              const progress = (goal.currentAmount / goal.targetAmount) * 100;
              const Icon = category.icon;
              const daysRemaining = goal.deadline
                ? Math.max(
                    0,
                    Math.ceil(
                      (new Date(goal.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                    )
                  )
                : null;

              return (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  layout
                >
                  <Card
                    className={`border-white/10 bg-white/5 p-4 backdrop-blur-xl ${
                      goal.completedAt ? "ring-2 ring-green-500/50" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`size-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center`}
                        >
                          <Icon className="size-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{goal.name}</h3>
                          <p className="text-sm text-white/60">{category.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {goal.streakDays > 0 && (
                          <Badge className="bg-amber-500/20 text-amber-400">
                            <Flame className="size-3 mr-1" />
                            {goal.streakDays} days
                          </Badge>
                        )}
                        {goal.completedAt && (
                          <Badge className="bg-green-500/20 text-green-400">
                            <CheckCircle2 className="size-3 mr-1" />
                            Complete
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-white/60">Progress</span>
                        <span className="text-white font-medium">
                          {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                        </span>
                      </div>
                      <div className="relative">
                        <Progress value={progress} className="h-3" />
                        <span className="absolute right-0 -bottom-5 text-xs text-white/40">
                          {progress.toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm mt-6">
                      {daysRemaining !== null && (
                        <div className="flex items-center gap-1 text-white/60">
                          <Calendar className="size-4" />
                          {daysRemaining > 0
                            ? `${daysRemaining} days left`
                            : daysRemaining === 0
                            ? "Due today"
                            : "Overdue"}
                        </div>
                      )}
                      {goal.autoSaveAmount && (
                        <div className="flex items-center gap-1 text-white/60">
                          <Zap className="size-4" />
                          {formatCurrency(goal.autoSaveAmount)}/{goal.autoSaveFrequency}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedGoal(goal);
                          setShowContributeModal(true);
                        }}
                        disabled={!!goal.completedAt}
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500"
                      >
                        <ArrowUpRight className="size-4 mr-1" />
                        Add Funds
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/20"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Create Goal Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="size-5 text-green-400" />
              Create Savings Goal
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Set a goal and track your progress with gamification
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-white/80">Goal Name</Label>
              <Input
                value={newGoal.name}
                onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                placeholder="e.g., Summer Vacation"
                className="mt-1 bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label className="text-white/80">Category</Label>
              <Select
                value={newGoal.category}
                onValueChange={(value) => setNewGoal({ ...newGoal, category: value })}
              >
                <SelectTrigger className="mt-1 bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-white/20">
                  {GOAL_CATEGORIES.map((cat) => {
                    const CatIcon = cat.icon;
                    return (
                      <SelectItem key={cat.id} value={cat.id} className="text-white">
                        <div className="flex items-center gap-2">
                          <CatIcon className="size-4" />
                          {cat.name}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-white/80">Target Amount</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">$</span>
                <Input
                  type="number"
                  value={newGoal.targetAmount}
                  onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                  placeholder="1000"
                  className="pl-7 bg-white/10 border-white/20 text-white"
                />
              </div>
            </div>
            <div>
              <Label className="text-white/80">Target Date (Optional)</Label>
              <Input
                type="date"
                value={newGoal.deadline}
                onChange={(e) => setNewGoal({ ...newGoal, deadline: e.target.value })}
                className="mt-1 bg-white/10 border-white/20 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-white/80">Auto-Save Amount</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">$</span>
                  <Input
                    type="number"
                    value={newGoal.autoSaveAmount}
                    onChange={(e) => setNewGoal({ ...newGoal, autoSaveAmount: e.target.value })}
                    placeholder="50"
                    className="pl-7 bg-white/10 border-white/20 text-white"
                  />
                </div>
              </div>
              <div>
                <Label className="text-white/80">Frequency</Label>
                <Select
                  value={newGoal.autoSaveFrequency}
                  onValueChange={(value) =>
                    setNewGoal({
                      ...newGoal,
                      autoSaveFrequency: value as "" | "daily" | "weekly" | "monthly",
                    })
                  }
                >
                  <SelectTrigger className="mt-1 bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20">
                    <SelectItem value="daily" className="text-white">Daily</SelectItem>
                    <SelectItem value="weekly" className="text-white">Weekly</SelectItem>
                    <SelectItem value="monthly" className="text-white">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateGoal}
              className="bg-gradient-to-r from-green-500 to-emerald-500"
            >
              Create Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contribute Modal */}
      <Dialog open={showContributeModal} onOpenChange={setShowContributeModal}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="size-5 text-green-400" />
              Add to {selectedGoal?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedGoal && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-white/60 text-sm">Current Progress</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(selectedGoal.currentAmount)} /{" "}
                  {formatCurrency(selectedGoal.targetAmount)}
                </p>
                <Progress
                  value={(selectedGoal.currentAmount / selectedGoal.targetAmount) * 100}
                  className="h-2 mt-2"
                />
              </div>
              <div>
                <Label className="text-white/80">Amount to Add</Label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">$</span>
                  <Input
                    type="number"
                    value={contributeAmount}
                    onChange={(e) => setContributeAmount(e.target.value)}
                    placeholder="100"
                    className="pl-7 bg-white/10 border-white/20 text-white text-center text-xl"
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex gap-2">
                {[25, 50, 100, 250].map((amount) => (
                  <Button
                    key={amount}
                    size="sm"
                    variant="outline"
                    onClick={() => setContributeAmount(amount.toString())}
                    className="flex-1 border-white/20 text-white hover:bg-white/10"
                  >
                    ${amount}
                  </Button>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowContributeModal(false);
                setSelectedGoal(null);
                setContributeAmount("");
              }}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleContribute}
              className="bg-gradient-to-r from-green-500 to-emerald-500"
            >
              Add Funds
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Achievements Modal */}
      <Dialog open={showAchievements} onOpenChange={setShowAchievements}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="size-5 text-amber-400" />
              Achievements
            </DialogTitle>
            <DialogDescription className="text-white/60">
              {earnedAchievements.length} of {ACHIEVEMENTS.length} unlocked
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {ACHIEVEMENTS.map((achievement) => {
              const isEarned = earnedAchievements.includes(achievement.id);
              const AchIcon = achievement.icon;

              return (
                <div
                  key={achievement.id}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    isEarned
                      ? "bg-amber-500/20 border border-amber-500/30"
                      : "bg-white/5 border border-white/10 opacity-50"
                  }`}
                >
                  <div
                    className={`size-10 rounded-full flex items-center justify-center ${
                      isEarned ? "bg-amber-500" : "bg-white/10"
                    }`}
                  >
                    <AchIcon className={`size-5 ${isEarned ? "text-white" : "text-white/40"}`} />
                  </div>
                  <div className="flex-1">
                    <p className={`font-medium ${isEarned ? "text-white" : "text-white/60"}`}>
                      {achievement.name}
                    </p>
                    <p className="text-sm text-white/40">{achievement.description}</p>
                  </div>
                  {isEarned && <CheckCircle2 className="size-5 text-amber-400" />}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
