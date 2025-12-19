import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getBalanceAlerts,
  addBalanceAlert,
  updateBalanceAlert,
  deleteBalanceAlert,
  type BalanceAlert,
} from "@/lib/notification-storage";
import { formatCurrency } from "@/lib/transactions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

interface BalanceAlertsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BalanceAlertsModal({ open, onOpenChange }: BalanceAlertsModalProps) {
  const { currentUser } = useAuth();
  const [alerts, setAlerts] = useState<BalanceAlert[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // Create form state
  const [alertType, setAlertType] = useState<BalanceAlert["type"]>("low_balance");
  const [threshold, setThreshold] = useState("");

  const loadAlerts = () => {
    if (!currentUser) return;
    const allAlerts = getBalanceAlerts(currentUser.user.id);
    setAlerts(allAlerts);
  };

  useEffect(() => {
    if (open) {
      loadAlerts();
    }
  }, [open, currentUser]);

  const handleCreateAlert = () => {
    if (!currentUser) return;

    const thresholdNum = parseFloat(threshold);
    if (isNaN(thresholdNum) || thresholdNum <= 0) {
      toast.error("Please enter a valid threshold amount");
      return;
    }

    try {
      addBalanceAlert({
        userId: currentUser.user.id,
        accountId: currentUser.account.id,
        type: alertType,
        threshold: thresholdNum,
        enabled: true,
      });

      toast.success("Balance alert created");
      setThreshold("");
      setIsCreating(false);
      loadAlerts();
    } catch (error) {
      toast.error("Failed to create alert");
    }
  };

  const handleToggleAlert = (alertId: string, enabled: boolean) => {
    updateBalanceAlert(alertId, { enabled });
    toast.success(enabled ? "Alert enabled" : "Alert disabled");
    loadAlerts();
  };

  const handleDeleteAlert = (alertId: string) => {
    deleteBalanceAlert(alertId);
    toast.success("Alert deleted");
    loadAlerts();
  };

  const getAlertIcon = (type: BalanceAlert["type"]) => {
    switch (type) {
      case "low_balance":
        return <TrendingDown className="size-5" />;
      case "high_balance":
        return <TrendingUp className="size-5" />;
      case "large_transaction":
        return <DollarSign className="size-5" />;
    }
  };

  const getAlertColor = (type: BalanceAlert["type"]) => {
    switch (type) {
      case "low_balance":
        return "bg-red-500/20 text-red-400";
      case "high_balance":
        return "bg-green-500/20 text-green-400";
      case "large_transaction":
        return "bg-yellow-500/20 text-yellow-400";
    }
  };

  const getAlertTitle = (type: BalanceAlert["type"]) => {
    switch (type) {
      case "low_balance":
        return "Low Balance Alert";
      case "high_balance":
        return "High Balance Alert";
      case "large_transaction":
        return "Large Transaction Alert";
    }
  };

  const getAlertDescription = (type: BalanceAlert["type"], threshold: number) => {
    switch (type) {
      case "low_balance":
        return `Alert when balance falls below ${formatCurrency(threshold)}`;
      case "high_balance":
        return `Alert when balance exceeds ${formatCurrency(threshold)}`;
      case "large_transaction":
        return `Alert for transactions of ${formatCurrency(threshold)} or more`;
    }
  };

  if (!currentUser) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-white/20 bg-slate-900/95 text-white backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <Bell className="size-5" />
            Balance Alerts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Balance Info */}
          <Card className="border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Current Balance</p>
                <p className="text-xl font-bold text-white">
                  {formatCurrency(parseFloat(currentUser.account.balance))}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-white/60">Primary Checking</p>
                <p className="text-sm text-white/40">****{currentUser.account.id.slice(-4)}</p>
              </div>
            </div>
          </Card>

