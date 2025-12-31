import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  Plus,
  Trash2,
  DollarSign,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
} from "lucide-react";
import { BaseModal, useModalState } from "@/components/ui/base-modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  budgetSchema,
  type BudgetFormData,
  formatZodError,
  getZodErrorMap,
} from "@/lib/validations/profile-schemas";
import { toolsToasts, showError, showSuccess } from "@/lib/toast-messages";

interface Budget {
  category: string;
  limit: number;
  spent: number;
  percentage: number;
  period?: "monthly" | "weekly" | "yearly";
}

interface BudgetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgets: Budget[];
  onAddBudget?: (
    category: string,
    limit: number,
    period?: string,
  ) => Promise<void>;
  onRemoveBudget?: (category: string) => Promise<void>;
}

// Budget category suggestions
const CATEGORY_SUGGESTIONS = [
  "Groceries",
  "Dining Out",
  "Transportation",
  "Entertainment",
  "Shopping",
  "Utilities",
  "Healthcare",
  "Education",
  "Travel",
  "Subscriptions",
];

export default function BudgetingModal({
  isOpen,
  onClose,
  budgets,
  onAddBudget,
  onRemoveBudget,
}: BudgetingModalProps) {
  const [formData, setFormData] = useState<BudgetFormData>({
    category: "",
    limit: 0,
    period: "monthly",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const modalState = useModalState();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        category: "",
        limit: 0,
        period: "monthly",
      });
      setFieldErrors({});
      setShowSuggestions(false);
      modalState.reset();
    }
  }, [isOpen]);

  const handleInputChange = (field: keyof BudgetFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error when user types
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleCategorySelect = (category: string) => {
    setFormData((prev) => ({ ...prev, category }));
    setShowSuggestions(false);
    if (fieldErrors.category) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.category;
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const result = budgetSchema.safeParse(formData);

    if (!result.success) {
      const errors = getZodErrorMap(result.error);
      setFieldErrors(errors);
      showError(formatZodError(result.error));
      return false;
    }

    // Check for duplicate category
    const existingBudget = budgets.find(
      (b) => b.category.toLowerCase() === formData.category.toLowerCase(),
    );
    if (existingBudget) {
      setFieldErrors({ category: "Budget already exists for this category" });
      showError("Budget already exists for this category");
      return false;
    }

    setFieldErrors({});
    return true;
  };

  const handleAddBudget = async () => {
    // Validate form
    if (!validateForm()) {
      return;
    }

    modalState.setSubmitting();

    try {
      if (onAddBudget) {
        await onAddBudget(formData.category, formData.limit, formData.period);
      }

      // Reset form after successful addition
      setFormData({
        category: "",
        limit: 0,
        period: "monthly",
      });

      modalState.setSuccess();
      toolsToasts.budgetAdded(formData.category);

      // Reset to idle after showing success
      setTimeout(() => {
        modalState.reset();
      }, 1500);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to add budget";
      modalState.setError(errorMessage);
    }
  };

  const handleRemoveBudget = async (category: string) => {
    try {
      if (onRemoveBudget) {
        await onRemoveBudget(category);
      }
      toolsToasts.budgetRemoved(category);
    } catch (error) {
      showError("Failed to remove budget");
    }
  };

  const getBudgetStatus = (percentage: number) => {
    if (percentage > 100) {
      return { color: "red", label: "Over Budget", icon: AlertTriangle };
    } else if (percentage > 80) {
      return { color: "amber", label: "Near Limit", icon: AlertTriangle };
    } else {
      return { color: "green", label: "On Track", icon: CheckCircle2 };
    }
  };

  const getTotalBudget = () => {
    return budgets.reduce((sum, budget) => sum + budget.limit, 0);
  };

  const getTotalSpent = () => {
    return budgets.reduce((sum, budget) => sum + budget.spent, 0);
  };

  const getOverallPercentage = () => {
    const total = getTotalBudget();
    if (total === 0) return 0;
    return Math.round((getTotalSpent() / total) * 100);
  };

  const isFormValid = formData.category.trim() && formData.limit > 0;

  const handleClose = () => {
    if (!modalState.isSubmitting) {
      setFormData({
        category: "",
        limit: 0,
        period: "monthly",
      });
      setFieldErrors({});
      setShowSuggestions(false);
      modalState.reset();
      onClose();
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Manage Budgets"
      description="Set spending limits and track your expenses by category"
      icon={Target}
      iconColor="bg-amber-500/20"
      state={modalState.state}
      error={modalState.error}
      size="lg"
      footer={
        <Button
          onClick={handleClose}
          className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
        >
          Close
        </Button>
      }
    >
      <div className="space-y-4 py-4 max-h-[calc(85vh-200px)] overflow-y-auto pr-2">
        {/* Overall Budget Summary */}
        {budgets.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 p-4 border border-amber-500/20"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="size-5 text-amber-400" />
                <h3 className="text-white font-semibold">Overall Budget</h3>
              </div>
              <Badge
                className={`${
                  getOverallPercentage() > 100
                    ? "bg-red-500/20 text-red-400"
                    : getOverallPercentage() > 80
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-green-500/20 text-green-400"
                }`}
              >
                {getOverallPercentage()}%
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Total Spent</span>
                <span className="text-white font-semibold">
                  ${getTotalSpent().toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/60">Total Budget</span>
                <span className="text-white font-semibold">
                  ${getTotalBudget().toLocaleString()}
                </span>
              </div>
              <Progress
                value={Math.min(getOverallPercentage(), 100)}
                className="h-2"
              />
            </div>
          </motion.div>
        )}

        {/* Add New Budget Form */}
        <div className="rounded-lg bg-white/5 p-4 border border-white/10 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Plus className="size-5 text-amber-400" />
            <h4 className="text-sm font-semibold text-white">Add New Budget</h4>
          </div>

          {/* Category Input with Suggestions */}
          <div className="space-y-2 relative">
            <Label htmlFor="category" className="text-white/80">
              <div className="flex items-center gap-2">
                <Target className="size-4 text-amber-400" />
                Category
                <span className="text-red-400">*</span>
              </div>
            </Label>
            <div className="relative">
              <Input
                id="category"
                placeholder="e.g., Groceries, Dining Out"
                value={formData.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                className={`border-white/10 bg-white/5 text-white placeholder:text-white/40 ${
                  fieldErrors.category ? "border-red-500/50" : ""
                }`}
                autoComplete="off"
              />
              {fieldErrors.category && (
                <p className="text-sm text-red-400 mt-1 flex items-center gap-1">
                  {fieldErrors.category}
                </p>
              )}

              {/* Category Suggestions Dropdown */}
              <AnimatePresence>
                {showSuggestions && formData.category.length < 3 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute z-10 w-full mt-1 rounded-lg bg-slate-900 border border-white/10 shadow-lg overflow-hidden"
                  >
                    <div className="p-2 border-b border-white/10">
                      <div className="flex items-center gap-2 text-xs text-white/60">
                        <Sparkles className="size-3 text-amber-400" />
                        <span>Suggested Categories</span>
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {CATEGORY_SUGGESTIONS.filter(
                        (cat) =>
                          !budgets.some(
                            (b) =>
                              b.category.toLowerCase() === cat.toLowerCase(),
                          ),
                      ).map((category) => (
                        <button
                          key={category}
                          onClick={() => handleCategorySelect(category)}
                          className="w-full px-3 py-2 text-left text-sm text-white hover:bg-white/10 transition-colors"
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Limit and Period */}
          <div className="grid grid-cols-2 gap-3">
            {/* Limit Input */}
            <div className="space-y-2">
              <Label htmlFor="limit" className="text-white/80">
                <div className="flex items-center gap-2">
                  <DollarSign className="size-4 text-green-400" />
                  Budget Limit
                  <span className="text-red-400">*</span>
                </div>
              </Label>
              <Input
                id="limit"
                type="number"
                placeholder="0"
                min="0"
                max="1000000"
                value={formData.limit || ""}
                onChange={(e) =>
                  handleInputChange("limit", parseFloat(e.target.value) || 0)
                }
                className={`border-white/10 bg-white/5 text-white placeholder:text-white/40 ${
                  fieldErrors.limit ? "border-red-500/50" : ""
                }`}
              />
              {fieldErrors.limit && (
                <p className="text-sm text-red-400 flex items-center gap-1">
                  {fieldErrors.limit}
                </p>
              )}
            </div>

            {/* Period Selection */}
            <div className="space-y-2">
              <Label htmlFor="period" className="text-white/80">
                Period
              </Label>
              <Select
                value={formData.period}
                onValueChange={(value) => handleInputChange("period", value)}
              >
                <SelectTrigger className="border-white/10 bg-white/5 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Add Button */}
          <Button
            onClick={handleAddBudget}
            disabled={modalState.isSubmitting || !isFormValid}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50"
          >
            <Plus className="mr-2 size-4" />
            Add Budget
          </Button>
        </div>

        {/* Existing Budgets List */}
        {budgets.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="size-5 text-white/80" />
              <h4 className="text-sm font-semibold text-white">
                Your Budgets ({budgets.length})
              </h4>
            </div>

            <AnimatePresence>
              {budgets.map((budget) => {
                const status = getBudgetStatus(budget.percentage);
                const StatusIcon = status.icon;

                return (
                  <motion.div
                    key={budget.category}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={`rounded-lg p-4 border ${
                      status.color === "red"
                        ? "bg-red-500/5 border-red-500/20"
                        : status.color === "amber"
                          ? "bg-amber-500/5 border-amber-500/20"
                          : "bg-white/5 border-white/10"
                    }`}
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-white">
                            {budget.category}
                          </h4>
                          <Badge
                            variant="outline"
                            className="text-xs text-white/60 border-white/20"
                          >
                            {budget.period || "monthly"}
                          </Badge>
                        </div>
                        <p className="text-sm text-white/60">
                          ${budget.spent.toLocaleString()} of $
                          {budget.limit.toLocaleString()}
                        </p>
                        <p className="text-xs text-white/50 mt-1">
                          ${(budget.limit - budget.spent).toLocaleString()}{" "}
                          remaining
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`${
                            status.color === "red"
                              ? "bg-red-500/20 text-red-400"
                              : status.color === "amber"
                                ? "bg-amber-500/20 text-amber-400"
                                : "bg-green-500/20 text-green-400"
                          }`}
                        >
                          <StatusIcon className="size-3 mr-1" />
                          {budget.percentage}%
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveBudget(budget.category)}
                          className="text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                    <Progress
                      value={Math.min(budget.percentage, 100)}
                      className={`h-2 ${
                        status.color === "red"
                          ? "[&>div]:bg-red-500"
                          : status.color === "amber"
                            ? "[&>div]:bg-amber-500"
                            : "[&>div]:bg-green-500"
                      }`}
                    />
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-lg bg-white/5 p-8 border border-white/10 text-center"
          >
            <Target className="size-12 text-white/20 mx-auto mb-3" />
            <h4 className="text-white font-medium mb-2">No Budgets Yet</h4>
            <p className="text-sm text-white/60 mb-4">
              Create your first budget to start tracking your spending
            </p>
          </motion.div>
        )}

        {/* Info Alert */}
        <div className="rounded-lg bg-blue-500/10 p-4 border border-blue-500/20">
          <div className="flex items-start gap-3">
            <Info className="size-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-blue-400 font-semibold text-sm mb-1">
                Budget Tracking Tips
              </h4>
              <ul className="text-blue-200 text-sm space-y-1">
                <li>
                  • Budgets reset automatically at the start of each period
                </li>
                <li>
                  • You'll receive alerts when you reach 80% of your limit
                </li>
                <li>• Track spending in real-time across all your accounts</li>
                <li>• Adjust budgets anytime to match your needs</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
