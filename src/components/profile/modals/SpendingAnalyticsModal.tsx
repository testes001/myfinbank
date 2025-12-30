import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PieChart, TrendingUp, Download, Calendar } from "lucide-react";
import { motion } from "framer-motion";

interface SpendingAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  spendingData: Array<{ category: string; amount: number; percentage: number }>;
}

export default function SpendingAnalyticsModal({ isOpen, onClose, spendingData }: SpendingAnalyticsModalProps) {
  const totalSpending = spendingData.reduce((sum, item) => sum + item.amount, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-white/10 bg-gradient-to-br from-slate-900 via-cyan-900/20 to-slate-900 backdrop-blur-xl sm:max-w-[700px] max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <div className="flex size-10 items-center justify-center rounded-full bg-cyan-500/20">
              <PieChart className="size-5 text-cyan-400" />
            </div>
            Spending Analytics
          </DialogTitle>
          <DialogDescription className="text-white/60 flex items-center justify-between">
            <span>Detailed breakdown of your spending</span>
            <Button size="sm" variant="ghost" className="text-cyan-400 hover:bg-cyan-500/10"><Download className="mr-2 size-3" />Export</Button>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 overflow-y-auto max-h-[calc(85vh-180px)] pr-2">
          <div className="rounded-lg bg-gradient-to-br from-cyan-500/10 to-blue-500/10 p-6 border border-cyan-500/20">
            <div className="flex items-center justify-between">
              <div><p className="text-sm text-white/60">Total Spending</p><p className="text-3xl font-bold text-white">${totalSpending.toLocaleString()}</p></div>
              <div className="flex size-20 items-center justify-center rounded-full bg-cyan-500/20"><PieChart className="size-10 text-cyan-400" /></div>
            </div>
          </div>
          <div className="rounded-lg bg-white/5 p-6 border border-white/10"><h4 className="text-sm font-medium text-white/80 mb-4 flex items-center gap-2"><Calendar className="size-4" />This Month by Category</h4><div className="space-y-3">{spendingData.map((item, index) => (<motion.div key={item.category} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="space-y-2"><div className="flex items-center justify-between text-sm"><span className="text-white/80">{item.category}</span><div className="flex items-center gap-2"><Badge className="bg-white/10 text-white text-xs">{item.percentage}%</Badge><span className="font-medium text-white">${item.amount.toLocaleString()}</span></div></div><div className="relative h-2 overflow-hidden rounded-full bg-white/10"><motion.div initial={{ width: 0 }} animate={{ width: `${item.percentage}%` }} transition={{ delay: index * 0.05 + 0.2, duration: 0.5 }} className="h-full bg-gradient-to-r from-cyan-500 to-blue-500" /></div></motion.div>))}</div></div>
          <div className="rounded-lg bg-blue-500/10 p-4 border border-blue-500/20"><div className="flex items-center gap-2 text-blue-400 mb-2"><TrendingUp className="size-4" /><p className="text-sm font-medium">Insights</p></div><ul className="space-y-1 text-sm text-white/70"><li>• Your spending increased by 12% compared to last month</li><li>• {spendingData[0]?.category || "Groceries"} is your largest expense category</li><li>• Consider setting a budget for your top 3 categories</li></ul></div>
        </div>
        <DialogFooter><Button onClick={onClose} className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20">Close</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
