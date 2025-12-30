import { motion } from "framer-motion";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Building2,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Link as LinkIcon,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";

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

export default function LinkAccountModal({
  isOpen,
  onClose,
  onLink,
}: LinkAccountModalProps) {
  const [step, setStep] = useState<"input" | "verify">("input");
  const [formData, setFormData] = useState({
    bankName: "",
    accountType: "",
    routingNumber: "",
    accountNumber: "",
    confirmAccountNumber: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.bankName.trim()) {
      newErrors.bankName = "Bank name is required";
    }

    if (!formData.accountType) {
      newErrors.accountType = "Account type is required";
    }

    if (!formData.routingNumber) {
      newErrors.routingNumber = "Routing number is required";
    } else if (!/^\d{9}$/.test(formData.routingNumber)) {
      newErrors.routingNumber = "Routing number must be 9 digits";
    }

    if (!formData.accountNumber) {
      newErrors.accountNumber = "Account number is required";
    } else if (formData.accountNumber.length < 4) {
      newErrors.accountNumber = "Account number is too short";
    }

    if (formData.accountNumber !== formData.confirmAccountNumber) {
      newErrors.confirmAccountNumber = "Account numbers do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = () => {
    if (validateForm()) {
      setStep("verify");
    }
  };

  const handleBack = () => {
    setStep("input");
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onLink({
        bankName: formData.bankName,
        accountType: formData.accountType,
        routingNumber: formData.routingNumber,
        accountNumber: formData.accountNumber,
      });
      toast.success("External account linked successfully");
      handleClose();
    } catch (error) {
      toast.error("Failed to link external account");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      bankName: "",
      accountType: "",
      routingNumber: "",
      accountNumber: "",
      confirmAccountNumber: "",
    });
    setErrors({});
    setStep("input");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="border-white/10 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 backdrop-blur-xl sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <div className="flex size-10 items-center justify-center rounded-full bg-purple-500/20">
              <LinkIcon className="size-5 text-purple-400" />
            </div>
            Link External Account
          </DialogTitle>
          <DialogDescription className="text-white/60">
            {step === "input"
              ? "Enter your external bank account details"
              : "Verify your information before linking"}
          </DialogDescription>
        </DialogHeader>

        {step === "input" ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 py-4"
          >
            <div className="space-y-2">
              <Label htmlFor="bankName" className="text-white/80">
                Bank Name *
              </Label>
              <Input
                id="bankName"
                placeholder="e.g., Chase, Bank of America"
                value={formData.bankName}
                onChange={(e) => handleInputChange("bankName", e.target.value)}
                className={`border-white/10 bg-white/5 text-white placeholder:text-white/40 ${
                  errors.bankName ? "border-red-500/50" : ""
                }`}
              />
              {errors.bankName && (
                <p className="text-sm text-red-400">{errors.bankName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountType" className="text-white/80">
                Account Type *
              </Label>
              <Select
                value={formData.accountType}
                onValueChange={(value) => handleInputChange("accountType", value)}
              >
                <SelectTrigger
                  className={`border-white/10 bg-white/5 text-white ${
                    errors.accountType ? "border-red-500/50" : ""
                  }`}
                >
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Checking</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                </SelectContent>
              </Select>
              {errors.accountType && (
                <p className="text-sm text-red-400">{errors.accountType}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="routingNumber" className="text-white/80">
                Routing Number *
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
                    e.target.value.replace(/\D/g, "")
                  )
                }
                className={`border-white/10 bg-white/5 text-white placeholder:text-white/40 font-mono ${
                  errors.routingNumber ? "border-red-500/50" : ""
                }`}
              />
              {errors.routingNumber && (
                <p className="text-sm text-red-400">{errors.routingNumber}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="accountNumber" className="text-white/80">
                Account Number *
              </Label>
              <Input
                id="accountNumber"
                type="text"
                placeholder="Account number"
                value={formData.accountNumber}
                onChange={(e) =>
                  handleInputChange(
                    "accountNumber",
                    e.target.value.replace(/\D/g, "")
                  )
                }
                className={`border-white/10 bg-white/5 text-white placeholder:text-white/40 font-mono ${
                  errors.accountNumber ? "border-red-500/50" : ""
                }`}
              />
              {errors.accountNumber && (
                <p className="text-sm text-red-400">{errors.accountNumber}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmAccountNumber" className="text-white/80">
                Confirm Account Number *
              </Label>
              <Input
                id="confirmAccountNumber"
                type="text"
                placeholder="Re-enter account number"
                value={formData.confirmAccountNumber}
                onChange={(e) =>
                  handleInputChange(
                    "confirmAccountNumber",
                    e.target.value.replace(/\D/g, "")
                  )
                }
                className={`border-white/10 bg-white/5 text-white placeholder:text-white/40 font-mono ${
                  errors.confirmAccountNumber ? "border-red-500/50" : ""
                }`}
              />
              {errors.confirmAccountNumber && (
                <p className="text-sm text-red-400">
                  {errors.confirmAccountNumber}
                </p>
              )}
            </div>

            <Alert className="bg-blue-500/10 border-blue-500/20">
              <Shield className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-200 text-sm">
                Your account information is encrypted and secure. We'll make two
                small deposits to verify your account.
              </AlertDescription>
            </Alert>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 py-4"
          >
            <div className="rounded-lg bg-white/5 p-4 border border-white/10 space-y-3">
              <div className="flex items-start gap-3">
                <Building2 className="size-5 text-purple-400 mt-0.5" />
                <div className="flex-1">
                  <Label className="text-sm text-white/60">Bank Name</Label>
                  <p className="text-white font-medium">{formData.bankName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CreditCard className="size-5 text-blue-400 mt-0.5" />
                <div className="flex-1">
                  <Label className="text-sm text-white/60">Account Type</Label>
                  <p className="text-white font-medium capitalize">
                    {formData.accountType}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="size-5 text-green-400 mt-0.5" />
                <div className="flex-1">
                  <Label className="text-sm text-white/60">
                    Routing Number
                  </Label>
                  <p className="text-white font-mono">
                    {formData.routingNumber}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="size-5 text-cyan-400 mt-0.5" />
                <div className="flex-1">
                  <Label className="text-sm text-white/60">
                    Account Number
                  </Label>
                  <p className="text-white font-mono">
                    ••••{formData.accountNumber.slice(-4)}
                  </p>
                </div>
              </div>
            </div>

            <Alert className="bg-amber-500/10 border-amber-500/20">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <AlertDescription className="text-amber-200 text-sm">
                We'll send two small deposits (less than $1 each) to verify your
                account. This process typically takes 1-2 business days.
              </AlertDescription>
            </Alert>

            <Alert className="bg-green-500/10 border-green-500/20">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-200 text-sm">
                Once verified, you'll be able to transfer funds between your
                accounts instantly.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        <DialogFooter className="gap-2">
          {step === "input" ? (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                Cancel
              </Button>
              <Button
                onClick={handleContinue}
                className="bg-purple-500 hover:bg-purple-600 text-white"
              >
                Continue
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={isSubmitting}
                className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="mr-2 size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Linking...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 size-4" />
                    Link Account
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
