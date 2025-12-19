import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getAdditionalAccounts,
  createAdditionalAccount,
  updateAdditionalAccount,
  deleteAdditionalAccount,
  getAccountTypeDisplay,
  getDefaultInterestRate,
  type AdditionalAccount,
  type AdditionalAccountType,
} from "@/lib/multi-account";
import { formatCurrency } from "@/lib/transactions";
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
  Wallet,
  Plus,
  PiggyBank,
  TrendingUp,
  Clock,
  BarChart3,
  Edit,
  Trash2,
  ArrowRightLeft,
  DollarSign,
  Percent,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

interface MultiAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MultiAccountModal({ open, onOpenChange }: MultiAccountModalProps) {
  const { currentUser } = useAuth();
  const [accounts, setAccounts] = useState<AdditionalAccount[]>([]);
  const [activeTab, setActiveTab] = useState<"accounts" | "create" | "transfer">("accounts");
  const [showBalances, setShowBalances] = useState(true);
  const [editingAccount, setEditingAccount] = useState<AdditionalAccount | null>(null);

  // Create form state
  const [accountType, setAccountType] = useState<AdditionalAccountType>("savings");
  const [nickname, setNickname] = useState("");
  const [initialDeposit, setInitialDeposit] = useState("");
  const [maturityMonths, setMaturityMonths] = useState("12");

  // Transfer form state
  const [transferFrom, setTransferFrom] = useState("");
  const [transferTo, setTransferTo] = useState("");
  const [transferAmount, setTransferAmount] = useState("");

  const loadAccounts = () => {
    if (!currentUser) return;
    const allAccounts = getAdditionalAccounts(currentUser.user.id);
    setAccounts(allAccounts);
  };

  useEffect(() => {
    if (open) {
      loadAccounts();
    }
  }, [open, currentUser]);

  const handleCreateAccount = () => {
    if (!currentUser) return;

    if (!nickname) {
      toast.error("Please enter a nickname for the account");
      return;
    }

    const deposit = parseFloat(initialDeposit) || 0;
    if (deposit < 0) {
      toast.error("Initial deposit cannot be negative");
      return;
    }

    // Check minimum deposits
    let minimumBalance = 0;
    if (accountType === "money_market") minimumBalance = 2500;
    if (accountType === "cd") minimumBalance = 1000;

    if (deposit < minimumBalance) {
      toast.error(`Minimum deposit for ${getAccountTypeDisplay(accountType)} is $${minimumBalance}`);
      return;
    }

    try {
      createAdditionalAccount(currentUser.user.id, {
        accountType,
        nickname,
        initialDeposit: deposit,
        interestRate: getDefaultInterestRate(accountType),
        maturityMonths: accountType === "cd" ? parseInt(maturityMonths) : undefined,
        minimumBalance,
      });

      toast.success(`${getAccountTypeDisplay(accountType)} created successfully`);
      resetCreateForm();
      loadAccounts();
      setActiveTab("accounts");
    } catch (error) {
      toast.error("Failed to create account");
    }
  };

  const handleUpdateNickname = (account: AdditionalAccount, newNickname: string) => {
    if (!newNickname.trim()) {
      toast.error("Nickname cannot be empty");
      return;
    }

    updateAdditionalAccount(account.id, { nickname: newNickname });
    toast.success("Account nickname updated");
    setEditingAccount(null);
    loadAccounts();
  };

  const handleDeleteAccount = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;

    if (parseFloat(account.balance) > 0) {
      toast.error("Please transfer all funds before closing this account");
      return;
    }

