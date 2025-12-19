import { useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  Upload,
  Euro,
  DollarSign,
} from "lucide-react";
import {
  submitMobileDeposit,
  validateDepositAmount,
  isValidDepositCurrency,
  type DepositCurrency,
  type AccountType,
} from "@/lib/mobile-deposit";

interface MobileDepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type DepositStep = "instructions" | "photos" | "details" | "review" | "success" | "error";

interface DepositFormState {
  frontImage: string | null;
  backImage: string | null;
  amount: string;
  currency: DepositCurrency;
  accountType: AccountType;
  notes: string;
}

export function MobileDepositModalNew({
  open,
  onOpenChange,
  onSuccess,
}: MobileDepositModalProps) {
  const { currentUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<DepositStep>("instructions");
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState<DepositFormState>({
    frontImage: null,
    backImage: null,
    amount: "",
    currency: "USD",
    accountType: "checking",
    notes: "",
  });
  const [errorMessage, setErrorMessage] = useState("");

  const handleFileUpload = (side: "front" | "back", file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be less than 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setForm((prev) => ({
        ...prev,
        [side === "front" ? "frontImage" : "backImage"]: base64,
      }));
      toast.success(`${side === "front" ? "Front" : "Back"} image captured`);
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoCapture = (side: "front" | "back") => {
    if (side === "front" && cameraInputRef.current) {
      cameraInputRef.current.click();
    } else if (side === "back" && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const validateForm = (): { valid: boolean; error?: string } => {
    if (!form.frontImage || !form.backImage) {
      return { valid: false, error: "Please upload both front and back images" };
    }

    if (!form.amount) {
      return { valid: false, error: "Please enter the check amount" };
    }

    const amountValidation = validateDepositAmount(form.amount);
    if (!amountValidation.valid) {
      return { valid: false, error: amountValidation.error };
    }

    if (!isValidDepositCurrency(form.currency)) {
      return {
        valid: false,
        error: "Invalid currency. Only USD and EUR are accepted.",
      };
    }

    return { valid: true };
  };

  const handleSubmitDeposit = async () => {
    if (!currentUser) return;

    const validation = validateForm();
    if (!validation.valid) {
      setErrorMessage(validation.error || "Validation failed");
      setStep("error");
      return;
    }

    setIsLoading(true);

    try {
      const result = submitMobileDeposit(currentUser.user.id, {
        amount: form.amount,
        currency: form.currency,
        accountType: form.accountType,
        checkFrontImage: form.frontImage,
        checkBackImage: form.backImage,
        userNotes: form.notes || undefined,
      });

      if (result.success) {
        setStep("success");
        toast.success("Check deposit submitted for review!");

        setTimeout(() => {
          resetForm();
          onOpenChange(false);
          onSuccess();
        }, 3000);
      } else {
        setErrorMessage(result.error || "Failed to submit deposit");
        setStep("error");
        toast.error(result.error || "Failed to submit deposit");
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "An error occurred");
      setStep("error");
      toast.error("Failed to submit deposit");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      frontImage: null,
      backImage: null,
      amount: "",
      currency: "USD",
      accountType: "checking",
      notes: "",
    });
    setStep("instructions");
    setErrorMessage("");
  };

  const handleClose = () => {
    if (!isLoading) {
      resetForm();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-slate-700 bg-slate-900 text-white backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle>Mobile Check Deposit</DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Instructions Step */}
          {step === "instructions" && (
            <motion.div
              key="instructions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-blue-200 mb-2">Important Information</h4>
                    <ul className="space-y-1 text-sm text-blue-100 text-opacity-80">
                      <li>• We accept checks in USD and EUR only</li>
                      <li>• All deposits undergo manual review</li>
                      <li>• Processing typically takes 1-3 business days</li>
                      <li>• You'll receive email confirmation when approved</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">How it works:</h4>
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <div className="bg-blue-600 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                      1
                    </div>
                    <div>
                      <p className="font-medium">Capture front & back</p>
                      <p className="text-sm text-slate-300">
                        Take clear photos of both sides of your check
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="bg-blue-600 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                      2
                    </div>
                    <div>
                      <p className="font-medium">Enter deposit details</p>
                      <p className="text-sm text-slate-300">
                        Specify amount, currency (USD or EUR), and destination account
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="bg-blue-600 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                      3
                    </div>
                    <div>
                      <p className="font-medium">Manual review</p>
                      <p className="text-sm text-slate-300">
                        Our team verifies the check and credits your account
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <Button onClick={() => setStep("photos")} className="w-full bg-blue-600 hover:bg-blue-700">
                Continue
              </Button>
            </motion.div>
          )}

          {/* Photos Step */}
          {step === "photos" && (
            <motion.div
              key="photos"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div>
                <h4 className="font-semibold mb-4">Capture Check Images</h4>

                {/* Front Image */}
                <div className="space-y-3 mb-6">
                  <Label className="text-slate-300">Front of Check</Label>
                  <div className="bg-slate-800 border-2 border-dashed border-slate-700 rounded-lg p-6 text-center cursor-pointer hover:border-slate-600 transition">
                    {form.frontImage ? (
                      <div className="space-y-3">
                        <img
                          src={form.frontImage}
                          alt="Front"
                          className="max-h-32 mx-auto rounded"
                        />
                        <p className="text-sm text-green-400">✓ Front image captured</p>
                      </div>
                    ) : (
                      <div onClick={() => handlePhotoCapture("front")}>
                        <Camera className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                        <p className="text-sm text-slate-300">Tap to capture front</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Back Image */}
                <div className="space-y-3">
                  <Label className="text-slate-300">Back of Check</Label>
                  <div className="bg-slate-800 border-2 border-dashed border-slate-700 rounded-lg p-6 text-center cursor-pointer hover:border-slate-600 transition">
                    {form.backImage ? (
                      <div className="space-y-3">
                        <img
                          src={form.backImage}
                          alt="Back"
                          className="max-h-32 mx-auto rounded"
                        />
                        <p className="text-sm text-green-400">✓ Back image captured</p>
                      </div>
                    ) : (
                      <div onClick={() => handlePhotoCapture("back")}>
                        <Camera className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                        <p className="text-sm text-slate-300">Tap to capture back</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileUpload("front", e.target.files[0]);
                  }
                }}
              />

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileUpload("back", e.target.files[0]);
                  }
                }}
              />

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep("instructions")}
                  variant="outline"
                  className="flex-1 border-slate-700 text-white hover:bg-slate-800"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep("details")}
                  disabled={!form.frontImage || !form.backImage}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  Continue
                </Button>
              </div>
            </motion.div>
          )}

          {/* Details Step */}
          {step === "details" && (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-300 mb-2 block">Amount</Label>
                  <div className="flex gap-2">
                    <Select value={form.currency} onValueChange={(v) => setForm((prev) => ({...prev, currency: v as DepositCurrency}))}>
                      <SelectTrigger className="w-24 bg-slate-800 border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 text-white">
                        <SelectItem value="USD">
                          <DollarSign className="w-4 h-4 inline mr-2" />
                          USD
                        </SelectItem>
                        <SelectItem value="EUR">
                          <Euro className="w-4 h-4 inline mr-2" />
                          EUR
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      max="50000"
                      placeholder="0.00"
                      value={form.amount}
                      onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
                      className="flex-1 bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Max: $50,000 per deposit</p>
                </div>

                <div>
                  <Label className="text-slate-300 mb-2 block">Deposit To</Label>
                  <Select value={form.accountType} onValueChange={(v) => setForm((prev) => ({...prev, accountType: v as AccountType}))}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                      <SelectItem value="checking">Checking Account</SelectItem>
                      <SelectItem value="savings">Savings Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-slate-300 mb-2 block">Notes (Optional)</Label>
                  <Input
                    placeholder="e.g., Check #12345"
                    value={form.notes}
                    onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                    className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <p className="text-sm text-amber-200">
                  <strong>Reminder:</strong> We only accept checks in USD or EUR. Other currencies will be rejected.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep("photos")}
                  variant="outline"
                  className="flex-1 border-slate-700 text-white hover:bg-slate-800"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep("review")}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Review
                </Button>
              </div>
            </motion.div>
          )}

          {/* Review Step */}
          {step === "review" && (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <Card className="border-slate-700 bg-slate-800/50 p-4 space-y-4">
                <div>
                  <p className="text-sm text-slate-400">Amount</p>
                  <p className="text-2xl font-bold text-white">
                    {form.currency}
                    {parseFloat(form.amount || "0").toFixed(2)}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-400">Currency</p>
                    <p className="font-semibold text-white">{form.currency}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400">Account</p>
                    <p className="font-semibold text-white capitalize">{form.accountType}</p>
                  </div>
                </div>

                {form.notes && (
                  <div>
                    <p className="text-sm text-slate-400">Notes</p>
                    <p className="text-white">{form.notes}</p>
                  </div>
                )}
              </Card>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                <div className="flex gap-2">
                  <Clock className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-200">
                    <strong>Processing Time:</strong> Your deposit will be reviewed and typically available within 1-3 business days
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep("details")}
                  variant="outline"
                  className="flex-1 border-slate-700 text-white hover:bg-slate-800"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubmitDeposit}
                  disabled={isLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  {isLoading ? "Submitting..." : "Submit Deposit"}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Success Step */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="flex justify-center mb-4"
              >
                <CheckCircle2 className="w-16 h-16 text-green-500" />
              </motion.div>

              <div>
                <h3 className="text-xl font-bold text-white mb-2">Deposit Submitted!</h3>
                <p className="text-slate-300">
                  Your check for {form.currency}
                  {parseFloat(form.amount).toFixed(2)} has been submitted for review.
                </p>
              </div>

              <Card className="border-slate-700 bg-slate-800/50 p-4 text-left">
                <p className="text-sm text-slate-400 mb-2">What happens next:</p>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li>✓ Our team will review your deposit</li>
                  <li>✓ Processing typically takes 1-3 business days</li>
                  <li>✓ You'll receive email confirmation when approved</li>
                  <li>✓ Funds will be credited to your {form.accountType} account</li>
                </ul>
              </Card>
            </motion.div>
          )}

          {/* Error Step */}
          {step === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-200 mb-1">Error</h4>
                    <p className="text-sm text-red-100">{errorMessage}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setStep("details")}
                  variant="outline"
                  className="flex-1 border-slate-700 text-white hover:bg-slate-800"
                >
                  Back
                </Button>
                <Button
                  onClick={() => {
                    resetForm();
                    onOpenChange(false);
                  }}
                  className="flex-1 bg-slate-700 hover:bg-slate-600"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
