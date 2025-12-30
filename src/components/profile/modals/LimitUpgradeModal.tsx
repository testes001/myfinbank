import { useState, useEffect } from "react";
import { ArrowUpCircle, Info, DollarSign } from "lucide-react";
import { BaseModal, useModalState } from "@/components/ui/base-modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  limitUpgradeSchema,
  type LimitUpgradeFormData,
  formatZodError,
  getZodErrorMap,
} from "@/lib/validations/profile-schemas";
import { servicesToasts, showError } from "@/lib/toast-messages";

interface LimitUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequest: (limitType: string, amount: number) => Promise<void>;
}

interface LimitOption {
  id: "daily_transfer" | "atm_withdrawal" | "mobile_deposit" | "wire_transfer";
  label: string;
  description: string;
  current: number;
  requested: number;
  icon: string;
}

const limitOptions: LimitOption[] = [
  {
    id: "daily_transfer",
    label: "Daily Transfer Limit",
    description: "Maximum daily transfer amount",
    current: 10000,
    requested: 25000,
    icon: "💸",
  },
  {
    id: "atm_withdrawal",
    label: "Daily ATM Withdrawal",
    description: "Maximum daily ATM withdrawal",
    current: 1000,
    requested: 2500,
    icon: "🏧",
  },
  {
    id: "mobile_deposit",
    label: "Mobile Deposit Limit",
    description: "Maximum mobile check deposit",
    current: 5000,
    requested: 10000,
    icon: "📱",
  },
  {
    id: "wire_transfer",
    label: "Wire Transfer Limit",
    description: "Maximum wire transfer amount",
    current: 50000,
    requested: 100000,
    icon: "🌐",
  },
];

