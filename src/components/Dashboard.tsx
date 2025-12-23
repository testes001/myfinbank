import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TransferModal } from "@/components/TransferModal";
import { MobileDepositModal } from "@/components/MobileDepositModal";
import { BillPayModal } from "@/components/BillPayModal";
import { FundAccessRestrictionBanner } from "@/components/FundAccessRestrictionBanner";
import { SpendingChart } from "@/components/SpendingChart";
import { TransactionSkeleton } from "@/components/LoadingSkeleton";
import { NotificationCenter } from "@/components/NotificationCenter";
import { TransactionSearch } from "@/components/TransactionSearch";
import { RecurringTransfersModal } from "@/components/RecurringTransfersModal";
import { MultiAccountModal } from "@/components/MultiAccountModal";
import { BalanceAlertsModal } from "@/components/BalanceAlertsModal";
import { VirtualCardsModal } from "@/components/VirtualCardsModal";
import { P2PTransferModal } from "@/components/P2PTransferModal";
import { SavingsGoals } from "@/components/SavingsGoals";
import { AIInsights } from "@/components/AIInsights";
import { JointAccountInviteModal } from "@/components/JointAccountInviteModal";
import { getRecentTransactions, formatCurrency, formatDate, getTransactionType } from "@/lib/transactions";
import { getUserWithAccount } from "@/lib/auth";
import { getTotalBalance } from "@/lib/multi-account";
import { getUpcomingTransfers } from "@/lib/recurring-transfers";
import { getActiveCardCount } from "@/lib/virtual-cards";
import { getKYCData, type PrimaryAccountType } from "@/lib/kyc-storage";
import type { TransactionModel } from "@/components/data/orm/orm_transaction";
import type { ActivePage } from "@/components/BankingApp";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Send,
  Sun,
  Moon,
  AlertTriangle,
  TrendingUp,
  Smartphone,
  FileText,
  Eye,
  EyeOff,
  Search,
  RefreshCw,
  Wallet,
  CreditCard,
  Plus,
  X,
  Users,
  Briefcase,
  Copy,
  Building2,
  PieChart,
  Receipt,
  Bell,
  DollarSign,
  Target,
  Zap,
} from "lucide-react";
import { useAsync } from "@/hooks/useAsync";
import { FINBANK_ROUTING_NUMBER } from "@/lib/seed";
import { toast } from "sonner";

interface DashboardProps {
  onNavigate: (page: ActivePage) => void;
}