          {/* Alert List */}
          <ScrollArea className="h-[300px] pr-4">
            {alerts.length === 0 && !isCreating ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertTriangle className="mb-4 size-12 text-white/20" />
                <p className="text-white/60">No balance alerts set</p>
                <p className="text-sm text-white/40">
                  Create alerts to monitor your account balance
                </p>
                <Button
                  onClick={() => setIsCreating(true)}
                  className="mt-4 bg-gradient-to-r from-blue-500 to-purple-500"
                >
                  <Plus className="mr-2 size-4" />
                  Create First Alert
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Create New Alert Form */}
                {isCreating && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="border-blue-500/20 bg-blue-500/10 p-4">
                      <h3 className="mb-3 flex items-center font-medium text-white">
                        <Plus className="mr-2 size-4" />
                        New Alert
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <Label className="text-white/60">Alert Type</Label>
                          <Select
                            value={alertType}
                            onValueChange={(v) => setAlertType(v as BalanceAlert["type"])}
                          >
                            <SelectTrigger className="mt-1 border-white/20 bg-white/10 text-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="border-white/20 bg-slate-900">
                              <SelectItem value="low_balance">
                                <div className="flex items-center">
                                  <TrendingDown className="mr-2 size-4 text-red-400" />
                                  Low Balance Alert
                                </div>
                              </SelectItem>
                              <SelectItem value="high_balance">
                                <div className="flex items-center">
                                  <TrendingUp className="mr-2 size-4 text-green-400" />
                                  High Balance Alert
                                </div>
                              </SelectItem>
                              <SelectItem value="large_transaction">
                                <div className="flex items-center">
                                  <DollarSign className="mr-2 size-4 text-yellow-400" />
                                  Large Transaction Alert
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-white/60">
                            Threshold Amount ($)
                          </Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            placeholder="Enter amount"
                            value={threshold}
                            onChange={(e) => setThreshold(e.target.value)}
                            className="mt-1 border-white/20 bg-white/10 text-white"
                          />
                        </div>

                        {/* Suggested Thresholds */}
                        <div className="flex flex-wrap gap-2">
                          {[100, 250, 500, 1000].map((amount) => (
                            <Button
                              key={amount}
                              variant="outline"
                              size="sm"
                              onClick={() => setThreshold(amount.toString())}
                              className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                            >
                              ${amount}
                            </Button>
                          ))}
                        </div>

                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsCreating(false);
                              setThreshold("");
                            }}
                            className="flex-1 border-white/20 bg-white/10 text-white hover:bg-white/20"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleCreateAlert}
                            disabled={!threshold}
                            className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500"
                          >
                            Create Alert
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                )}

                {/* Existing Alerts */}
                <AnimatePresence mode="popLayout">
                  {alerts.map((alert, index) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card
                        className={`border-white/10 p-4 ${
                          alert.enabled ? "bg-white/5" : "bg-white/5 opacity-50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`flex size-10 items-center justify-center rounded-full ${getAlertColor(
                              alert.type
                            )}`}
                          >
                            {getAlertIcon(alert.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">
                                {getAlertTitle(alert.type)}
                              </span>
                              {alert.enabled && (
                                <CheckCircle2 className="size-4 text-green-400" />
                              )}
                            </div>
                            <p className="text-sm text-white/60">
                              {getAlertDescription(alert.type, alert.threshold)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={alert.enabled}
                              onCheckedChange={(checked) =>
                                handleToggleAlert(alert.id, checked)
                              }
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteAlert(alert.id)}
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

                {/* Add More Button */}
                {alerts.length > 0 && !isCreating && (
                  <Button
                    variant="outline"
                    onClick={() => setIsCreating(true)}
                    className="w-full border-dashed border-white/20 bg-transparent text-white/60 hover:bg-white/10 hover:text-white"
                  >
                    <Plus className="mr-2 size-4" />
                    Add Another Alert
                  </Button>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Info Card */}
          <Card className="border-yellow-500/20 bg-yellow-500/10 p-3">
            <div className="flex items-start gap-2">
              <Settings className="mt-0.5 size-4 text-yellow-400" />
              <div>
                <p className="text-sm font-medium text-yellow-400">How alerts work</p>
                <p className="text-xs text-yellow-400/80">
                  You'll receive notifications when your account balance triggers an
                  alert condition. Manage notification preferences in Settings.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
