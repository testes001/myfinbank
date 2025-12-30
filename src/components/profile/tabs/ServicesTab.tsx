import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DollarSign,
  Building2,
  Link as LinkIcon,
  Plane,
  Send,
  TrendingUp,
  Edit,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  AlertTriangle,
  ArrowUpCircle,
} from "lucide-react";
import { toast } from "sonner";

interface ExternalAccount {
  id: string;
  bankName: string;
  accountType: string;
  lastFour: string;
  status: "active" | "pending" | "verification";
}

interface TravelNotification {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  status: "active" | "upcoming" | "past";
}

interface ServicesTabProps {
  overdraftEnabled: boolean;
  linkedSavingsForOverdraft: string;
  externalAccounts: ExternalAccount[];
  accountNickname: string;
  travelNotifications: TravelNotification[];
  onToggleOverdraft: () => void;
  onOpenLinkAccountModal: () => void;
  onOpenAccountNicknameModal: () => void;
  onOpenTravelNotificationModal: () => void;
  onOpenWireTransferModal: () => void;
  onOpenLimitUpgradeModal: () => void;
}

export function ServicesTab({
  overdraftEnabled,
  linkedSavingsForOverdraft,
  externalAccounts,
  accountNickname,
  travelNotifications,
  onToggleOverdraft,
  onOpenLinkAccountModal,
  onOpenAccountNicknameModal,
  onOpenTravelNotificationModal,
  onOpenWireTransferModal,
  onOpenLimitUpgradeModal,
}: ServicesTabProps) {
  const handleUnlinkAccount = (accountId: string) => {
    toast.success("External account unlinked successfully");
  };

  const handleRemoveTravelNotification = (notificationId: string) => {
    toast.success("Travel notification removed");
  };

  const activeAccounts = externalAccounts.filter((acc) => acc.status === "active");
  const pendingAccounts = externalAccounts.filter((acc) => acc.status === "pending" || acc.status === "verification");
  const activeTravelNotifications = travelNotifications.filter((tn) => tn.status === "active");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Account Nickname */}
      <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-blue-500/20">
              <Edit className="size-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Account Nickname
              </h3>
              <p className="text-sm text-white/60">
                Personalize your account with a custom name
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenAccountNicknameModal}
            className="border-white/20 bg-white/10 text-white hover:bg-white/20"
          >
            <Edit className="mr-2 size-3" />
            Edit
          </Button>
        </div>
        <div className="rounded-lg bg-white/5 p-4 border border-white/10">
          <Label className="text-sm text-white/60">Current Nickname</Label>
          <p className="mt-1 text-lg font-medium text-white">
            {accountNickname}
          </p>
        </div>
      </Card>

      {/* Overdraft Protection */}
      <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-green-500/20">
              <Shield className="size-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Overdraft Protection
              </h3>
              <p className="text-sm text-white/60">
                Link a savings account to prevent overdrafts
              </p>
            </div>
          </div>
          <Switch checked={overdraftEnabled} onCheckedChange={onToggleOverdraft} />
        </div>

        {overdraftEnabled ? (
          <div className="space-y-3">
            <Alert className="bg-green-500/10 border-green-500/20">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-200">
                Overdraft protection is active. Funds will be automatically
                transferred from your linked savings account if needed.
              </AlertDescription>
            </Alert>
            {linkedSavingsForOverdraft && (
              <div className="rounded-lg bg-white/5 p-4 border border-white/10">
                <Label className="text-sm text-white/60">Linked Account</Label>
                <p className="mt-1 text-white font-medium">
                  {linkedSavingsForOverdraft}
                </p>
              </div>
            )}
          </div>
        ) : (
          <Alert className="bg-amber-500/10 border-amber-500/20">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <AlertDescription className="text-amber-200">
              Overdraft protection is disabled. You may incur fees if your
              account balance goes below zero.
            </AlertDescription>
          </Alert>
        )}
      </Card>

      {/* External Accounts */}
      <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-purple-500/20">
              <LinkIcon className="size-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                External Accounts
              </h3>
              <p className="text-sm text-white/60">
                {activeAccounts.length + pendingAccounts.length} linked{" "}
                {activeAccounts.length + pendingAccounts.length === 1 ? "account" : "accounts"}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={onOpenLinkAccountModal}
            className="bg-purple-500 hover:bg-purple-600 text-white"
          >
            <Plus className="mr-2 size-3" />
            Link Account
          </Button>
        </div>

        {externalAccounts.length > 0 ? (
          <div className="space-y-2">
            {activeAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between rounded-lg bg-white/5 p-4 border border-white/10"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="size-5 text-white/60" />
                  <div>
                    <p className="font-medium text-white">{account.bankName}</p>
                    <p className="text-sm text-white/60">
                      {account.accountType} ••••{account.lastFour}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500/20 text-green-400">
                    <CheckCircle2 className="mr-1 size-3" />
                    Active
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleUnlinkAccount(account.id)}
                    className="text-red-400 hover:bg-red-500/10"
                  >
                    Unlink
                  </Button>
                </div>
              </div>
            ))}
            {pendingAccounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between rounded-lg bg-amber-500/5 p-4 border border-amber-500/20"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="size-5 text-amber-400" />
                  <div>
                    <p className="font-medium text-white">{account.bankName}</p>
                    <p className="text-sm text-white/60">
                      {account.accountType} ••••{account.lastFour}
                    </p>
                  </div>
                </div>
                <Badge className="bg-amber-500/20 text-amber-400">
                  <Clock className="mr-1 size-3" />
                  {account.status === "pending" ? "Pending" : "Verification Required"}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="flex size-16 items-center justify-center rounded-full bg-white/5 mx-auto mb-3">
              <LinkIcon className="size-8 text-white/40" />
            </div>
            <p className="text-white/60 mb-2">No external accounts linked</p>
            <p className="text-sm text-white/40">
              Link an external bank account to transfer funds
            </p>
          </div>
        )}
      </Card>

      {/* Travel Notifications */}
      <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-cyan-500/20">
              <Plane className="size-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Travel Notifications
              </h3>
              <p className="text-sm text-white/60">
                Alert us when you're traveling to avoid card declines
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={onOpenTravelNotificationModal}
            className="bg-cyan-500 hover:bg-cyan-600 text-white"
          >
            <Plus className="mr-2 size-3" />
            Add Travel
          </Button>
        </div>

        {activeTravelNotifications.length > 0 ? (
          <div className="space-y-2">
            {activeTravelNotifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-center justify-between rounded-lg bg-cyan-500/10 p-4 border border-cyan-500/20"
              >
                <div className="flex items-center gap-3">
                  <Plane className="size-5 text-cyan-400" />
                  <div>
                    <p className="font-medium text-white">
                      {notification.destination}
                    </p>
                    <p className="text-sm text-white/60">
                      {notification.startDate} - {notification.endDate}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-cyan-500/20 text-cyan-400">
                    <CheckCircle2 className="mr-1 size-3" />
                    Active
                  </Badge>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveTravelNotification(notification.id)}
                    className="text-white/60 hover:bg-white/10"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Alert className="bg-blue-500/10 border-blue-500/20">
            <Plane className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-200">
              No active travel notifications. Add one before your next trip to
              ensure uninterrupted card usage.
            </AlertDescription>
          </Alert>
        )}
      </Card>

      {/* Wire Transfers */}
      <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-indigo-500/20">
            <Send className="size-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Wire Transfers</h3>
            <p className="text-sm text-white/60">
              Send or receive domestic and international wire transfers
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <Button
            onClick={onOpenWireTransferModal}
            variant="outline"
            className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20 justify-start"
          >
            <Send className="mr-2 size-4" />
            Initiate Wire Transfer
          </Button>
          <Alert className="bg-amber-500/10 border-amber-500/20">
            <DollarSign className="h-4 w-4 text-amber-400" />
            <AlertDescription className="text-amber-200 text-sm">
              Wire transfers typically incur a fee. Domestic: $25, International: $45.
              Processing time: 1-3 business days.
            </AlertDescription>
          </Alert>
        </div>
      </Card>

      {/* Account Limits & Upgrades */}
      <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/20">
            <TrendingUp className="size-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              Limits & Upgrades
            </h3>
            <p className="text-sm text-white/60">
              Request higher transaction limits or account upgrades
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-lg bg-white/5 p-4 border border-white/10">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-white/60">Daily Transfer Limit</Label>
                <p className="mt-1 text-lg font-semibold text-white">$10,000</p>
              </div>
              <div>
                <Label className="text-xs text-white/60">Daily ATM Withdrawal</Label>
                <p className="mt-1 text-lg font-semibold text-white">$1,000</p>
              </div>
              <div>
                <Label className="text-xs text-white/60">Mobile Deposit Limit</Label>
                <p className="mt-1 text-lg font-semibold text-white">$5,000</p>
              </div>
              <div>
                <Label className="text-xs text-white/60">Wire Transfer Limit</Label>
                <p className="mt-1 text-lg font-semibold text-white">$50,000</p>
              </div>
            </div>
          </div>
          <Button
            onClick={onOpenLimitUpgradeModal}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
          >
            <ArrowUpCircle className="mr-2 size-4" />
            Request Limit Increase
          </Button>
        </div>
      </Card>

      {/* Service Recommendations */}
      <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-3">
          <AlertTriangle className="size-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">
            Available Services
          </h3>
        </div>
        <ul className="space-y-2 text-sm text-white/60">
          {!overdraftEnabled && (
            <li className="flex items-start gap-2">
              <span className="mt-1 size-1.5 rounded-full bg-blue-400" />
              <span>Enable overdraft protection to avoid insufficient fund fees</span>
            </li>
          )}
          {externalAccounts.length === 0 && (
            <li className="flex items-start gap-2">
              <span className="mt-1 size-1.5 rounded-full bg-blue-400" />
              <span>Link external accounts for easy fund transfers</span>
            </li>
          )}
          <li className="flex items-start gap-2">
            <span className="mt-1 size-1.5 rounded-full bg-blue-400" />
            <span>Set up automatic savings transfers to reach your goals faster</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 size-1.5 rounded-full bg-blue-400" />
            <span>Consider our premium account tier for higher limits and perks</span>
          </li>
        </ul>
      </Card>
    </motion.div>
  );
}
