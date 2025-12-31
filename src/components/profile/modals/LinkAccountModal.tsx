import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Link as LinkIcon,
  CreditCard,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { BaseModal, useModalState } from "@/components/ui/base-modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SecurityAlert } from "@/components/ui/verification-alert";
import {
  linkAccountSchema,
  type LinkAccountFormData,
  formatZodError,
  getZodErrorMap,
} from "@/lib/validations/profile-schemas";
import { servicesToasts, showError } from "@/lib/toast-messages";

interface LinkAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLink: (accountData: {
    bankName: string;
    accountType: string;
    routingNumber: string;
    accountNumber: string;
  }) => Promise<void>;
}

type LinkStep = "input" | "verify";

export default function LinkAccountModal({
  isOpen,
  onClose,
  onLink,
}: LinkAccountModalProps) {
  const [step, setStep] = useState<LinkStep>("input");
  const [formData, setFormData] = useState<LinkAccountFormData>({
    bankName: "",
    accountType: "checking",
    routingNumber: "",
    accountNumber: "",
    confirmAccountNumber: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const modalState = useModalState();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        bankName: "",
        accountType: "checking",
        routingNumber: "",
        accountNumber: "",
        confirmAccountNumber: "",
      });
      setFieldErrors({});
      setStep("input");
      modalState.reset();
    }
  }, [isOpen]);

  const handleInputChange = (
    field: keyof LinkAccountFormData,
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error when user types
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const result = linkAccountSchema.safeParse(formData);

    if (!result.success) {
      const errors = getZodErrorMap(result.error);
      setFieldErrors(errors);
      showError(formatZodError(result.error));
      return false;
    }

    setFieldErrors({});
    return true;
  };

  const handleContinue = () => {
    // Validate form before proceeding to verification step
    if (validateForm()) {
      setStep("verify");
    }
  };

  const handleBack = () => {
    setStep("input");
    setFieldErrors({});
  };

  const handleSubmit = async () => {
    // Final validation before submission
    if (!validateForm()) {
      return;
    }

    modalState.setSubmitting();

    try {
      await onLink({
        bankName: formData.bankName,
        accountType: formData.accountType,
        routingNumber: formData.routingNumber,
        accountNumber: formData.accountNumber,
      });

      modalState.setSuccess();
      servicesToasts.accountLinked(formData.bankName);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to link external account";
      modalState.setError(errorMessage);
    }
  };

  const handleClose = () => {
    if (!modalState.isSubmitting) {
      setFormData({
        bankName: "",
        accountType: "checking",
        routingNumber: "",
        accountNumber: "",
        confirmAccountNumber: "",
      });
      setFieldErrors({});
      setStep("input");
      modalState.reset();
      onClose();
    }
  };

  const getTitle = () => {
    switch (step) {
      case "input":
        return "Link External Account";
      case "verify":
        return "Verify Account Information";
    }
  };

  const getDescription = () => {
    switch (step) {
      case "input":
        return "Enter your external bank account details securely";
      case "verify":
        return "Review your information before linking";
    }
  };

  const getFooter = () => {
    if (step === "input") {
      return (
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
            onClick={handleContinue}
            disabled={modalState.isSubmitting}
            className="bg-purple-500 hover:bg-purple-600 text-white"
          >
            Continue
            <ArrowRight className="ml-2 size-4" />
          </Button>
        </>
      );
    }

    if (step === "verify") {
      return (
        <>
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={modalState.isSubmitting}
            className="border-white/20 bg-white/10 text-white hover:bg-white/20"
          >
            <ArrowLeft className="mr-2 size-4" />
            Back
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={modalState.isSubmitting}
            className="bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
          >
            <CheckCircle2 className="mr-2 size-4" />
            Link Account
          </Button>
        </>
      );
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={getTitle()}
      description={getDescription()}
      icon={LinkIcon}
      iconColor="bg-purple-500/20"
      state={modalState.state}
      error={modalState.error}
      successMessage="External account linked successfully! Micro-deposits will be sent within 1-2 business days."
      size="md"
      footer={getFooter()}
      closeOnOverlayClick={false}
    >
      <AnimatePresence mode="wait">
        {step === "input" && (
          <motion.div
            key="input"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 py-4"
          >
            {/* Bank Name */}
            <div className="space-y-2">
              <Label htmlFor="bankName" className="text-white/80">
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 text-purple-400" />
                  Bank Name
                  <span className="text-red-400">*</span>
                </div>
              </Label>
              <Input
                id="bankName"
                placeholder="e.g., Chase, Bank of America, Wells Fargo"
                value={formData.bankName}
                onChange={(e) => handleInputChange("bankName", e.target.value)}
                className={`border-white/10 bg-white/5 text-white placeholder:text-white/40 ${
                  fieldErrors.bankName ? "border-red-500/50" : ""
                }`}
                autoComplete="off"
              />
              {fieldErrors.bankName && (
                <p className="text-sm text-red-400 flex items-center gap-1">
                  {fieldErrors.bankName}
                </p>
              )}
              <p className="text-xs text-white/60">
                Enter the name of your bank or credit union
              </p>
            </div>

            {/* Account Type */}
            <div className="space-y-2">
              <Label htmlFor="accountType" className="text-white/80">
                <div className="flex items-center gap-2">
                  <CreditCard className="size-4 text-blue-400" />
                  Account Type
                  <span className="text-red-400">*</span>
                </div>
              </Label>
              <Select
                value={formData.accountType}
                onValueChange={(value) =>
                  handleInputChange("accountType", value)
                }
              >
                <SelectTrigger
                  className={`border-white/10 bg-white/5 text-white ${
                    fieldErrors.accountType ? "border-red-500/50" : ""
                  }`}
                >
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Checking Account</SelectItem>
                  <SelectItem value="savings">Savings Account</SelectItem>
                </SelectContent>
              </Select>
              {fieldErrors.accountType && (
                <p className="text-sm text-red-400 flex items-center gap-1">
                  {fieldErrors.accountType}
                </p>
              )}
            </div>

            {/* Routing Number */}
            <div className="space-y-2">
              <Label htmlFor="routingNumber" className="text-white/80">
                <div className="flex items-center gap-2">
                  <Shield className="size-4 text-green-400" />
                  Routing Number
                  <span className="text-red-400">*</span>
                </div>
              </Label>
              <Input
                id="routingNumber"
                type="text"
                placeholder="9-digit routing number"
                maxLength={9}
                value={formData.routingNumber}
                onChange={(e) =>
                  handleInputChange(
                    "routingNumber",
                    e.target.value.replace(/\D/g, ""),
                  )
                }
                className={`border-white/10 bg-white/5 text-white placeholder:text-white/40 font-mono ${
                  fieldErrors.routingNumber ? "border-red-500/50" : ""
                }`}
                autoComplete="off"
              />
              {fieldErrors.routingNumber && (
                <p className="text-sm text-red-400 flex items-center gap-1">
                  {fieldErrors.routingNumber}
                </p>
              )}
              <p className="text-xs text-white/60">
                Found on the bottom left of your check
              </p>
            </div>

            {/* Account Number */}
            <div className="space-y-2">
              <Label htmlFor="accountNumber" className="text-white/80">
                <div className="flex items-center gap-2">
                  <Shield className="size-4 text-cyan-400" />
                  Account Number
                  <span className="text-red-400">*</span>
                </div>
              </Label>
              <Input
                id="accountNumber"
                type="text"
                placeholder="Account number (4-17 digits)"
                maxLength={17}
                value={formData.accountNumber}
                onChange={(e) =>
                  handleInputChange(
                    "accountNumber",
                    e.target.value.replace(/\D/g, ""),
                  )
                }
                className={`border-white/10 bg-white/5 text-white placeholder:text-white/40 font-mono ${
                  fieldErrors.accountNumber ? "border-red-500/50" : ""
                }`}
                autoComplete="off"
              />
              {fieldErrors.accountNumber && (
                <p className="text-sm text-red-400 flex items-center gap-1">
                  {fieldErrors.accountNumber}
                </p>
              )}
              <p className="text-xs text-white/60">
                Found on the bottom of your check, after the routing number
              </p>
            </div>

            {/* Confirm Account Number */}
            <div className="space-y-2">
              <Label htmlFor="confirmAccountNumber" className="text-white/80">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-green-400" />
                  Confirm Account Number
                  <span className="text-red-400">*</span>
                </div>
              </Label>
              <Input
                id="confirmAccountNumber"
                type="text"
                placeholder="Re-enter account number"
                maxLength={17}
                value={formData.confirmAccountNumber}
                onChange={(e) =>
                  handleInputChange(
                    "confirmAccountNumber",
                    e.target.value.replace(/\D/g, ""),
                  )
                }
                className={`border-white/10 bg-white/5 text-white placeholder:text-white/40 font-mono ${
                  fieldErrors.confirmAccountNumber ? "border-red-500/50" : ""
                }`}
                autoComplete="off"
              />
              {fieldErrors.confirmAccountNumber && (
                <p className="text-sm text-red-400 flex items-center gap-1">
                  {fieldErrors.confirmAccountNumber}
                </p>
              )}
              <p className="text-xs text-white/60">
                Please re-enter your account number to confirm
              </p>
            </div>

            {/* Security Alert */}
            <SecurityAlert
              title="Your Security is Our Priority"
              message="Your account information is encrypted using bank-level security. We'll send two small deposits (less than $1 each) to verify your account ownership."
            />
          </motion.div>
        )}

        {step === "verify" && (
          <motion.div
            key="verify"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 py-4"
          >
            {/* Account Summary Card */}
            <div className="rounded-lg bg-white/5 p-4 border border-white/10 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                <CheckCircle2 className="size-5 text-green-400" />
                <h3 className="text-white font-semibold">
                  Account Information Summary
                </h3>
              </div>

              <div className="flex items-start gap-3">
                <Building2 className="size-5 text-purple-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <Label className="text-sm text-white/60">Bank Name</Label>
                  <p className="text-white font-medium">{formData.bankName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CreditCard className="size-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <Label className="text-sm text-white/60">Account Type</Label>
                  <p className="text-white font-medium capitalize">
                    {formData.accountType}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Shield className="size-5 text-green-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <Label className="text-sm text-white/60">
                    Routing Number
                  </Label>
                  <p className="text-white font-mono text-lg">
                    {formData.routingNumber}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Shield className="size-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <Label className="text-sm text-white/60">
                    Account Number
                  </Label>
                  <p className="text-white font-mono text-lg">
                    ••••••••{formData.accountNumber.slice(-4)}
                  </p>
                  <p className="text-xs text-white/50 mt-1">
                    Last 4 digits shown for security
                  </p>
                </div>
              </div>
            </div>

            {/* Verification Process Info */}
            <div className="space-y-3">
              <div className="rounded-lg bg-amber-500/10 p-4 border border-amber-500/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="size-5 text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-amber-400 font-semibold text-sm mb-1">
                      Micro-Deposit Verification
                    </h4>
                    <p className="text-amber-200 text-sm">
                      We'll send two small deposits (less than $1 each) to your
                      account. This process typically takes 1-2 business days.
                      You'll need to verify these amounts to complete the
                      linking process.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-green-500/10 p-4 border border-green-500/20">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="size-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-green-400 font-semibold text-sm mb-1">
                      After Verification
                    </h4>
                    <p className="text-green-200 text-sm">
                      Once verified, you'll be able to transfer funds between
                      your accounts instantly. You can also set up automatic
                      transfers and bill payments.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-blue-500/10 p-4 border border-blue-500/20">
                <div className="flex items-start gap-3">
                  <Shield className="size-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="text-blue-400 font-semibold text-sm mb-1">
                      Security & Privacy
                    </h4>
                    <p className="text-blue-200 text-sm">
                      Your account information is encrypted and never shared
                      with third parties. You can remove this linked account at
                      any time from your profile settings.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </BaseModal>
  );
}