    deleteAdditionalAccount(accountId);
    toast.success("Account closed");
    loadAccounts();
  };

  const handleTransfer = () => {
    if (!transferFrom || !transferTo) {
      toast.error("Please select both accounts");
      return;
    }

    if (transferFrom === transferTo) {
      toast.error("Cannot transfer to the same account");
      return;
    }

    const amount = parseFloat(transferAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const fromAccount = accounts.find(a => a.id === transferFrom);
    if (!fromAccount) {
      toast.error("Source account not found");
      return;
    }

    const fromBalance = parseFloat(fromAccount.balance);
    if (fromBalance < amount) {
      toast.error("Insufficient funds");
      return;
    }

    // Check CD maturity
    if (fromAccount.accountType === "cd" && fromAccount.maturityDate) {
      if (new Date(fromAccount.maturityDate) > new Date()) {
        toast.error("Cannot withdraw from CD before maturity date");
        return;
      }
    }

    // Perform transfer
    const toAccount = accounts.find(a => a.id === transferTo);
    if (!toAccount) {
      toast.error("Destination account not found");
      return;
    }

    updateAdditionalAccount(transferFrom, {
      balance: (fromBalance - amount).toFixed(2),
    });
    updateAdditionalAccount(transferTo, {
      balance: (parseFloat(toAccount.balance) + amount).toFixed(2),
    });

    toast.success(`Transferred ${formatCurrency(amount)} successfully`);
    setTransferAmount("");
    loadAccounts();
  };

  const resetCreateForm = () => {
    setAccountType("savings");
    setNickname("");
    setInitialDeposit("");
    setMaturityMonths("12");
  };

  const getAccountIcon = (type: AdditionalAccountType) => {
    switch (type) {
      case "savings":
        return <PiggyBank className="size-5" />;
      case "money_market":
        return <TrendingUp className="size-5" />;
      case "cd":
        return <Clock className="size-5" />;
      case "investment":
        return <BarChart3 className="size-5" />;
    }
  };

  const getAccountIconColor = (type: AdditionalAccountType) => {
    switch (type) {
      case "savings":
        return "bg-green-500/20 text-green-400";
      case "money_market":
        return "bg-blue-500/20 text-blue-400";
      case "cd":
        return "bg-purple-500/20 text-purple-400";
      case "investment":
        return "bg-yellow-500/20 text-yellow-400";
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + parseFloat(acc.balance), 0);
  const primaryBalance = currentUser ? parseFloat(currentUser.account.balance) : 0;
  const grandTotal = totalBalance + primaryBalance;

  if (!currentUser) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden border-white/20 bg-slate-900/95 text-white backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between text-xl text-white">
            <div className="flex items-center gap-2">
              <Wallet className="size-5" />
              My Accounts
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBalances(!showBalances)}
              className="text-white/60 hover:text-white"
            >
              {showBalances ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            </Button>
          </DialogTitle>
        </DialogHeader>

        {/* Total Balance Overview */}
        <Card className="border-white/10 bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60">Total Net Worth</p>
              <p className="text-2xl font-bold text-white">
                {showBalances ? formatCurrency(grandTotal) : "••••••"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/60">{accounts.length + 1} accounts</p>
              <Badge className="mt-1 bg-white/20">{accounts.length} additional</Badge>
            </div>
          </div>
        </Card>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-3 bg-white/5">
            <TabsTrigger value="accounts" className="data-[state=active]:bg-white/20">
              Accounts
            </TabsTrigger>
            <TabsTrigger value="create" className="data-[state=active]:bg-white/20">
              <Plus className="mr-2 size-4" />
              New
            </TabsTrigger>
            <TabsTrigger value="transfer" className="data-[state=active]:bg-white/20">
              <ArrowRightLeft className="mr-2 size-4" />
              Transfer
            </TabsTrigger>
          </TabsList>

          <TabsContent value="accounts" className="mt-4">
            <ScrollArea className="h-[350px] pr-4">
              <div className="space-y-3">
                {/* Primary Checking Account */}
                <Card className="border-blue-500/20 bg-blue-500/10 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-blue-500/20">
                      <DollarSign className="size-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">Primary Checking</span>
                        <Badge className="bg-blue-500/30 text-blue-300 text-xs">Primary</Badge>
                      </div>
                      <p className="text-sm text-white/60">
                        ****{currentUser.account.id.slice(-4)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-white">
                        {showBalances ? formatCurrency(primaryBalance) : "••••••"}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Additional Accounts */}
                {accounts.length === 0 ? (
                  <div className="py-8 text-center">
                    <Wallet className="mx-auto mb-4 size-12 text-white/20" />
                    <p className="text-white/60">No additional accounts</p>
                    <p className="text-sm text-white/40">
                      Open a savings or investment account
                    </p>
                    <Button
                      onClick={() => setActiveTab("create")}
                      className="mt-4 bg-gradient-to-r from-blue-500 to-purple-500"
                    >
                      <Plus className="mr-2 size-4" />
                      Open New Account
                    </Button>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {accounts.map((account, index) => (
                      <motion.div
                        key={account.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="border-white/10 bg-white/5 p-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex size-10 items-center justify-center rounded-full ${getAccountIconColor(
                                account.accountType
                              )}`}
                            >
                              {getAccountIcon(account.accountType)}
                            </div>
                            <div className="flex-1">
                              {editingAccount?.id === account.id ? (
                                <Input
                                  defaultValue={account.nickname}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      handleUpdateNickname(account, e.currentTarget.value);
                                    }
                                    if (e.key === "Escape") {
                                      setEditingAccount(null);
                                    }
                                  }}
                                  onBlur={(e) => handleUpdateNickname(account, e.target.value)}
                                  autoFocus
                                  className="h-6 border-white/20 bg-white/10 px-2 text-white"
                                />
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-white">{account.nickname}</span>
                                  <button
                                    onClick={() => setEditingAccount(account)}
                                    className="text-white/40 hover:text-white"
                                  >
                                    <Edit className="size-3" />
                                  </button>
                                </div>
                              )}
                              <p className="text-sm text-white/60">
                                {getAccountTypeDisplay(account.accountType)}
                                {account.interestRate ? ` • ${account.interestRate}% APY` : ""}
                              </p>
                              {account.accountType === "cd" && account.maturityDate && (
                                <p className="text-xs text-purple-400">
                                  Matures: {format(new Date(account.maturityDate), "MMM d, yyyy")}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="text-right">
                                <p className="text-lg font-semibold text-white">
                                  {showBalances
                                    ? formatCurrency(parseFloat(account.balance))
                                    : "••••••"}
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteAccount(account.id)}
                                className="text-white/40 hover:bg-red-500/20 hover:text-red-400"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="create" className="mt-4">
            <ScrollArea className="h-[350px] pr-4">
              <div className="space-y-4">
                {/* Account Type Selection */}
                <div>
                  <Label className="text-white/60">Account Type</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {(["savings", "money_market", "cd", "investment"] as AdditionalAccountType[]).map(
                      (type) => (
                        <Card
                          key={type}
                          onClick={() => setAccountType(type)}
                          className={`cursor-pointer p-3 transition-colors ${
                            accountType === type
                              ? "border-blue-500/40 bg-blue-500/20"
                              : "border-white/10 bg-white/5 hover:bg-white/10"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div className={`rounded-full p-1 ${getAccountIconColor(type)}`}>
                              {getAccountIcon(type)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">
                                {getAccountTypeDisplay(type)}
                              </p>
                              <p className="text-xs text-white/60">
                                {getDefaultInterestRate(type)}% APY
                              </p>
                            </div>
                            {accountType === type && (
                              <CheckCircle2 className="ml-auto size-4 text-blue-400" />
                            )}
                          </div>
                        </Card>
                      )
                    )}
                  </div>
                </div>

                {/* Account Details */}
                <div>
                  <Label className="text-white/60">Account Nickname</Label>
                  <Input
                    placeholder="e.g., Emergency Fund, Vacation Savings"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="mt-1 border-white/20 bg-white/10 text-white placeholder:text-white/40"
                  />
                </div>

                <div>
                  <Label className="text-white/60">Initial Deposit</Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={initialDeposit}
                      onChange={(e) => setInitialDeposit(e.target.value)}
                      className="border-white/20 bg-white/10 pl-10 text-white"
                    />
                  </div>
                  {accountType === "money_market" && (
                    <p className="mt-1 text-xs text-yellow-400">Minimum deposit: $2,500</p>
                  )}
                  {accountType === "cd" && (
                    <p className="mt-1 text-xs text-yellow-400">Minimum deposit: $1,000</p>
                  )}
                </div>

                {accountType === "cd" && (
                  <div>
                    <Label className="text-white/60">Term Length</Label>
                    <Select value={maturityMonths} onValueChange={setMaturityMonths}>
                      <SelectTrigger className="mt-1 border-white/20 bg-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="border-white/20 bg-slate-900">
                        <SelectItem value="3">3 Months (3.0% APY)</SelectItem>
                        <SelectItem value="6">6 Months (3.5% APY)</SelectItem>
                        <SelectItem value="12">12 Months (4.5% APY)</SelectItem>
                        <SelectItem value="24">24 Months (4.75% APY)</SelectItem>
                        <SelectItem value="60">60 Months (5.0% APY)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Interest Rate Info */}
                <Card className="border-green-500/20 bg-green-500/10 p-4">
                  <div className="flex items-center gap-2">
                    <Percent className="size-5 text-green-400" />
                    <div>
                      <p className="text-sm font-medium text-green-400">
                        {getDefaultInterestRate(accountType)}% APY
                      </p>
                      <p className="text-xs text-green-400/80">
                        Annual Percentage Yield for {getAccountTypeDisplay(accountType)}
                      </p>
                    </div>
                  </div>
                </Card>

                {/* Create Button */}
                <Button
                  onClick={handleCreateAccount}
                  disabled={!nickname}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500"
                >
                  <Plus className="mr-2 size-4" />
                  Open {getAccountTypeDisplay(accountType)}
                </Button>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="transfer" className="mt-4">
            <ScrollArea className="h-[350px] pr-4">
              {accounts.length === 0 ? (
                <div className="py-8 text-center">
                  <ArrowRightLeft className="mx-auto mb-4 size-12 text-white/20" />
                  <p className="text-white/60">No additional accounts to transfer</p>
                  <p className="text-sm text-white/40">
                    Open a savings account to start transferring
                  </p>
                  <Button
                    onClick={() => setActiveTab("create")}
                    className="mt-4 bg-gradient-to-r from-blue-500 to-purple-500"
                  >
                    <Plus className="mr-2 size-4" />
                    Open New Account
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <Card className="border-white/10 bg-white/5 p-4">
                    <h3 className="mb-4 flex items-center font-medium text-white">
                      <ArrowRightLeft className="mr-2 size-4" />
                      Transfer Between Accounts
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-white/60">From Account</Label>
                        <Select value={transferFrom} onValueChange={setTransferFrom}>
                          <SelectTrigger className="mt-1 border-white/20 bg-white/10 text-white">
                            <SelectValue placeholder="Select source account" />
                          </SelectTrigger>
                          <SelectContent className="border-white/20 bg-slate-900">
                            {accounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.nickname} - {formatCurrency(parseFloat(account.balance))}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-white/60">To Account</Label>
                        <Select value={transferTo} onValueChange={setTransferTo}>
                          <SelectTrigger className="mt-1 border-white/20 bg-white/10 text-white">
                            <SelectValue placeholder="Select destination account" />
                          </SelectTrigger>
                          <SelectContent className="border-white/20 bg-slate-900">
                            {accounts
                              .filter((a) => a.id !== transferFrom)
                              .map((account) => (
                                <SelectItem key={account.id} value={account.id}>
                                  {account.nickname} - {formatCurrency(parseFloat(account.balance))}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-white/60">Amount</Label>
                        <div className="relative mt-1">
                          <DollarSign className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="0.00"
                            value={transferAmount}
                            onChange={(e) => setTransferAmount(e.target.value)}
                            className="border-white/20 bg-white/10 pl-10 text-white"
                          />
                        </div>
                      </div>

                      <Button
                        onClick={handleTransfer}
                        disabled={!transferFrom || !transferTo || !transferAmount}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-500"
                      >
                        <ArrowRightLeft className="mr-2 size-4" />
                        Transfer Funds
                      </Button>
                    </div>
                  </Card>

                  {/* Quick Transfer Buttons */}
                  <Card className="border-white/10 bg-white/5 p-4">
                    <h3 className="mb-3 text-sm font-medium text-white/60">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {accounts.slice(0, 4).map((account) => (
                        <Button
                          key={account.id}
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setTransferTo(account.id);
                          }}
                          className="justify-start border-white/20 bg-white/5 text-white hover:bg-white/10"
                        >
                          <div className={`mr-2 rounded p-1 ${getAccountIconColor(account.accountType)}`}>
                            {getAccountIcon(account.accountType)}
                          </div>
                          <span className="truncate">{account.nickname}</span>
                        </Button>
                      ))}
                    </div>
                  </Card>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
