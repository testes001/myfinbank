import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  DollarSign,
  Shield,
  CreditCard,
  TrendingUp,
  Megaphone,
  CheckCircle2,
  AlertTriangle,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

interface NotificationPreferences {
  transactions: { email: boolean; push: boolean; sms: boolean };
  security: { email: boolean; push: boolean; sms: boolean };
  billPay: { email: boolean; push: boolean; sms: boolean };
  deposits: { email: boolean; push: boolean; sms: boolean };
  marketing: { email: boolean; push: boolean; sms: boolean };
}

interface NotificationsTabProps {
  notificationPreferences: NotificationPreferences;
  onPreferenceChange: (
    category: keyof NotificationPreferences,
    channel: "email" | "push" | "sms",
    value: boolean
  ) => void;
  onSavePreferences: () => void;
}

export function NotificationsTab({
  notificationPreferences,
  onPreferenceChange,
  onSavePreferences,
}: NotificationsTabProps) {
  const handleToggle = (
    category: keyof NotificationPreferences,
    channel: "email" | "push" | "sms",
    value: boolean
  ) => {
    onPreferenceChange(category, channel, value);
    toast.success(`${channel.toUpperCase()} notifications ${value ? "enabled" : "disabled"} for ${category}`);
  };

  const handleEnableAll = () => {
    const categories: (keyof NotificationPreferences)[] = [
      "transactions",
      "security",
      "billPay",
      "deposits",
    ];
    categories.forEach((category) => {
      ["email", "push", "sms"].forEach((channel) => {
        onPreferenceChange(
          category,
          channel as "email" | "push" | "sms",
          true
        );
      });
    });
    toast.success("All notifications enabled");
  };

  const handleDisableAll = () => {
    const categories: (keyof NotificationPreferences)[] = [
      "transactions",
      "security",
      "billPay",
      "deposits",
      "marketing",
    ];
    categories.forEach((category) => {
      ["email", "push", "sms"].forEach((channel) => {
        onPreferenceChange(
          category,
          channel as "email" | "push" | "sms",
          false
        );
      });
    });
    toast.success("All notifications disabled");
  };

  const getTotalEnabled = () => {
    let total = 0;
    Object.values(notificationPreferences).forEach((pref) => {
      Object.values(pref).forEach((enabled) => {
        if (enabled) total++;
      });
    });
    return total;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Notification Overview */}
      <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-full bg-blue-500/20">
              <Bell className="size-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Notification Preferences
              </h3>
              <p className="text-sm text-white/60">
                {getTotalEnabled()} notification types enabled
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleEnableAll}
              className="border-white/20 bg-white/10 text-white hover:bg-white/20"
            >
              Enable All
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDisableAll}
              className="text-white/60 hover:bg-white/10"
            >
              Disable All
            </Button>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-white/5 p-3">
            <Mail className="size-5 text-blue-400" />
            <div>
              <p className="text-xs text-white/60">Email</p>
              <p className="text-lg font-semibold text-white">
                {Object.values(notificationPreferences).filter((p) => p.email)
                  .length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-white/5 p-3">
            <Smartphone className="size-5 text-purple-400" />
            <div>
              <p className="text-xs text-white/60">Push</p>
              <p className="text-lg font-semibold text-white">
                {Object.values(notificationPreferences).filter((p) => p.push)
                  .length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-white/5 p-3">
            <MessageSquare className="size-5 text-green-400" />
            <div>
              <p className="text-xs text-white/60">SMS</p>
              <p className="text-lg font-semibold text-white">
                {Object.values(notificationPreferences).filter((p) => p.sms)
                  .length}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Transaction Notifications */}
      <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-green-500/20">
            <DollarSign className="size-5 text-green-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">
              Transaction Alerts
            </h3>
            <p className="text-sm text-white/60">
              Get notified about account transactions and balance changes
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-white/5 p-3 border border-white/10">
            <div className="flex items-center gap-3">
              <Mail className="size-4 text-blue-400" />
              <Label className="text-white">Email</Label>
            </div>
            <Switch
              checked={notificationPreferences.transactions.email}
              onCheckedChange={(value) =>
                handleToggle("transactions", "email", value)
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-white/5 p-3 border border-white/10">
            <div className="flex items-center gap-3">
              <Smartphone className="size-4 text-purple-400" />
              <Label className="text-white">Push Notification</Label>
            </div>
            <Switch
              checked={notificationPreferences.transactions.push}
              onCheckedChange={(value) =>
                handleToggle("transactions", "push", value)
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-white/5 p-3 border border-white/10">
            <div className="flex items-center gap-3">
              <MessageSquare className="size-4 text-green-400" />
              <Label className="text-white">SMS Text</Label>
            </div>
            <Switch
              checked={notificationPreferences.transactions.sms}
              onCheckedChange={(value) =>
                handleToggle("transactions", "sms", value)
              }
            />
          </div>
        </div>
      </Card>

      {/* Security Notifications */}
      <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-red-500/20">
            <Shield className="size-5 text-red-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">
              Security Alerts
              <Badge className="ml-2 bg-red-500/20 text-red-400 text-xs">
                Recommended
              </Badge>
            </h3>
            <p className="text-sm text-white/60">
              Important alerts about account security and suspicious activity
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-white/5 p-3 border border-white/10">
            <div className="flex items-center gap-3">
              <Mail className="size-4 text-blue-400" />
              <Label className="text-white">Email</Label>
            </div>
            <Switch
              checked={notificationPreferences.security.email}
              onCheckedChange={(value) =>
                handleToggle("security", "email", value)
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-white/5 p-3 border border-white/10">
            <div className="flex items-center gap-3">
              <Smartphone className="size-4 text-purple-400" />
              <Label className="text-white">Push Notification</Label>
            </div>
            <Switch
              checked={notificationPreferences.security.push}
              onCheckedChange={(value) =>
                handleToggle("security", "push", value)
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-white/5 p-3 border border-white/10">
            <div className="flex items-center gap-3">
              <MessageSquare className="size-4 text-green-400" />
              <Label className="text-white">SMS Text</Label>
            </div>
            <Switch
              checked={notificationPreferences.security.sms}
              onCheckedChange={(value) =>
                handleToggle("security", "sms", value)
              }
            />
          </div>
        </div>
        <Alert className="mt-3 bg-red-500/10 border-red-500/20">
          <Shield className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-200 text-sm">
            We strongly recommend keeping all security alerts enabled to protect
            your account from unauthorized access.
          </AlertDescription>
        </Alert>
      </Card>

      {/* Bill Pay Notifications */}
      <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/20">
            <CreditCard className="size-5 text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">
              Bill Pay & Payments
            </h3>
            <p className="text-sm text-white/60">
              Reminders and confirmations for scheduled payments
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-white/5 p-3 border border-white/10">
            <div className="flex items-center gap-3">
              <Mail className="size-4 text-blue-400" />
              <Label className="text-white">Email</Label>
            </div>
            <Switch
              checked={notificationPreferences.billPay.email}
              onCheckedChange={(value) =>
                handleToggle("billPay", "email", value)
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-white/5 p-3 border border-white/10">
            <div className="flex items-center gap-3">
              <Smartphone className="size-4 text-purple-400" />
              <Label className="text-white">Push Notification</Label>
            </div>
            <Switch
              checked={notificationPreferences.billPay.push}
              onCheckedChange={(value) =>
                handleToggle("billPay", "push", value)
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-white/5 p-3 border border-white/10">
            <div className="flex items-center gap-3">
              <MessageSquare className="size-4 text-green-400" />
              <Label className="text-white">SMS Text</Label>
            </div>
            <Switch
              checked={notificationPreferences.billPay.sms}
              onCheckedChange={(value) =>
                handleToggle("billPay", "sms", value)
              }
            />
          </div>
        </div>
      </Card>

      {/* Deposits & Transfers */}
      <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-cyan-500/20">
            <TrendingUp className="size-5 text-cyan-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">
              Deposits & Transfers
            </h3>
            <p className="text-sm text-white/60">
              Updates about incoming deposits and transfer status
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-white/5 p-3 border border-white/10">
            <div className="flex items-center gap-3">
              <Mail className="size-4 text-blue-400" />
              <Label className="text-white">Email</Label>
            </div>
            <Switch
              checked={notificationPreferences.deposits.email}
              onCheckedChange={(value) =>
                handleToggle("deposits", "email", value)
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-white/5 p-3 border border-white/10">
            <div className="flex items-center gap-3">
              <Smartphone className="size-4 text-purple-400" />
              <Label className="text-white">Push Notification</Label>
            </div>
            <Switch
              checked={notificationPreferences.deposits.push}
              onCheckedChange={(value) =>
                handleToggle("deposits", "push", value)
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-white/5 p-3 border border-white/10">
            <div className="flex items-center gap-3">
              <MessageSquare className="size-4 text-green-400" />
              <Label className="text-white">SMS Text</Label>
            </div>
            <Switch
              checked={notificationPreferences.deposits.sms}
              onCheckedChange={(value) =>
                handleToggle("deposits", "sms", value)
              }
            />
          </div>
        </div>
      </Card>

      {/* Marketing & Promotions */}
      <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-pink-500/20">
            <Megaphone className="size-5 text-pink-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">
              Marketing & Promotions
            </h3>
            <p className="text-sm text-white/60">
              Special offers, new features, and product updates
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between rounded-lg bg-white/5 p-3 border border-white/10">
            <div className="flex items-center gap-3">
              <Mail className="size-4 text-blue-400" />
              <Label className="text-white">Email</Label>
            </div>
            <Switch
              checked={notificationPreferences.marketing.email}
              onCheckedChange={(value) =>
                handleToggle("marketing", "email", value)
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-white/5 p-3 border border-white/10">
            <div className="flex items-center gap-3">
              <Smartphone className="size-4 text-purple-400" />
              <Label className="text-white">Push Notification</Label>
            </div>
            <Switch
              checked={notificationPreferences.marketing.push}
              onCheckedChange={(value) =>
                handleToggle("marketing", "push", value)
              }
            />
          </div>
          <div className="flex items-center justify-between rounded-lg bg-white/5 p-3 border border-white/10">
            <div className="flex items-center gap-3">
              <MessageSquare className="size-4 text-green-400" />
              <Label className="text-white">SMS Text</Label>
            </div>
            <Switch
              checked={notificationPreferences.marketing.sms}
              onCheckedChange={(value) =>
                handleToggle("marketing", "sms", value)
              }
            />
          </div>
        </div>
      </Card>

      {/* Notification Tips */}
      <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-3">
          <AlertTriangle className="size-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">
            Notification Tips
          </h3>
        </div>
        <ul className="space-y-2 text-sm text-white/60">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="size-4 mt-0.5 text-green-400 flex-shrink-0" />
            <span>
              Keep security alerts enabled on all channels for maximum protection
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="size-4 mt-0.5 text-green-400 flex-shrink-0" />
            <span>
              Enable transaction alerts to quickly detect unauthorized activity
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="size-4 mt-0.5 text-green-400 flex-shrink-0" />
            <span>
              SMS notifications use your carrier's data rates
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="size-4 mt-0.5 text-green-400 flex-shrink-0" />
            <span>
              You can customize notification preferences at any time
            </span>
          </li>
        </ul>
      </Card>

      {/* Save Button */}
      <Card className="border-white/10 bg-white/5 p-4 backdrop-blur-xl">
        <Button
          onClick={onSavePreferences}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
        >
          <Settings className="mr-2 size-4" />
          Save Notification Preferences
        </Button>
      </Card>
    </motion.div>
  );
}
