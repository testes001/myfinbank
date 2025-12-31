import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Mail,
  Smartphone,
  MessageSquare,
  CheckCircle2,
  Settings,
  DollarSign,
  Shield,
  CreditCard,
  TrendingUp,
  Megaphone,
  Info,
} from "lucide-react";
import { BaseModal, useModalState } from "@/components/ui/base-modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  notificationPreferencesSchema,
  type NotificationPreferencesFormData,
  formatZodError,
} from "@/lib/validations/profile-schemas";
import { notificationToasts, showError } from "@/lib/toast-messages";

interface NotificationPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPreferences: NotificationPreferencesFormData;
  onSave: (preferences: NotificationPreferencesFormData) => Promise<void>;
}

type NotificationCategory = keyof NotificationPreferencesFormData;
type NotificationChannel = "email" | "push" | "sms";

const CATEGORIES = [
  {
    key: "transactions" as NotificationCategory,
    label: "Transactions",
    icon: DollarSign,
    description: "Purchase alerts, refunds, and payment confirmations",
    color: "text-green-400",
  },
  {
    key: "security" as NotificationCategory,
    label: "Security",
    icon: Shield,
    description: "Login alerts, password changes, and suspicious activity",
    color: "text-red-400",
  },
  {
    key: "billPay" as NotificationCategory,
    label: "Bill Pay",
    icon: CreditCard,
    description: "Bill reminders, payment confirmations, and due dates",
    color: "text-blue-400",
  },
  {
    key: "deposits" as NotificationCategory,
    label: "Deposits",
    icon: TrendingUp,
    description: "Direct deposits, check deposits, and transfers",
    color: "text-cyan-400",
  },
  {
    key: "marketing" as NotificationCategory,
    label: "Marketing",
    icon: Megaphone,
    description: "Promotional offers, new features, and newsletters",
    color: "text-purple-400",
  },
];

const CHANNELS = [
  { key: "email" as NotificationChannel, label: "Email", icon: Mail },
  { key: "push" as NotificationChannel, label: "Push", icon: Smartphone },
  { key: "sms" as NotificationChannel, label: "SMS", icon: MessageSquare },
];

