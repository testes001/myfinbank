import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { UserORM } from "@/components/data/orm/orm_user";
import { AccountORM } from "@/components/data/orm/orm_account";
import {
  getRecurringTransfers,
  createRecurringTransfer,
  pauseRecurringTransfer,
  resumeRecurringTransfer,
  cancelRecurringTransfer,
  deleteRecurringTransfer,
  formatFrequency,
  type RecurringTransfer,
  type RecurringFrequency,
} from "@/lib/recurring-transfers";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  RefreshCw,
  Plus,
  Pause,
  Play,
  Trash2,
  Calendar,
  DollarSign,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

interface RecurringTransfersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RecurringTransfersModal({ open, onOpenChange }: RecurringTransfersModalProps) {
  const { currentUser } = useAuth();
  const [transfers, setTransfers] = useState<RecurringTransfer[]>([]);
  const [activeTab, setActiveTab] = useState<"list" | "create">("list");
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientAccountId, setRecipientAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<RecurringFrequency>("monthly");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState("");
  const [maxExecutions, setMaxExecutions] = useState("");

  const loadTransfers = () => {
    if (!currentUser) return;
    const allTransfers = getRecurringTransfers(currentUser.user.id);
    setTransfers(allTransfers);
  };

  useEffect(() => {
    if (open) {
      loadTransfers();
    }
  }, [open, currentUser]);

