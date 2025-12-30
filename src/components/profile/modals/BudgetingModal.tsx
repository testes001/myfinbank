import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface Budget {
  category: string;
  limit: number;
  spent: number;
  percentage: number;
}

interface BudgetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgets: Budget[];
  onAddBudget?: (category: string, limit: number) => Promise<void>;
  onRemoveBudget?: (category: string) => Promise<void>;
}

export default function BudgetingModal({ isOpen, onClose, budgets, onAddBudget, onRemoveBudget }: BudgetingModalProps) {
  const [newCategory, setNewCategory] = useState("");
  const [newLimit, setNewLimit] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (!newCategory || !newLimit) {
      toast.error("Please enter both category and limit");
      return;
    }
    setIsAdding(true);
    try {
      if (onAddBudget) await onAddBudget(newCategory, parseInt(newLimit));
      setNewCategory("");
      setNewLimit("");
      toast.success("Budget added");
    } catch (error) {
      toast.error("Failed to add budget");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-white/10 bg-gradient-to-br from-slate-900 via-amber-900/20 to-slate-900 backdrop-blur-xl sm:max-w-[600px] max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/20">
              <Target className="size-5 text-amber-400" />
            </div>
            Manage Budgets
          </DialogTitle>
          <DialogDescription className="text-white/60">Set spending limits for different categories</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto max-h-[calc(85vh-200px)] pr-2">
          <div className="rounded-lg bg-white/5 p-4 border border-white/10 space-y-3"><h4 className="text-sm font-medium text-white/80 mb-2">Add New Budget</h4><div className="grid grid-cols-3 gap-2"><Input placeholder="Category" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="border-white/10 bg-white/5 text-white placeholder:text-white/40" /><Input type="number" placeholder="Limit" value={newLimit} onChange={(e) => setNewLimit(e.target.value)} className="border-white/10 bg-white/5 text-white placeholder:text-white/40" /><Button onClick={handleAdd} disabled={isAdding} className="bg-amber-500 hover:bg-amber-600 text-white"><Plus className="size-4" /></Button></div></div>
          <div className="space-y-3">{budgets.map((budget) => (<div key={budget.category} className={`rounded-lg p-4 border ${budget.percentage > 100 ? "bg-red-500/5 border-red-500/20" : budget.percentage > 80 ? "bg-amber-500/5 border-amber-500/20" : "bg-white/5 border-white/10"}`}><div className="mb-3 flex items-center justify-between"><div><h4 className="font-medium text-white">{budget.category}</h4><p className="text-sm text-white/60">${budget.spent.toLocaleString()} of ${budget.limit.toLocaleString()}</p></div><div className="flex items-center gap-2"><Badge className={budget.percentage > 100 ? "bg-red-500/20 text-red-400" : budget.percentage > 80 ? "bg-amber-500/20 text-amber-400" : "bg-green-500/20 text-green-400"}>{budget.percentage}%</Badge><Button size="sm" variant="ghost" onClick={() => onRemoveBudget && onRemoveBudget(budget.category)} className="text-red-400 hover:bg-red-500/10"><Trash2 className="size-4" /></Button></div></div><Progress value={Math.min(budget.percentage, 100)} className="h-2" /></div>))}</div>
        </div>
        <DialogFooter><Button onClick={onClose} className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20">Close</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