export default function NotificationPreferencesModal({
  isOpen,
  onClose,
  currentPreferences,
  onSave,
}: NotificationPreferencesModalProps) {
  const [preferences, setPreferences] =
    useState<NotificationPreferencesFormData>(currentPreferences);
  const modalState = useModalState();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setPreferences(currentPreferences);
      modalState.reset();
    }
  }, [isOpen, currentPreferences]);

  const handleToggle = (
    category: NotificationCategory,
    channel: NotificationChannel,
    value: boolean,
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [channel]: value,
      },
    }));
  };

  const handleCategoryToggle = (category: NotificationCategory, value: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      [category]: {
        email: value,
        push: value,
        sms: value,
      },
    }));
  };

  const handleEnableAll = () => {
    const allEnabled: NotificationPreferencesFormData = {
      transactions: { email: true, push: true, sms: true },
      security: { email: true, push: true, sms: true },
      billPay: { email: true, push: true, sms: true },
      deposits: { email: true, push: true, sms: true },
      marketing: { email: true, push: true, sms: true },
    };
    setPreferences(allEnabled);
  };

  const handleDisableAll = () => {
    const allDisabled: NotificationPreferencesFormData = {
      transactions: { email: false, push: false, sms: false },
      security: { email: false, push: false, sms: false },
      billPay: { email: false, push: false, sms: false },
      deposits: { email: false, push: false, sms: false },
      marketing: { email: false, push: false, sms: false },
    };
    setPreferences(allDisabled);
  };

  const getTotalEnabled = (): number => {
    let total = 0;
    Object.values(preferences).forEach((pref) => {
      Object.values(pref).forEach((enabled) => {
        if (enabled) total++;
      });
    });
    return total;
  };

  const getCategoryEnabled = (category: NotificationCategory): number => {
    return Object.values(preferences[category]).filter(Boolean).length;
  };

  const hasChanges = (): boolean => {
    return JSON.stringify(preferences) !== JSON.stringify(currentPreferences);
  };

  const validateForm = (): boolean => {
    const result = notificationPreferencesSchema.safeParse(preferences);

    if (!result.success) {
      showError(formatZodError(result.error));
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    // Validate form
    if (!validateForm()) {
      return;
    }

    modalState.setSubmitting();

    try {
      await onSave(preferences);

      modalState.setSuccess();
      // Toast batching: Single toast on save, not per toggle
      notificationToasts.preferencesSaved();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to save notification preferences";
      modalState.setError(errorMessage);
    }
  };

  const handleClose = () => {
    if (!modalState.isSubmitting) {
      setPreferences(currentPreferences);
      modalState.reset();
      onClose();
    }
  };

  const totalEnabled = getTotalEnabled();
  const totalPossible = 15; // 5 categories × 3 channels

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Notification Preferences"
      description="Choose how you want to receive notifications across different channels"
      icon={Bell}
      iconColor="bg-blue-500/20"
      state={modalState.state}
      error={modalState.error}
      successMessage="Notification preferences saved successfully!"
      size="lg"
      footer={
        <>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={modalState.isSubmitting}
            className="border-white/20 bg-white/10 text-white hover:bg-white/20"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={modalState.isSubmitting || !hasChanges()}
            className="bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
          >
            <CheckCircle2 className="mr-2 size-4" />
            Save Preferences
          </Button>
        </>
      }
    >
      <div className="space-y-4 py-4 max-h-[calc(85vh-200px)] overflow-y-auto pr-2">
        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-4 border border-blue-500/20"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Settings className="size-5 text-blue-400" />
              <h3 className="text-white font-semibold">Notification Summary</h3>
            </div>
            <Badge className="bg-blue-500/20 text-blue-400">
              {totalEnabled} of {totalPossible} enabled
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {CHANNELS.map((channel) => {
              const ChannelIcon = channel.icon;
              const channelCount = Object.values(preferences).filter(
                (pref) => pref[channel.key],
              ).length;
              return (
                <div
                  key={channel.key}
                  className="text-center p-2 rounded-lg bg-white/5"
                >
                  <ChannelIcon className="size-5 text-white/60 mx-auto mb-1" />
                  <p className="text-xs text-white/60">{channel.label}</p>
                  <p className="text-lg font-semibold text-white">
                    {channelCount}
                  </p>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleEnableAll}
            variant="outline"
            size="sm"
            className="flex-1 border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20"
          >
            <CheckCircle2 className="mr-2 size-4" />
            Enable All
          </Button>
          <Button
            onClick={handleDisableAll}
            variant="outline"
            size="sm"
            className="flex-1 border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20"
          >
            Disable All
          </Button>
        </div>

        {/* Notification Categories */}
        <div className="space-y-3">
          {CATEGORIES.map((category) => {
            const CategoryIcon = category.icon;
            const categoryEnabled = getCategoryEnabled(category.key);
            const allCategoryEnabled = categoryEnabled === 3;
            const someCategoryEnabled = categoryEnabled > 0 && categoryEnabled < 3;

            return (
              <motion.div
                key={category.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-white/5 p-4 border border-white/10"
              >
                {/* Category Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <CategoryIcon
                      className={`size-5 ${category.color} mt-0.5 flex-shrink-0`}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-white">
                          {category.label}
                        </h4>
                        <Badge
                          variant="outline"
                          className="text-xs text-white/60 border-white/20"
                        >
                          {categoryEnabled}/3
                        </Badge>
                      </div>
                      <p className="text-xs text-white/60">
                        {category.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor={`${category.key}-all`}
                      className="text-xs text-white/60 cursor-pointer"
                    >
                      All
                    </Label>
                    <Switch
                      id={`${category.key}-all`}
                      checked={allCategoryEnabled}
                      onCheckedChange={(checked) =>
                        handleCategoryToggle(category.key, checked)
                      }
                      className={
                        someCategoryEnabled ? "opacity-50" : ""
                      }
                    />
                  </div>
                </div>

                {/* Channel Toggles */}
                <div className="grid grid-cols-3 gap-3 pl-8">
                  {CHANNELS.map((channel) => {
                    const ChannelIcon = channel.icon;
                    const isEnabled =
                      preferences[category.key][channel.key];

                    return (
                      <div
                        key={channel.key}
                        className={`rounded-lg p-3 border transition-colors ${
                          isEnabled
                            ? "bg-white/10 border-white/20"
                            : "bg-white/5 border-white/10"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <ChannelIcon
                            className={`size-4 ${
                              isEnabled ? "text-blue-400" : "text-white/40"
                            }`}
                          />
                          <Switch
                            id={`${category.key}-${channel.key}`}
                            checked={isEnabled}
                            onCheckedChange={(checked) =>
                              handleToggle(category.key, channel.key, checked)
                            }
                          />
                        </div>
                        <Label
                          htmlFor={`${category.key}-${channel.key}`}
                          className={`text-xs cursor-pointer ${
                            isEnabled ? "text-white" : "text-white/60"
                          }`}
                        >
                          {channel.label}
                        </Label>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Information Alert */}
        <div className="rounded-lg bg-blue-500/10 p-4 border border-blue-500/20">
          <div className="flex items-start gap-3">
            <Info className="size-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-blue-400 font-semibold text-sm mb-1">
                About Notifications
              </h4>
              <ul className="text-blue-200 text-sm space-y-1">
                <li>
                  • <strong>Email:</strong> Detailed summaries sent to your
                  inbox
                </li>
                <li>
                  • <strong>Push:</strong> Instant alerts on your mobile device
                </li>
                <li>
                  • <strong>SMS:</strong> Text messages for critical updates
                </li>
                <li className="mt-2 pt-2 border-t border-blue-500/20">
                  💡 <strong>Tip:</strong> We recommend keeping Security
                  notifications enabled on all channels for maximum account
                  protection.
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Changes Indicator */}
        {hasChanges() && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg bg-amber-500/10 p-4 border border-amber-500/20"
          >
            <div className="flex items-center gap-3">
              <Info className="size-5 text-amber-400 flex-shrink-0" />
              <p className="text-amber-200 text-sm">
                You have unsaved changes. Click "Save Preferences" to apply your
                changes.
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </BaseModal>
  );
}
