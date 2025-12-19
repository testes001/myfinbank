import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Plus,
  Calendar,
  CheckCircle2,
  Repeat,
  Trash2,
  Edit,
  AlertCircle,
  DollarSign,
  Building,
} from "lucide-react";

interface BillPayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Payee {
  id: string;
  name: string;
  accountNumber: string;
  category: string;
  lastAmount?: number;
}

interface ScheduledPayment {
  id: string;
  payeeId: string;
  payeeName: string;
  amount: number;
  frequency: "once" | "weekly" | "monthly";
  nextDate: string;
  status: "scheduled" | "processing" | "completed" | "failed";
}

const PAYEE_CATEGORIES = [
  "Utilities",
  "Rent/Mortgage",
  "Insurance",
  "Credit Card",
  "Loan",
  "Phone/Internet",
  "Streaming Services",
  "Other",
];

export function BillPayModal({ open, onOpenChange, onSuccess }: BillPayModalProps) {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"pay" | "schedule" | "payees">("pay");

  // Payee management
  const [payees, setPayees] = useState<Payee[]>([
    {
      id: "1",
      name: "City Electric Company",
      accountNumber: "ACC-8472910",
      category: "Utilities",
      lastAmount: 125.50,
    },
    {
      id: "2",
      name: "Metro Water & Sewer",
      accountNumber: "ACC-3948201",
      category: "Utilities",
      lastAmount: 75.00,
    },
    {
      id: "3",
      name: "SafeHome Insurance",
      accountNumber: "POL-8291047",
      category: "Insurance",
      lastAmount: 250.00,
    },
  ]);

  // Scheduled payments
  const [scheduledPayments, setScheduledPayments] = useState<ScheduledPayment[]>([
    {
      id: "sp1",
      payeeId: "1",
      payeeName: "City Electric Company",
      amount: 125.50,
      frequency: "monthly",
      nextDate: "2025-12-20",
      status: "scheduled",
    },
  ]);

  // Form state
  const [selectedPayeeId, setSelectedPayeeId] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState("");
  const [frequency, setFrequency] = useState<"once" | "weekly" | "monthly">("once");
  const [isProcessing, setIsProcessing] = useState(false);

  // Add payee form
  const [newPayeeName, setNewPayeeName] = useState("");
  const [newPayeeAccount, setNewPayeeAccount] = useState("");
  const [newPayeeCategory, setNewPayeeCategory] = useState("");

  const handlePayBill = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPayeeId || !amount || !paymentDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const currentBalance = parseFloat(currentUser?.account.balance || "0");
    if (amountNum > currentBalance) {
      toast.error("Insufficient funds");
      return;
    }

    setIsProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      const payee = payees.find((p) => p.id === selectedPayeeId);

      if (frequency !== "once") {
        // Schedule recurring payment
        const newScheduled: ScheduledPayment = {
          id: `sp${Date.now()}`,
          payeeId: selectedPayeeId,
          payeeName: payee?.name || "",
          amount: amountNum,
          frequency,
          nextDate: paymentDate,
          status: "scheduled",
        };
        setScheduledPayments((prev) => [...prev, newScheduled]);
        toast.success(`Recurring ${frequency} payment scheduled to ${payee?.name}`);
      } else {
        toast.success(`Payment of $${amountNum.toFixed(2)} scheduled to ${payee?.name}`);
      }

      setIsProcessing(false);
      resetPaymentForm();
      onSuccess();
    }, 2000);
  };

  const handleAddPayee = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPayeeName || !newPayeeAccount || !newPayeeCategory) {
      toast.error("Please fill in all payee details");
      return;
    }

    const newPayee: Payee = {
      id: `payee${Date.now()}`,
      name: newPayeeName,
      accountNumber: newPayeeAccount,
      category: newPayeeCategory,
    };

    setPayees((prev) => [...prev, newPayee]);
    toast.success(`Payee "${newPayeeName}" added successfully`);
    resetPayeeForm();
  };

  const handleDeletePayee = (id: string) => {
    const payee = payees.find((p) => p.id === id);
    setPayees((prev) => prev.filter((p) => p.id !== id));
    toast.success(`Payee "${payee?.name}" removed`);
  };

  const handleCancelScheduled = (id: string) => {
    const payment = scheduledPayments.find((p) => p.id === id);
    setScheduledPayments((prev) => prev.filter((p) => p.id !== id));
    toast.success(`Scheduled payment to ${payment?.payeeName} cancelled`);
  };

  const resetPaymentForm = () => {
    setSelectedPayeeId("");
    setAmount("");
    setPaymentDate("");
    setFrequency("once");
  };

  const resetPayeeForm = () => {
    setNewPayeeName("");
    setNewPayeeAccount("");
    setNewPayeeCategory("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-white/20 bg-slate-900/95 text-white backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl text-white">
            <FileText className="mr-2 size-5" />
            Bill Pay & Recurring Payments
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3 bg-white/5">
            <TabsTrigger value="pay" className="data-[state=active]:bg-white/20">
              Pay Bill
            </TabsTrigger>
            <TabsTrigger value="schedule" className="data-[state=active]:bg-white/20">
              Scheduled
            </TabsTrigger>
            <TabsTrigger value="payees" className="data-[state=active]:bg-white/20">
              Payees
            </TabsTrigger>
          </TabsList>

          {/* Pay Bill Tab */}
          <TabsContent value="pay" className="space-y-4">
            <form onSubmit={handlePayBill} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="payee" className="text-white/80">
                  Select Payee
                </Label>
                <Select value={selectedPayeeId} onValueChange={setSelectedPayeeId}>
                  <SelectTrigger className="border-white/20 bg-white/10 text-white">
                    <SelectValue placeholder="Choose a payee" />
                  </SelectTrigger>
                  <SelectContent className="border-white/20 bg-slate-900 text-white">
                    {payees.map((payee) => (
                      <SelectItem key={payee.id} value={payee.id}>
                        <div className="flex items-center gap-2">
                          <Building className="size-4" />
                          {payee.name} - {payee.category}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount" className="text-white/80">
                  Amount
                </Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="border-white/20 bg-white/10 pl-9 text-white placeholder:text-white/40"
                    placeholder="0.00"
                  />
                </div>
                {selectedPayeeId && payees.find((p) => p.id === selectedPayeeId)?.lastAmount && (
                  <p className="text-xs text-white/60">
                    Last payment: $
                    {payees.find((p) => p.id === selectedPayeeId)?.lastAmount?.toFixed(2)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date" className="text-white/80">
                  Payment Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                  min={new Date().toISOString().split("T")[0]}
                  className="border-white/20 bg-white/10 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="frequency" className="text-white/80">
                  Frequency
                </Label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as typeof frequency)}>
                  <SelectTrigger className="border-white/20 bg-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/20 bg-slate-900 text-white">
                    <SelectItem value="once">One-time Payment</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {frequency !== "once" && (
                <Card className="border-blue-500/20 bg-blue-500/10 p-3">
                  <p className="flex items-center text-sm text-blue-400">
                    <Repeat className="mr-2 size-4" />
                    This payment will recur {frequency}
                  </p>
                </Card>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1 border-white/20 bg-white/10 text-white hover:bg-white/20"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500"
                >
                  {isProcessing ? "Processing..." : "Schedule Payment"}
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* Scheduled Payments Tab */}
          <TabsContent value="schedule" className="space-y-3">
            {scheduledPayments.length === 0 ? (
              <Card className="border-white/10 bg-white/5 p-8 text-center">
                <Calendar className="mx-auto mb-3 size-12 text-white/40" />
                <p className="text-white/60">No scheduled payments</p>
                <p className="mt-1 text-sm text-white/40">Set up recurring payments in the Pay Bill tab</p>
              </Card>
            ) : (
              scheduledPayments.map((payment) => (
                <motion.div
                  key={payment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">{payment.payeeName}</h4>
                        <p className="text-sm text-white/60">
                          ${payment.amount.toFixed(2)} • {payment.frequency}
                        </p>
                        <p className="mt-1 flex items-center text-xs text-white/40">
                          <Calendar className="mr-1 size-3" />
                          Next payment: {new Date(payment.nextDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCancelScheduled(payment.id)}
                          className="text-red-400 hover:bg-red-500/20"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))
            )}
          </TabsContent>

          {/* Payees Tab */}
          <TabsContent value="payees" className="space-y-4">
            {/* Add Payee Form */}
            <Card className="border-white/10 bg-white/5 p-4">
              <h3 className="mb-3 flex items-center text-sm font-semibold text-white">
                <Plus className="mr-2 size-4" />
                Add New Payee
              </h3>
              <form onSubmit={handleAddPayee} className="space-y-3">
                <Input
                  placeholder="Payee name"
                  value={newPayeeName}
                  onChange={(e) => setNewPayeeName(e.target.value)}
                  className="border-white/20 bg-white/10 text-white placeholder:text-white/40"
                />
                <Input
                  placeholder="Account number"
                  value={newPayeeAccount}
                  onChange={(e) => setNewPayeeAccount(e.target.value)}
                  className="border-white/20 bg-white/10 text-white placeholder:text-white/40"
                />
                <Select value={newPayeeCategory} onValueChange={setNewPayeeCategory}>
                  <SelectTrigger className="border-white/20 bg-white/10 text-white">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="border-white/20 bg-slate-900 text-white">
                    {PAYEE_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500"
                >
                  Add Payee
                </Button>
              </form>
            </Card>

            {/* Payee List */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white/60">Your Payees</h3>
              {payees.map((payee) => (
                <motion.div
                  key={payee.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="border-white/10 bg-white/5 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">{payee.name}</h4>
                        <p className="text-sm text-white/60">{payee.category}</p>
                        <p className="mt-1 font-mono text-xs text-white/40">{payee.accountNumber}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeletePayee(payee.id)}
                        className="text-red-400 hover:bg-red-500/20"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
