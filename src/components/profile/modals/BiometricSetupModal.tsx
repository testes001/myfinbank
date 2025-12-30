import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import {
  Fingerprint,
  Scan,
  CheckCircle2,
  Shield,
  Smartphone,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { BaseModal, useModalState } from "@/components/ui/base-modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  biometricSetupSchema,
  type BiometricSetupFormData,
  formatZodError,
} from "@/lib/validations/profile-schemas";
import { securityToasts, showError } from "@/lib/toast-messages";

interface BiometricSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentType: "fingerprint" | "face" | "none";
  onTypeChange: (type: "fingerprint" | "face" | "none") => void;
  onSetup: () => void;
}

type SetupStep = "select" | "test" | "complete";

export default function BiometricSetupModal({
  isOpen,
  onClose,
  currentType,
  onTypeChange,
  onSetup,
}: BiometricSetupModalProps) {
  const [selectedType, setSelectedType] = useState<"fingerprint" | "face">(
    currentType !== "none" ? currentType : "fingerprint",
  );
  const [step, setStep] = useState<SetupStep>("select");
  const [isScanning, setIsScanning] = useState(false);
  const modalState = useModalState();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setStep("select");
      setIsScanning(false);
      setSelectedType(currentType !== "none" ? currentType : "fingerprint");
      modalState.reset();
    }
  }, [isOpen, currentType]);

  const handleContinue = () => {
    // Validate selection with Zod
    const result = biometricSetupSchema.safeParse({ type: selectedType });

    if (!result.success) {
      const errorMessage = formatZodError(result.error);
      showError(errorMessage);
      return;
    }

    setStep("test");
  };

  const handleBack = () => {
    setStep("select");
    setIsScanning(false);
  };

  const handleTest = async () => {
    setIsScanning(true);
    modalState.setSubmitting();

    try {
      // Simulate biometric scan
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setIsScanning(false);
      setStep("complete");

      // Wait for animation, then finalize
      setTimeout(() => {
        onTypeChange(selectedType);
        onSetup();
        modalState.setSuccess();

        // Show success toast
        const typeName = selectedType === "face" ? "Face ID" : "Fingerprint";
        securityToasts.biometricEnabled(typeName);

        // Close after showing success
        setTimeout(() => {
          handleClose();
        }, 1500);
      }, 1500);
    } catch (error) {
      setIsScanning(false);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to setup biometric authentication";
      modalState.setError(errorMessage);
      showError(errorMessage);
    }
  };

  const handleClose = () => {
    if (!modalState.isSubmitting && !isScanning) {
      setStep("select");
      setIsScanning(false);
      setSelectedType(currentType !== "none" ? currentType : "fingerprint");
      modalState.reset();
      onClose();
    }
  };

  const getTitle = () => {
    switch (step) {
      case "select":
        return "Biometric Authentication";
      case "test":
        return "Test Your Biometric";
      case "complete":
        return "Setup Complete!";
      default:
        return "Biometric Authentication";
    }
  };

  const getDescription = () => {
    switch (step) {
      case "select":
        return "Choose your preferred biometric authentication method";
      case "test":
        return "Test your biometric authentication";
      case "complete":
        return "You're all set!";
      default:
        return "";
    }
  };

  const getFooter = () => {
    if (step === "select") {
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
          </Button>
        </>
      );
    }

    if (step === "test" && !isScanning) {
      return (
        <>
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={modalState.isSubmitting}
            className="border-white/20 bg-white/10 text-white hover:bg-white/20"
          >
            Back
          </Button>
          <Button
            variant="ghost"
            onClick={handleClose}
            disabled={modalState.isSubmitting}
            className="text-white/60 hover:bg-white/10"
          >
            Skip for Now
          </Button>
        </>
      );
    }

    return null;
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title={getTitle()}
      description={getDescription()}
      icon={Fingerprint}
      iconColor="bg-purple-500/20"
      state={modalState.state}
      error={modalState.error}
      successMessage={`${selectedType === "face" ? "Face ID" : "Fingerprint"} authentication enabled successfully`}
      size="lg"
      footer={getFooter()}
      closeOnOverlayClick={!isScanning && !modalState.isSubmitting}
    >
      <div className="py-4">
        {/* SELECT STEP */}
        {step === "select" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <RadioGroup
              value={selectedType}
              onValueChange={(value) =>
                setSelectedType(value as "fingerprint" | "face")
              }
              disabled={modalState.isSubmitting}
            >
              {/* Fingerprint Method */}
              <div
                className={`flex items-start gap-4 rounded-lg border p-4 transition-all cursor-pointer ${
                  selectedType === "fingerprint"
                    ? "border-purple-500/50 bg-purple-500/10 shadow-lg shadow-purple-500/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
                onClick={() => setSelectedType("fingerprint")}
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
                    <span>
                      Available on most modern smartphones and laptops
                    </span>
                  </div>
                </div>
              </div>

              {/* Face Recognition Method */}
              <div
                className={`flex items-start gap-4 rounded-lg border p-4 transition-all cursor-pointer ${
                  selectedType === "face"
                    ? "border-purple-500/50 bg-purple-500/10 shadow-lg shadow-purple-500/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
                onClick={() => setSelectedType("face")}
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

        {/* TEST STEP */}
        {step === "test" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex flex-col items-center gap-6 py-8">
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
                    ? selectedType === "face"
                      ? "Please look at your device camera"
                      : "Keep your finger on the sensor"
                    : selectedType === "face"
                      ? "Click the button below and look at your device camera"
                      : "Click the button below and place your finger on the sensor"}
                </p>
              </div>
            </div>

            {!isScanning && (
              <Button
                onClick={handleTest}
                disabled={modalState.isSubmitting}
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

        {/* COMPLETE STEP */}
        {step === "complete" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center gap-6 py-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg shadow-green-500/20"
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
            <div className="w-full rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 p-4">
              <p className="text-sm text-center text-white/80">
                You can now use{" "}
                {selectedType === "face" ? "Face ID" : "your fingerprint"} to
                quickly and securely access your account
              </p>
            </div>
          </motion.div>
        )}
      </div>
    </BaseModal>
  );
}
