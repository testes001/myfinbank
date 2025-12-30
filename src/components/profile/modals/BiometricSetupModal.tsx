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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Fingerprint,
  Scan,
  CheckCircle2,
  Shield,
  Smartphone,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface BiometricSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentType: "fingerprint" | "face" | "none";
  onTypeChange: (type: "fingerprint" | "face" | "none") => void;
  onSetup: () => void;
}

export default function BiometricSetupModal({
  isOpen,
  onClose,
  currentType,
  onTypeChange,
  onSetup,
}: BiometricSetupModalProps) {
  const [selectedType, setSelectedType] = useState<
    "fingerprint" | "face" | "none"
  >(currentType !== "none" ? currentType : "fingerprint");
  const [step, setStep] = useState<"select" | "test" | "success">("select");
  const [isScanning, setIsScanning] = useState(false);

  const handleContinue = () => {
    setStep("test");
  };

  const handleBack = () => {
    setStep("select");
    setIsScanning(false);
  };

  const handleTest = () => {
    setIsScanning(true);

    // Simulate biometric scan
    setTimeout(() => {
      setIsScanning(false);
      setStep("success");

      setTimeout(() => {
        onTypeChange(selectedType);
        onSetup();
        toast.success(
          `${selectedType === "face" ? "Face ID" : "Fingerprint"} authentication enabled successfully`
        );
        handleClose();
      }, 1500);
    }, 2000);
  };

  const handleClose = () => {
    setStep("select");
    setIsScanning(false);
    setSelectedType(currentType !== "none" ? currentType : "fingerprint");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="border-white/10 bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 backdrop-blur-xl sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <div className="flex size-10 items-center justify-center rounded-full bg-purple-500/20">
              <Fingerprint className="size-5 text-purple-400" />
            </div>
            Biometric Authentication
          </DialogTitle>
          <DialogDescription className="text-white/60">
            {step === "select"
              ? "Choose your preferred biometric authentication method"
              : step === "test"
                ? "Test your biometric authentication"
                : "Setup complete!"}
          </DialogDescription>
        </DialogHeader>

        {step === "select" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 py-4"
          >
            <RadioGroup
              value={selectedType}
              onValueChange={(value) =>
                setSelectedType(value as "fingerprint" | "face")
              }
            >
              {/* Fingerprint Method */}
              <div
                className={`flex items-start gap-4 rounded-lg border p-4 transition-colors ${
                  selectedType === "fingerprint"
                    ? "border-purple-500/50 bg-purple-500/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                <RadioGroupItem
                  value="fingerprint"
                  id="fingerprint"
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="fingerprint"
                    className="flex items-center gap-2 text-base font-medium text-white cursor-pointer"
                  >
                    <Fingerprint className="size-5 text-purple-400" />
                    Fingerprint
                  </Label>
                  <p className="mt-1 text-sm text-white/60">
                    Use your device's fingerprint sensor for quick and secure
                    authentication
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-white/40">
                    <Smartphone className="size-3" />
                    <span>Available on most modern smartphones and laptops</span>
                  </div>
                </div>
              </div>

              {/* Face Recognition Method */}
              <div
                className={`flex items-start gap-4 rounded-lg border p-4 transition-colors ${
                  selectedType === "face"
                    ? "border-purple-500/50 bg-purple-500/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                <RadioGroupItem value="face" id="face" className="mt-1" />
                <div className="flex-1">
                  <Label
                    htmlFor="face"
                    className="flex items-center gap-2 text-base font-medium text-white cursor-pointer"
                  >
                    <Scan className="size-5 text-blue-400" />
                    Face ID
                  </Label>
                  <p className="mt-1 text-sm text-white/60">
                    Use facial recognition technology for hands-free
                    authentication
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-white/40">
                    <Smartphone className="size-3" />
                    <span>Available on devices with front-facing cameras</span>
                  </div>
                </div>
              </div>
            </RadioGroup>

            <Alert className="bg-purple-500/10 border-purple-500/20">
              <Shield className="h-4 w-4 text-purple-400" />
              <AlertDescription className="text-purple-200 text-sm">
                Your biometric data is stored securely on your device and never
                shared with MyFinBank servers. This ensures maximum privacy and
                security.
              </AlertDescription>
            </Alert>

            <Alert className="bg-amber-500/10 border-amber-500/20">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <AlertDescription className="text-amber-200 text-sm">
                Make sure your device supports biometric authentication and has
                it enabled in your system settings before continuing.
              </AlertDescription>
            </Alert>
          </motion.div>
        )}

        {step === "test" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 py-4"
          >
            <div className="flex flex-col items-center gap-6">
              <div className="relative">
                <motion.div
                  className={`flex size-32 items-center justify-center rounded-full ${
                    isScanning
                      ? "bg-gradient-to-br from-purple-500 to-blue-500"
                      : "bg-white/5 border-2 border-white/20"
                  }`}
                  animate={
                    isScanning
                      ? {
                          scale: [1, 1.05, 1],
                          boxShadow: [
                            "0 0 0 0 rgba(168, 85, 247, 0)",
                            "0 0 0 20px rgba(168, 85, 247, 0.1)",
                            "0 0 0 0 rgba(168, 85, 247, 0)",
                          ],
                        }
                      : {}
                  }
                  transition={{
                    duration: 1.5,
                    repeat: isScanning ? Infinity : 0,
                    ease: "easeInOut",
                  }}
                >
                  {isScanning ? (
                    <Loader2 className="size-16 animate-spin text-white" />
                  ) : selectedType === "face" ? (
                    <Scan className="size-16 text-white/80" />
                  ) : (
                    <Fingerprint className="size-16 text-white/80" />
                  )}
                </motion.div>

                {isScanning && (
                  <motion.div
                    className="absolute inset-0 rounded-full border-4 border-purple-500"
                    initial={{ opacity: 0, scale: 1 }}
                    animate={{ opacity: [0.5, 0], scale: [1, 1.5] }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "easeOut",
                    }}
                  />
                )}
              </div>

              <div className="text-center">
                <h4 className="text-lg font-semibold text-white">
                  {isScanning
                    ? "Scanning..."
                    : `Test Your ${selectedType === "face" ? "Face ID" : "Fingerprint"}`}
                </h4>
                <p className="mt-1 text-sm text-white/60">
                  {isScanning
                    ? "Please look at your device camera"
                    : selectedType === "face"
                      ? "Click the button below and look at your device camera"
                      : "Click the button below and place your finger on the sensor"}
                </p>
              </div>
            </div>

            {!isScanning && (
              <Button
                onClick={handleTest}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
              >
                {selectedType === "face" ? (
                  <Scan className="mr-2 size-4" />
                ) : (
                  <Fingerprint className="mr-2 size-4" />
                )}
                Start Test
              </Button>
            )}
          </motion.div>
        )}

        {step === "success" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-6 py-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-500"
            >
              <CheckCircle2 className="size-12 text-white" />
            </motion.div>
            <div className="text-center">
              <h4 className="text-xl font-semibold text-white">
                Setup Complete!
              </h4>
              <p className="mt-2 text-sm text-white/60">
                {selectedType === "face" ? "Face ID" : "Fingerprint"}{" "}
                authentication has been successfully enabled
              </p>
            </div>
          </motion.div>
        )}

        <DialogFooter className="gap-2">
          {step === "select" && (
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
          )}
          {step === "test" && !isScanning && (
            <>
              <Button
                variant="outline"
                onClick={handleBack}
                className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                Back
              </Button>
              <Button
                variant="ghost"
                onClick={handleClose}
                className="text-white/60 hover:bg-white/10"
              >
                Skip for Now
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