// Generate a numeric account number (8-12 digits based on account type)
function generateNumericAccountNumber(accountType: PrimaryAccountType): string {
  const lengths: Record<PrimaryAccountType, number> = {
    checking: 10,
    joint: 11,
    business_elite: 12,
  };
  const length = lengths[accountType] || 10;
  let number = "";
  for (let i = 0; i < length; i++) {
    number += Math.floor(Math.random() * 10).toString();
  }
  return number;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { currentUser, setCurrentUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [transactions, setTransactions] = useState<TransactionModel[]>([]);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isMobileDepositOpen, setIsMobileDepositOpen] = useState(false);
  const [isBillPayOpen, setIsBillPayOpen] = useState(false);
  const [isTransactionSearchOpen, setIsTransactionSearchOpen] = useState(false);
  const [isRecurringTransfersOpen, setIsRecurringTransfersOpen] = useState(false);
  const [isMultiAccountOpen, setIsMultiAccountOpen] = useState(false);
  const [isBalanceAlertsOpen, setIsBalanceAlertsOpen] = useState(false);
  const [isVirtualCardsOpen, setIsVirtualCardsOpen] = useState(false);
  const [isP2PTransferOpen, setIsP2PTransferOpen] = useState(false);
  const [isJointInviteOpen, setIsJointInviteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { loading: asyncLoading, error: asyncError, run: runAsync, setError: setAsyncError } = useAsync<void>();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [showBalances, setShowBalances] = useState(true);

  // Account details modal state
  const [isAccountDetailsOpen, setIsAccountDetailsOpen] = useState(false);

  // Floating action button state (collapsible quick actions)
  const [isFabOpen, setIsFabOpen] = useState(false);

  // Additional account data
  const [additionalAccountsBalance, setAdditionalAccountsBalance] = useState(0);
  const [upcomingTransfersCount, setUpcomingTransfersCount] = useState(0);
  const [activeVirtualCardsCount, setActiveVirtualCardsCount] = useState(0);

  // Get account type from KYC data
  const kycData = currentUser ? getKYCData(currentUser.user.id) : null;
  const accountType: PrimaryAccountType = kycData?.primaryAccountType || "checking";

  // Generate a stable numeric account number based on user ID
  const [numericAccountNumber] = useState(() => {
    // Use stored number or generate new one
    const stored = localStorage.getItem(`account_number_${currentUser?.user.id}`);
    if (stored) return stored;
    const newNumber = generateNumericAccountNumber(accountType);
    if (currentUser?.user.id) {
      localStorage.setItem(`account_number_${currentUser.user.id}`, newNumber);
    }
    return newNumber;
  });

  const loadData = async () => {
    if (!currentUser) return;

    await runAsync(async () => {
      const [recentTxs, updatedUser] = await Promise.all([
        getRecentTransactions(currentUser.account.id, 50),
        getUserWithAccount(currentUser.user.id),
      ]);

      setTransactions(recentTxs);
      setCurrentUser(updatedUser);

      // Load additional account data
      const additionalBalance = getTotalBalance(currentUser.user.id);
      setAdditionalAccountsBalance(additionalBalance);

      const upcomingTransfers = getUpcomingTransfers(currentUser.user.id, 7);
      setUpcomingTransfersCount(upcomingTransfers.length);

      const activeCards = getActiveCardCount(currentUser.user.id);
      setActiveVirtualCardsCount(activeCards);
    }).catch((err) => {
      console.error("Failed to load dashboard data:", err);
      setLoadError(err instanceof Error ? err.message : String(err));
      setAsyncError(err instanceof Error ? err : new Error(String(err)));
    }).finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleTransferSuccess = () => {
    setIsTransferOpen(false);
    loadData();
  };

  if (!currentUser) return null;

  if (loadError) {
    return (
      <div className="min-h-screen p-4 pt-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6">
            <h3 className="text-lg font-semibold text-red-400">Failed to load dashboard</h3>
            <p className="text-sm text-red-300 mt-2">{loadError}</p>
            <div className="mt-4">
              <button
                onClick={() => {
                  setLoadError(null);
                  setIsLoading(true);
                  loadData();
                }}
                className="inline-flex items-center rounded-md bg-blue-500 px-4 py-2 text-white"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const balance = parseFloat(currentUser.account.balance);

  // Account type specific gradient colors
  const accountTypeGradients: Record<PrimaryAccountType, string> = {
    checking: "from-blue-500 via-purple-500 to-pink-500",
    joint: "from-purple-500 via-pink-500 to-rose-500",
    business_elite: "from-amber-500 via-orange-500 to-red-500",
  };

  const accountTypeLabels: Record<PrimaryAccountType, string> = {
    checking: "Personal Checking",
    joint: "Joint Account",
    business_elite: "Business Elite",
  };

  const accountTypeIcons: Record<PrimaryAccountType, React.ReactNode> = {
    checking: <CreditCard className="size-5" />,
    joint: <Users className="size-5" />,
    business_elite: <Briefcase className="size-5" />,
  };

  const handleCopyAccountNumber = () => {
    navigator.clipboard.writeText(numericAccountNumber);
    toast.success("Account number copied to clipboard");
  };

  const handleCopyRoutingNumber = () => {
    navigator.clipboard.writeText(FINBANK_ROUTING_NUMBER);
    toast.success("Routing number copied to clipboard");
  };

  return (
    <div className="min-h-screen p-4 pt-6">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Fund Access Restriction Banner */}
        {currentUser && <FundAccessRestrictionBanner userId={currentUser.user.id} />}

        {/* Header with Profile Avatar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Profile Avatar - taps to go to profile */}
            <button
              onClick={() => onNavigate("profile")}
              className="relative"
              aria-label="Go to profile"
            >
              <Avatar className="size-12 border-2 border-white/20">
                <AvatarFallback className={`bg-gradient-to-br ${accountTypeGradients[accountType]} text-white font-bold`}>
                  {currentUser.user.full_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-green-500 ring-2 ring-slate-900">
                <span className="size-2 rounded-full bg-white" />
              </span>
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">
                Hello, {currentUser.user.full_name.split(" ")[0]}
              </h1>
              <div className="flex items-center gap-1 text-sm text-white/60">
                {accountTypeIcons[accountType]}
                <span>{accountTypeLabels[accountType]}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setShowBalances(!showBalances)}
              className="rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
              aria-label={showBalances ? "Hide balances" : "Show balances"}
            >
              {showBalances ? <Eye className="size-5" /> : <EyeOff className="size-5" />}
            </button>
            <NotificationCenter />
            <button
              onClick={toggleTheme}
              className="rounded-full p-2 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
              aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </button>
          </div>
        </div>

        {/* Balance Card - Tappable for account details */}
        <motion.button
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          onClick={() => setIsAccountDetailsOpen(true)}
          className={`relative w-full overflow-hidden rounded-3xl bg-gradient-to-br ${accountTypeGradients[accountType]} p-6 shadow-2xl text-left`}
        >
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-white/80">Current Balance</p>
              <span className="text-xs text-white/60 bg-white/20 px-2 py-1 rounded-full">Tap for details</span>
            </div>
            <motion.h2
              key={balance}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="mb-6 text-4xl font-bold text-white"
            >
              {showBalances ? formatCurrency(balance) : "••••••"}
            </motion.h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/60">Account</p>
                <p className="text-sm font-medium text-white font-mono">****{numericAccountNumber.slice(-4)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/60">Type</p>
                <p className="text-sm font-medium text-white">{accountTypeLabels[accountType]}</p>
              </div>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
        </motion.button>

        {/* Account Type Specific Features */}
        {accountType === "joint" && (
          <Card className="border-purple-500/20 bg-purple-500/10 p-4 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <Users className="size-5 text-purple-400" />
              <div className="flex-1">
                <h4 className="font-semibold text-purple-400">Joint Account Features</h4>
                <p className="text-sm text-purple-400/80">
                  Shared balance • Split expenses • Joint budgeting
                </p>
              </div>
            </div>
          </Card>
        )}

        {accountType === "business_elite" && (
          <Card className="border-amber-500/20 bg-amber-500/10 p-4 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <Briefcase className="size-5 text-amber-400" />
              <div className="flex-1">
                <h4 className="font-semibold text-amber-400">Business Elite Features</h4>
                <p className="text-sm text-amber-400/80">
                  Cash flow tools • Team tracking • $50K daily limit
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
              >
                <PieChart className="size-4 mr-1" />
                Analytics
              </Button>
            </div>
          </Card>
        )}

        {/* Alerts Section */}
        {balance < 100 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 backdrop-blur-xl"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-5 text-yellow-400" />
              <div className="flex-1">
                <h4 className="font-semibold text-yellow-400">Low Balance Alert</h4>
                <p className="text-sm text-yellow-400/80">
                  Your account balance is below $100. Consider adding funds.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {balance > 500 && transactions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-green-500/20 bg-green-500/10 p-4 backdrop-blur-xl"
          >
            <div className="flex items-start gap-3">
              <TrendingUp className="size-5 text-green-400" />
              <div className="flex-1">
                <h4 className="font-semibold text-green-400">Great Balance!</h4>
                <p className="text-sm text-green-400/80">
                  You're maintaining a healthy balance. Keep it up!
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Collapsible Quick Actions */}
        <AnimatePresence>
          {isFabOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 overflow-hidden"
            >
              {/* Primary Quick Actions Grid */}
              <div className="grid grid-cols-4 gap-2">
                <Button
                  onClick={() => { setIsTransferOpen(true); setIsFabOpen(false); }}
                  className="h-16 flex-col gap-1 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-xl p-2"
                  variant="outline"
                  aria-label="Send money to another user"
                >
                  <Send className="size-4 text-white" />
                  <span className="text-xs text-white">Transfer</span>
                </Button>

                <Button
                  onClick={() => { setIsP2PTransferOpen(true); setIsFabOpen(false); }}
                  className="h-16 flex-col gap-1 bg-gradient-to-br from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 border border-green-500/30 backdrop-blur-xl p-2"
                  variant="outline"
                  aria-label="Send money instantly to friends"
                >
                  <Zap className="size-4 text-green-400" />
                  <span className="text-xs text-green-400">P2P</span>
                </Button>

                <Button
                  onClick={() => { setIsBillPayOpen(true); setIsFabOpen(false); }}
                  className="h-16 flex-col gap-1 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-xl p-2"
                  variant="outline"
                  aria-label="Bill pay"
                >
                  <Receipt className="size-4 text-white" />
                  <span className="text-xs text-white">Bills</span>
                </Button>

                <Button
                  onClick={() => { setIsTransactionSearchOpen(true); setIsFabOpen(false); }}
                  className="h-16 flex-col gap-1 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-xl p-2"
                  variant="outline"
                  aria-label="Search transactions"
                >
                  <Search className="size-4 text-white" />
                  <span className="text-xs text-white">Search</span>
                </Button>
              </div>

              {/* Advanced Features Grid */}
              <div className="grid grid-cols-4 gap-2">
                <Button
                  onClick={() => { setIsRecurringTransfersOpen(true); setIsFabOpen(false); }}
                  className="relative h-16 flex-col gap-1 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-xl p-2"
                  variant="outline"
                  aria-label="Recurring transfers"
                >
                  <RefreshCw className="size-4 text-white" />
                  <span className="text-xs text-white">Recurring</span>
                  {upcomingTransfersCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                      {upcomingTransfersCount}
                    </span>
                  )}
                </Button>

                <Button
                  onClick={() => { setIsMultiAccountOpen(true); setIsFabOpen(false); }}
                  className="h-16 flex-col gap-1 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-xl p-2"
                  variant="outline"
                  aria-label="Manage accounts"
                >
                  <Wallet className="size-4 text-white" />
                  <span className="text-xs text-white">Accounts</span>
                </Button>

                <Button
                  onClick={() => { setIsVirtualCardsOpen(true); setIsFabOpen(false); }}
                  className="relative h-16 flex-col gap-1 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-xl p-2"
                  variant="outline"
                  aria-label="Virtual cards"
                >
                  <CreditCard className="size-4 text-white" />
                  <span className="text-xs text-white">Cards</span>
                  {activeVirtualCardsCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-green-500 text-xs text-white">
                      {activeVirtualCardsCount}
                    </span>
                  )}
                </Button>

                <Button
                  onClick={() => onNavigate("history")}
                  className="h-16 flex-col gap-1 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-xl p-2"
                  variant="outline"
                  aria-label="Transaction history"
                >
                  <FileText className="size-4 text-white" />
                  <span className="text-xs text-white">History</span>
                </Button>

                <Button
                  onClick={() => { setIsJointInviteOpen(true); setIsFabOpen(false); }}
                  className="h-16 flex-col gap-1 bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-xl p-2"
                  variant="outline"
                  aria-label="Invite someone to a joint account"
                >
                  <Users className="size-4 text-white" />
                  <span className="text-xs text-white">Joint Invite</span>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Actions Toggle Button */}
        <Button
          onClick={() => setIsFabOpen(!isFabOpen)}
          className={`w-full h-12 flex items-center justify-center gap-2 ${
            isFabOpen
              ? "bg-white/20 border-white/30"
              : "bg-gradient-to-r from-blue-500 to-purple-500 border-transparent"
          } border backdrop-blur-xl`}
          variant="outline"
          aria-expanded={isFabOpen}
          aria-label="Toggle quick actions"
        >
          {isFabOpen ? (
            <>
              <X className="size-5 text-white" />
              <span className="text-white font-medium">Close Actions</span>
            </>
          ) : (
            <>
              <Plus className="size-5 text-white" />
              <span className="text-white font-medium">Quick Actions</span>
            </>
          )}
        </Button>

        {/* AI Insights - Personalized financial tips */}
        <AIInsights
          transactions={transactions}
          balance={balance}
          compact
        />

        {/* Savings Goals with Gamification */}
        <SavingsGoals compact />

        <SpendingChart transactions={transactions} accountId={currentUser.account.id} />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
            {transactions.length > 0 && (
              <button
                onClick={() => onNavigate("history")}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                View All
              </button>
            )}
          </div>

          {isLoading ? (
            <TransactionSkeleton />
          ) : transactions.length === 0 ? (
            <Card className="border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
              <p className="text-white/60">No transactions yet</p>
              <p className="mt-1 text-sm text-white/40">Start sending money to see your activity</p>
            </Card>
          ) : (
            <div className="space-y-2">
              {transactions.slice(0, 5).map((tx) => {
                const type = getTransactionType(tx, currentUser.account.id);
                const isSent = type === "sent";

                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl"
                  >
                    <div
                      className={`rounded-full p-2 ${
                        isSent ? "bg-red-500/20" : "bg-green-500/20"
                      }`}
                      aria-hidden="true"
                    >
                      {isSent ? (
                        <ArrowUpRight className="size-5 text-red-400" />
                      ) : (
                        <ArrowDownLeft className="size-5 text-green-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">
                        {isSent ? "Sent" : "Received"}
                      </p>
                      <p className="text-sm text-white/60">
                        {formatDate(tx.create_time)}
                      </p>
                    </div>
                    <p
                      className={`text-lg font-semibold ${
                        isSent ? "text-red-400" : "text-green-400"
                      }`}
                    >
                      {isSent ? "-" : "+"}
                      {formatCurrency(tx.amount)}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <TransferModal
        open={isTransferOpen}
        onOpenChange={setIsTransferOpen}
        onSuccess={handleTransferSuccess}
      />

      <MobileDepositModal
        open={isMobileDepositOpen}
        onOpenChange={setIsMobileDepositOpen}
        onSuccess={handleTransferSuccess}
      />

      <BillPayModal
        open={isBillPayOpen}
        onOpenChange={setIsBillPayOpen}
        onSuccess={handleTransferSuccess}
      />

      <TransactionSearch
        open={isTransactionSearchOpen}
        onOpenChange={setIsTransactionSearchOpen}
      />

      <RecurringTransfersModal
        open={isRecurringTransfersOpen}
        onOpenChange={setIsRecurringTransfersOpen}
      />

      <MultiAccountModal
        open={isMultiAccountOpen}
        onOpenChange={(open) => {
          setIsMultiAccountOpen(open);
          if (!open) loadData(); // Refresh balance when modal closes
        }}
      />

      <BalanceAlertsModal
        open={isBalanceAlertsOpen}
        onOpenChange={setIsBalanceAlertsOpen}
      />

      <VirtualCardsModal
        open={isVirtualCardsOpen}
        onOpenChange={(open) => {
          setIsVirtualCardsOpen(open);
          if (!open) loadData(); // Refresh count when modal closes
        }}
      />

      <P2PTransferModal
        open={isP2PTransferOpen}
        onOpenChange={setIsP2PTransferOpen}
        onTransferComplete={loadData}
      />

      <JointAccountInviteModal
        open={isJointInviteOpen}
        onOpenChange={setIsJointInviteOpen}
      />

      {/* Account Details Modal */}
      <Dialog open={isAccountDetailsOpen} onOpenChange={setIsAccountDetailsOpen}>
        <DialogContent className="bg-slate-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Account Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* User Info */}
            <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <Avatar className="size-16 border-2 border-white/20">
                <AvatarFallback className={`bg-gradient-to-br ${accountTypeGradients[accountType]} text-white font-bold text-xl`}>
                  {currentUser.user.full_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-lg font-bold text-white">{currentUser.user.full_name}</h3>
                <p className="text-white/60">{currentUser.user.email}</p>
                <div className="flex items-center gap-1 mt-1">
                  {accountTypeIcons[accountType]}
                  <span className="text-sm text-white/80">{accountTypeLabels[accountType]}</span>
                </div>
              </div>
            </div>

            {/* Account Numbers */}
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-white/60">Account Number</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyAccountNumber}
                    className="text-blue-400 hover:text-blue-300 h-6 px-2"
                  >
                    <Copy className="size-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <p className="font-mono text-lg text-white">{numericAccountNumber}</p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-white/60">Routing Number</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyRoutingNumber}
                    className="text-blue-400 hover:text-blue-300 h-6 px-2"
                  >
                    <Copy className="size-3 mr-1" />
                    Copy
                  </Button>
                </div>
                <p className="font-mono text-lg text-white">{FINBANK_ROUTING_NUMBER}</p>
              </div>

              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="size-4 text-white/60" />
                  <span className="text-sm text-white/60">Bank Details</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Bank Name</span>
                    <span className="text-white">FinBank</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Account Type</span>
                    <span className="text-white">{accountTypeLabels[accountType]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Currency</span>
                    <span className="text-white">USD</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Status</span>
                    <span className="text-green-400">Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Current Balance */}
            <div className={`p-4 rounded-xl bg-gradient-to-br ${accountTypeGradients[accountType]}`}>
              <p className="text-sm text-white/80 mb-1">Current Balance</p>
              <p className="text-3xl font-bold text-white">
                {showBalances ? formatCurrency(balance) : "••••••"}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
