import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  CheckCircle2,
  Upload,
  AlertCircle,
  DollarSign,
  FileText,
  Clock,
} from "lucide-react";
import { useAsync } from "@/hooks/useAsync";

interface MobileDepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

type DepositStatus = "idle" | "uploading" | "processing" | "success" | "failed";

interface DepositState {
  frontImage: File | null;
  backImage: File | null;
  amount: string;
  status: DepositStatus;
  detectedAmount?: string;
}

export function MobileDepositModal({ open, onOpenChange, onSuccess }: MobileDepositModalProps) {
  const { currentUser } = useAuth();
  const [state, setState] = useState<DepositState>({
    frontImage: null,
    backImage: null,
    amount: "",
    status: "idle",
  });
  const { loading, run } = useAsync<void>();
  const [frontError, setFrontError] = useState<string | null>(null);
  const [backError, setBackError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);

  const handleImageUpload = (side: "front" | "back", file: File | null) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image size must be less than 10MB");
      return;
    }

    setState((prev) => ({
      ...prev,
      [side === "front" ? "frontImage" : "backImage"]: file,
    }));

    toast.success(`${side === "front" ? "Front" : "Back"} image uploaded`);

    // Simulate OCR detection for front image
    if (side === "front") {
      setTimeout(() => {
        const mockAmount = (Math.random() * 500 + 50).toFixed(2);
        setState((prev) => ({
          ...prev,
          detectedAmount: mockAmount,
          amount: mockAmount,
        }));
        toast.success(`Auto-detected amount: $${mockAmount}`);
      }, 1500);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Reset errors
    setFrontError(null);
    setBackError(null);
    setAmountError(null);

    if (!state.frontImage) {
      setFrontError("Please upload the front image of the check");
    }

    if (!state.backImage) {
      setBackError("Please upload the back image of the check (endorsed)");
    }

    const amountNum = parseFloat(state.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setAmountError("Please enter a valid amount");
    }

    // Stop if validation errors
    if (!state.frontImage || !state.backImage || isNaN(amountNum) || amountNum <= 0) {
      return;
    }

    // Get account limits based on account age/status
    const depositLimit = getDepositLimit();

    if (amountNum > depositLimit) {
      setAmountError(`Deposit amount exceeds your current limit of $${depositLimit.toFixed(2)}`);
      return;
    }

    try {
      await run(async () => {
        setState((prev) => ({ ...prev, status: "uploading" }));

        // Simulate upload
        await new Promise((res) => setTimeout(res, 1500));
        setState((prev) => ({ ...prev, status: "processing" }));

        // Simulate processing
        await new Promise((res) => setTimeout(res, 2000));

        setState((prev) => ({ ...prev, status: "success" }));
        toast.success("Check deposit submitted successfully!");

        setTimeout(() => {
          resetForm();
          onSuccess();
        }, 2500);
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Deposit failed");
      setState((prev) => ({ ...prev, status: "failed" }));
    }
  };

  const getDepositLimit = (): number => {
    // Simulate tiered limits based on account status
    // In real app, this would be based on account age, credit score, etc.
    return 5000; // Standard limit
  };

  const resetForm = () => {
    setState({
      frontImage: null,
      backImage: null,
      amount: "",
      status: "idle",
    });
  };

  const handleClose = () => {
    if (state.status !== "uploading" && state.status !== "processing") {
      resetForm();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/20 bg-slate-900/95 text-white backdrop-blur-xl">
        <AnimatePresence mode="wait">
          {state.status === "success" ? (
            <motion.div
              key="success"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="flex flex-col items-center justify-center py-8"
            >
              <CheckCircle2 className="mb-4 size-16 text-green-400" />
              <h3 className="text-2xl font-bold">Deposit Submitted!</h3>
              <p className="mt-2 text-white/60">Your check is being processed</p>
              <div className="mt-4 rounded-lg bg-blue-500/10 p-4">
                <p className="flex items-center text-sm text-blue-400">
                  <Clock className="mr-2 size-4" />
                  Funds typically available within 1-2 business days
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <DialogHeader>
                <DialogTitle className="flex items-center text-xl text-white">
                  <Camera className="mr-2 size-5" />
                  Mobile Check Deposit
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                {/* Instructions */}
                <Card className="border-blue-500/20 bg-blue-500/10 p-4">
                  <h4 className="mb-2 flex items-center text-sm font-semibold text-blue-400">
                    <AlertCircle className="mr-2 size-4" />
                    Deposit Instructions
                  </h4>
                  <ul className="space-y-1 text-xs text-blue-400/80">
                    <li>• Endorse the back of your check with "For Mobile Deposit Only"</li>
                    <li>• Take clear photos of both sides on a dark background</li>
                    <li>• Ensure all corners are visible and text is readable</li>
                    <li>• Current deposit limit: ${getDepositLimit().toLocaleString()}</li>
                  </ul>
                </Card>

                {/* Front Image Upload */}
                <div className="space-y-2">
                  <Label className="text-white/80">Front of Check</Label>
                  <div className="relative">
                    <Input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handleImageUpload("front", e.target.files?.[0] || null)}
                      className="hidden"
                      id="front-upload"
                      disabled={state.status === "uploading" || state.status === "processing"}
                    />
                    <label htmlFor="front-upload">
                      <Card
                        className={`flex cursor-pointer flex-col items-center justify-center border-2 border-dashed p-8 transition-colors ${
                          state.frontImage
                            ? "border-green-500/50 bg-green-500/10"
                            : "border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10"
                        }`}
                      >
                        {state.frontImage ? (
                          <>
                            <CheckCircle2 className="mb-2 size-8 text-green-400" />
                            <p className="text-sm text-green-400">Front image captured</p>
                            <p className="mt-1 text-xs text-white/60">{state.frontImage.name}</p>
                          </>
                        ) : (
                          <>
                            <Upload className="mb-2 size-8 text-white/40" />
                            <p className="text-sm text-white/60">Click to upload front</p>
                          </>
                        )}
                      </Card>
                    </label>
                  </div>
                  {frontError && <p className="text-xs text-red-300 mt-2">{frontError}</p>}
                </div>

                {/* Back Image Upload */}
                <div className="space-y-2">
                  <Label className="text-white/80">Back of Check (Endorsed)</Label>
                  <div className="relative">
                    <Input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handleImageUpload("back", e.target.files?.[0] || null)}
                      className="hidden"
                      id="back-upload"
                      disabled={state.status === "uploading" || state.status === "processing"}
                    />
                    <label htmlFor="back-upload">
                      <Card
                        className={`flex cursor-pointer flex-col items-center justify-center border-2 border-dashed p-8 transition-colors ${
                          state.backImage
                            ? "border-green-500/50 bg-green-500/10"
                            : "border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10"
                        }`}
                      >
                        {state.backImage ? (
                          <>
                            <CheckCircle2 className="mb-2 size-8 text-green-400" />
                            <p className="text-sm text-green-400">Back image captured</p>
                            <p className="mt-1 text-xs text-white/60">{state.backImage.name}</p>
                          </>
                        ) : (
                          <>
                            <Upload className="mb-2 size-8 text-white/40" />
                            <p className="text-sm text-white/60">Click to upload back</p>
                          </>
                        )}
                      </Card>
                    </label>
                  </div>
                  {backError && <p className="text-xs text-red-300 mt-2">{backError}</p>}
                </div>

                {/* Amount */}
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-white/80">
                    Check Amount
                  </Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={state.amount}
                      onChange={(e) => setState((prev) => ({ ...prev, amount: e.target.value }))}
                      required
                      disabled={state.status === "uploading" || state.status === "processing"}
                      className="border-white/20 bg-white/10 pl-9 text-white placeholder:text-white/40"
                      placeholder="0.00"
                    />
                  </div>
                    {state.detectedAmount && (
                      <p className="text-xs text-green-400">
                        ✓ Amount auto-detected from check
                      </p>
                    )}
                    {amountError && <p className="text-xs text-red-300 mt-1">{amountError}</p>}
                </div>

                {/* Processing Status */}
                {(state.status === "uploading" || state.status === "processing") && (
                  <Card className="border-blue-500/20 bg-blue-500/10 p-4">
                    <div className="flex items-center">
                      <div className="mr-3 size-4 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                      <p className="text-sm text-blue-400">
                        {state.status === "uploading" ? "Uploading check images..." : "Processing deposit..."}
                      </p>
                    </div>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={state.status === "uploading" || state.status === "processing"}
                    className="flex-1 border-white/20 bg-white/10 text-white hover:bg-white/20"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      !state.frontImage ||
                      !state.backImage ||
                      !state.amount ||
                      state.status === "uploading" ||
                      state.status === "processing"
                    }
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  >
                    {state.status === "uploading" || state.status === "processing"
                      ? "Processing..."
                      : "Submit Deposit"}
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