  const handleLookupRecipient = async () => {
    if (!recipientEmail) {
      toast.error("Please enter an email address");
      return;
    }

    setIsLoading(true);
    try {
      const userOrm = UserORM.getInstance();
      const users = await userOrm.getUserByEmail(recipientEmail.trim().toLowerCase());

      if (users.length === 0) {
        toast.error("Recipient not found");
        setRecipientName("");
        setRecipientAccountId("");
        return;
      }

      const user = users[0];
      if (user.id === currentUser?.user.id) {
        toast.error("Cannot set up recurring transfer to yourself");
        return;
      }

      const accountOrm = AccountORM.getInstance();
      const accounts = await accountOrm.getAccountByUserId(user.id);

      if (accounts.length === 0) {
        toast.error("Recipient account not found");
        return;
      }

      setRecipientName(user.full_name);
      setRecipientAccountId(accounts[0].id);
      toast.success(`Found: ${user.full_name}`);
    } catch (error) {
      toast.error("Failed to look up recipient");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTransfer = () => {
    if (!currentUser) return;

    if (!recipientAccountId) {
      toast.error("Please look up a valid recipient first");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!startDate) {
      toast.error("Please select a start date");
      return;
    }

    try {
      createRecurringTransfer({
        userId: currentUser.user.id,
        fromAccountId: currentUser.account.id,
        toAccountId: recipientAccountId,
        recipientName,
        recipientEmail: recipientEmail || undefined,
        amount: amountNum,
        frequency,
        description: description || undefined,
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        maxExecutions: maxExecutions ? parseInt(maxExecutions) : undefined,
      });

      toast.success("Recurring transfer created successfully");
      resetForm();
      loadTransfers();
      setActiveTab("list");
    } catch (error) {
      toast.error("Failed to create recurring transfer");
    }
  };

  const handlePause = (transferId: string) => {
    pauseRecurringTransfer(transferId);
    toast.success("Transfer paused");
    loadTransfers();
  };

  const handleResume = (transferId: string) => {
    resumeRecurringTransfer(transferId);
    toast.success("Transfer resumed");
    loadTransfers();
  };

  const handleCancel = (transferId: string) => {
    cancelRecurringTransfer(transferId);
    toast.success("Transfer cancelled");
    loadTransfers();
  };

  const handleDelete = (transferId: string) => {
    deleteRecurringTransfer(transferId);
    toast.success("Transfer deleted");
    loadTransfers();
  };

  const resetForm = () => {
    setRecipientEmail("");
    setRecipientName("");
    setRecipientAccountId("");
    setAmount("");
    setFrequency("monthly");
    setDescription("");
    setStartDate(format(new Date(), "yyyy-MM-dd"));
    setEndDate("");
    setMaxExecutions("");
  };

  const getStatusBadge = (status: RecurringTransfer["status"]) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500/20 text-green-400">
            <CheckCircle2 className="mr-1 size-3" /> Active
          </Badge>
        );
      case "paused":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400">
            <Pause className="mr-1 size-3" /> Paused
          </Badge>
        );
      case "completed":
        return (
          <Badge className="bg-blue-500/20 text-blue-400">
            <CheckCircle2 className="mr-1 size-3" /> Completed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-500/20 text-red-400">
            <XCircle className="mr-1 size-3" /> Cancelled
          </Badge>
        );
    }
  };

  if (!currentUser) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden border-white/20 bg-slate-900/95 text-white backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <RefreshCw className="size-5" />
            Recurring Transfers
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-2 bg-white/5">
            <TabsTrigger value="list" className="data-[state=active]:bg-white/20">
              My Transfers
            </TabsTrigger>
            <TabsTrigger value="create" className="data-[state=active]:bg-white/20">
              <Plus className="mr-2 size-4" />
              New Transfer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              {transfers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <RefreshCw className="mb-4 size-12 text-white/20" />
                  <p className="text-white/60">No recurring transfers</p>
                  <p className="text-sm text-white/40">
                    Set up automatic payments to save time
                  </p>
                  <Button
                    onClick={() => setActiveTab("create")}
                    className="mt-4 bg-gradient-to-r from-blue-500 to-purple-500"
                  >
                    <Plus className="mr-2 size-4" />
                    Create First Transfer
                  </Button>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  <div className="space-y-3">
                    {transfers.map((transfer, index) => (
                      <motion.div
                        key={transfer.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="border-white/10 bg-white/5 p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <User className="size-4 text-white/60" />
                                <span className="font-medium text-white">
                                  {transfer.recipientName}
                                </span>
                                {getStatusBadge(transfer.status)}
                              </div>

                              <div className="mt-2 flex items-center gap-4 text-sm">
                                <div className="flex items-center text-white/60">
                                  <DollarSign className="mr-1 size-4" />
                                  <span className="font-semibold text-white">
                                    ${transfer.amount.toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex items-center text-white/60">
                                  <RefreshCw className="mr-1 size-4" />
                                  {formatFrequency(transfer.frequency)}
                                </div>
                              </div>

                              <div className="mt-2 flex items-center gap-4 text-xs text-white/50">
                                <div className="flex items-center">
                                  <Calendar className="mr-1 size-3" />
                                  Next: {format(new Date(transfer.nextExecutionDate), "MMM d, yyyy")}
                                </div>
                                <div className="flex items-center">
                                  <Clock className="mr-1 size-3" />
                                  {transfer.executionCount} executed
                                </div>
                              </div>

                              {transfer.description && (
                                <p className="mt-2 text-sm text-white/40">
                                  {transfer.description}
                                </p>
                              )}
                            </div>

                            <div className="flex gap-1">
                              {transfer.status === "active" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handlePause(transfer.id)}
                                  className="text-yellow-400 hover:bg-yellow-500/20"
                                >
                                  <Pause className="size-4" />
                                </Button>
                              )}
                              {transfer.status === "paused" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleResume(transfer.id)}
                                  className="text-green-400 hover:bg-green-500/20"
                                >
                                  <Play className="size-4" />
                                </Button>
                              )}
                              {(transfer.status === "active" || transfer.status === "paused") && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCancel(transfer.id)}
                                  className="text-red-400 hover:bg-red-500/20"
                                >
                                  <XCircle className="size-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(transfer.id)}
                                className="text-white/40 hover:bg-white/10 hover:text-red-400"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="create" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {/* Recipient */}
                <Card className="border-white/10 bg-white/5 p-4">
                  <h3 className="mb-3 flex items-center font-medium text-white">
                    <User className="mr-2 size-4" />
                    Recipient
                  </h3>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Recipient email (e.g., alice@demo.com)"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        className="flex-1 border-white/20 bg-white/10 text-white placeholder:text-white/40"
                      />
                      <Button
                        onClick={handleLookupRecipient}
                        disabled={isLoading}
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        Look Up
                      </Button>
                    </div>
                    {recipientName && (
                      <div className="flex items-center rounded-lg bg-green-500/10 p-3 text-green-400">
                        <CheckCircle2 className="mr-2 size-4" />
                        {recipientName}
                      </div>
                    )}
                  </div>
                </Card>

                {/* Amount & Frequency */}
                <Card className="border-white/10 bg-white/5 p-4">
                  <h3 className="mb-3 flex items-center font-medium text-white">
                    <DollarSign className="mr-2 size-4" />
                    Amount & Frequency
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-white/60">Amount</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0.01"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="mt-1 border-white/20 bg-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white/60">Frequency</Label>
                      <Select value={frequency} onValueChange={(v) => setFrequency(v as RecurringFrequency)}>
                        <SelectTrigger className="mt-1 border-white/20 bg-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="border-white/20 bg-slate-900">
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="biweekly">Every 2 Weeks</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Card>

                {/* Schedule */}
                <Card className="border-white/10 bg-white/5 p-4">
                  <h3 className="mb-3 flex items-center font-medium text-white">
                    <Calendar className="mr-2 size-4" />
                    Schedule
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-white/60">Start Date</Label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="mt-1 border-white/20 bg-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-white/60">End Date (Optional)</Label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="mt-1 border-white/20 bg-white/10 text-white"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label className="text-white/60">Max Executions (Optional)</Label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="Unlimited if empty"
                        value={maxExecutions}
                        onChange={(e) => setMaxExecutions(e.target.value)}
                        className="mt-1 border-white/20 bg-white/10 text-white placeholder:text-white/40"
                      />
                    </div>
                  </div>
                </Card>

                {/* Description */}
                <div>
                  <Label className="text-white/60">Description (Optional)</Label>
                  <Input
                    placeholder="e.g., Monthly rent payment"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="mt-1 border-white/20 bg-white/10 text-white placeholder:text-white/40"
                  />
                </div>

                {/* Summary */}
                {recipientName && amount && (
                  <Card className="border-blue-500/20 bg-blue-500/10 p-4">
                    <h4 className="mb-2 text-sm font-medium text-blue-400">Transfer Summary</h4>
                    <div className="flex items-center gap-2 text-white">
                      <span>${parseFloat(amount || "0").toFixed(2)}</span>
                      <ArrowRight className="size-4" />
                      <span>{recipientName}</span>
                    </div>
                    <p className="mt-1 text-sm text-blue-400/80">
                      {formatFrequency(frequency)}, starting{" "}
                      {startDate ? format(new Date(startDate), "MMM d, yyyy") : "immediately"}
                    </p>
                  </Card>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    className="flex-1 border-white/20 bg-white/10 text-white hover:bg-white/20"
                  >
                    Reset
                  </Button>
                  <Button
                    onClick={handleCreateTransfer}
                    disabled={!recipientAccountId || !amount}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500"
                  >
                    <Plus className="mr-2 size-4" />
                    Create Transfer
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