export default function LimitUpgradeModal({
  isOpen,
  onClose,
  onRequest,
}: LimitUpgradeModalProps) {
  const [selectedType, setSelectedType] = useState<
    "daily_transfer" | "atm_withdrawal" | "mobile_deposit" | "wire_transfer"
  >("daily_transfer");
  const [reason, setReason] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const modalState = useModalState();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedType("daily_transfer");
      setReason("");
      setFieldErrors({});
      modalState.reset();
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    // Clear previous errors
    setFieldErrors({});

    const selected = limitOptions.find((opt) => opt.id === selectedType);
    if (!selected) {
      showError("Please select a valid limit type");
      return;
    }

    // Prepare data for validation
    const validationData: LimitUpgradeFormData = {
      limitType: selectedType,
      requestedAmount: selected.requested,
      reason: reason.trim() || undefined,
    };

    // Validate with Zod
    const result = limitUpgradeSchema.safeParse(validationData);

    if (!result.success) {
      const errors = getZodErrorMap(result.error);
      setFieldErrors(errors);
      showError(formatZodError(result.error));
      return;
    }

    modalState.setSubmitting();

    try {
      await onRequest(result.data.limitType, result.data.requestedAmount);
      modalState.setSuccess();
      servicesToasts.limitUpgradeRequested();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to submit limit upgrade request";
      modalState.setError(errorMessage);
      showError(errorMessage);
    }
  };

  const handleClose = () => {
    if (!modalState.isSubmitting) {
      setSelectedType("daily_transfer");
      setReason("");
      setFieldErrors({});
      modalState.reset();
      onClose();
    }
  };

  const selectedOption = limitOptions.find((opt) => opt.id === selectedType);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Request Limit Upgrade"
      description="Select which limit you'd like to increase and provide a reason"
      icon={ArrowUpCircle}
      iconColor="bg-amber-500/20"
      state={modalState.state}
      error={modalState.error}
      successMessage="Limit upgrade request submitted successfully"
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
            onClick={handleSubmit}
            disabled={modalState.isSubmitting}
            className="bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50"
          >
            <ArrowUpCircle className="mr-2 size-4" />
            {modalState.isSubmitting ? "Submitting..." : "Submit Request"}
          </Button>
        </>
      }
    >
      <div className="space-y-4 py-4">
        {/* Limit Type Selection */}
        <div className="space-y-3">
          <Label className="text-white/80">Select Limit Type</Label>
          <RadioGroup
            value={selectedType}
            onValueChange={(value) =>
              setSelectedType(
                value as
                  | "daily_transfer"
                  | "atm_withdrawal"
                  | "mobile_deposit"
                  | "wire_transfer",
              )
            }
            disabled={modalState.isSubmitting}
          >
            {limitOptions.map((option) => (
              <div
                key={option.id}
                className={`flex items-start gap-4 rounded-lg border p-4 transition-all cursor-pointer ${
                  selectedType === option.id
                    ? "border-amber-500/50 bg-amber-500/10 shadow-lg shadow-amber-500/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
                onClick={() => setSelectedType(option.id)}
              >
                <RadioGroupItem
                  value={option.id}
                  id={option.id}
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label
                    htmlFor={option.id}
                    className="flex items-center gap-2 text-base font-medium text-white cursor-pointer"
                  >
                    <span className="text-xl">{option.icon}</span>
                    {option.label}
                  </Label>
                  <p className="mt-1 text-sm text-white/60">
                    {option.description}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-sm">
                    <span className="text-white/60">
                      Current:{" "}
                      <span className="font-medium text-white">
                        ${option.current.toLocaleString()}
                      </span>
                    </span>
                    <span className="text-white/40">→</span>
                    <span className="text-amber-400">
                      Requested:{" "}
                      <span className="font-semibold">
                        ${option.requested.toLocaleString()}
                      </span>
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-1 text-xs text-emerald-400">
                    <DollarSign className="size-3" />
                    <span>
                      +$
                      {(
                        option.requested - option.current
                      ).toLocaleString()}{" "}
                      increase
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </RadioGroup>
          {fieldErrors.limitType && (
            <p className="text-xs text-red-400">{fieldErrors.limitType}</p>
          )}
        </div>

        {/* Reason (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="reason" className="text-white/80">
            Reason for Request{" "}
            <span className="text-white/40 font-normal">(Optional)</span>
          </Label>
          <Textarea
            id="reason"
            placeholder="Please explain why you need this limit increase (optional, but helps expedite review)..."
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (fieldErrors.reason) {
                setFieldErrors((prev) => {
                  const newErrors = { ...prev };
                  delete newErrors.reason;
                  return newErrors;
                });
              }
            }}
            maxLength={500}
            rows={4}
            className={`border-white/10 bg-white/5 text-white placeholder:text-white/40 resize-none ${
              fieldErrors.reason
                ? "border-red-500/50 focus-visible:ring-red-500"
                : ""
            }`}
            disabled={modalState.isSubmitting}
          />
          {fieldErrors.reason ? (
            <p className="text-xs text-red-400">{fieldErrors.reason}</p>
          ) : (
            <p className="text-xs text-white/60">
              {reason.length}/500 characters
              {reason.length >= 450 && (
                <span className="ml-2 text-amber-400">
                  ({500 - reason.length} remaining)
                </span>
              )}
            </p>
          )}
        </div>

        {/* Summary Card */}
        {selectedOption && (
          <div className="rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 p-4">
            <h4 className="text-sm font-medium text-white mb-3">
              Request Summary
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-white/60">Limit Type:</span>
                <span className="font-medium text-white">
                  {selectedOption.label}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Current Limit:</span>
                <span className="font-medium text-white">
                  ${selectedOption.current.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/60">Requested Limit:</span>
                <span className="font-semibold text-amber-400">
                  ${selectedOption.requested.toLocaleString()}
                </span>
              </div>
              <div className="pt-2 mt-2 border-t border-amber-500/20 flex items-center justify-between">
                <span className="text-white/60">Increase:</span>
                <span className="font-semibold text-emerald-400 flex items-center gap-1">
                  <ArrowUpCircle className="size-3" />$
                  {(
                    selectedOption.requested - selectedOption.current
                  ).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Info Alert */}
        <Alert className="bg-blue-500/10 border-blue-500/20">
          <Info className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-200 text-sm">
            <div className="space-y-1">
              <p>
                <strong className="font-medium">Review Process:</strong> Limit
                upgrade requests are typically reviewed within{" "}
                <span className="font-semibold">1-3 business days</span>.
              </p>
              <p className="text-xs text-blue-300 mt-2">
                We may require additional documentation such as proof of income
                or recent bank statements to verify your eligibility for the
                increased limit.
              </p>
            </div>
          </AlertDescription>
        </Alert>

        {/* Benefits Info */}
        <div className="rounded-lg bg-white/5 border border-white/10 p-4">
          <h4 className="text-sm font-medium text-white mb-2">
            ✨ Benefits of Higher Limits
          </h4>
          <ul className="space-y-1 text-xs text-white/60">
            <li>• Greater financial flexibility for large transactions</li>
            <li>• Faster access to your funds when you need them</li>
            <li>• Simplified management of business expenses</li>
            <li>• Enhanced account capabilities as your needs grow</li>
          </ul>
        </div>
      </div>
    </BaseModal>
  );
}
