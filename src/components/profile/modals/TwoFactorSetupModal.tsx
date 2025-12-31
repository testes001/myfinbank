import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Key,
  Smartphone,
  QrCode,
  MessageSquare,
  Bell,
  CheckCircle2,
  Copy,
  Shield,
} from "lucide-react";
import { BaseModal, useModalState } from "@/components/ui/base-modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { SecurityAlert } from "@/components/ui/verification-alert";
import {
  twoFactorSetupSchema,
  type TwoFactorSetupFormData,
  formatZodError,
  getZodErrorMap,
} from "@/lib/validations/profile-schemas";
import { securityToasts, showError, showSuccess } from "@/lib/toast-messages";

interface TwoFactorSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMethod: "sms" | "authenticator" | "push";
  onMethodChange: (method: "sms" | "authenticator" | "push") => void;
  onSetup: () => void;
}

type SetupStep = "select" | "verify" | "complete";

// Mock QR code and secret for authenticator setup
const AUTHENTICATOR_SECRET = "JBSWY3DPEHPK3PXP";
const MOCK_PHONE = "****1234";

export default function TwoFactorSetupModal({
  isOpen,
  onClose,
  currentMethod,
  onMethodChange,
  onSetup,
}: TwoFactorSetupModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<
    "sms" | "authenticator" | "push"
  >(currentMethod);
  const [verificationCode, setVerificationCode] = useState("");
  const [step, setStep] = useState<SetupStep>("select");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const modalState = useModalState();

  // QR code URL for authenticator
  const qrCodeUrl = `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=otpauth://totp/MyFinBank:user@example.com?secret=${AUTHENTICATOR_SECRET}&issuer=MyFinBank`;

  // Reset on open
  useEffect(() => {
    if (isOpen) {
      setStep("select");
      setVerificationCode("");
      setSelectedMethod(currentMethod);
      setFieldErrors({});
      modalState.reset();
    }
  }, [isOpen, currentMethod]);

  const handleCopySecret = () => {
    navigator.clipboard.writeText(AUTHENTICATOR_SECRET);
    showSuccess("Secret key copied to clipboard");
  };

  const handleContinue = () => {
    // Validate method selection
    const result = twoFactorSetupSchema.safeParse({
      method: selectedMethod,
      verificationCode: "000000", // Dummy code for validation
    });

    if (!result.success) {
      showError("Please select a valid 2FA method");
      return;
    }

    setStep("verify");
  };

  const handleBack = () => {
    setStep("select");
    setVerificationCode("");
    setFieldErrors({});
  };

  const handleVerify = async () => {
    // Clear previous errors
    setFieldErrors({});

    // Validate with Zod
    const result = twoFactorSetupSchema.safeParse({
      method: selectedMethod,
      verificationCode,
    });

    if (!result.success) {
      const errors = getZodErrorMap(result.error);
      setFieldErrors(errors);
      showError(formatZodError(result.error));
      return;
    }

    modalState.setSubmitting();

    try {
      // Simulate verification
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setStep("complete");

      // Wait for animation, then finalize
      setTimeout(() => {
        onMethodChange(selectedMethod);
        onSetup();
        modalState.setSuccess();

        // Show success toast
        const methodName =
          selectedMethod === "sms"
            ? "SMS"
            : selectedMethod === "authenticator"
              ? "Authenticator App"
              : "Push Notification";
        securityToasts.twoFactorEnabled(methodName);

        // Close after showing success
        setTimeout(() => {
          handleClose();
        }, 1500);
      }, 1500);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to setup two-factor authentication";
      modalState.setError(errorMessage);
      showError(errorMessage);
    }
  };

  const handleClose = () => {
    if (!modalState.isSubmitting) {
      setStep("select");
      setVerificationCode("");
      setSelectedMethod(currentMethod);
      setFieldErrors({});
      modalState.reset();
      onClose();
    }
  };

  const getTitle = () => {
    switch (step) {
      case "select":
        return "Two-Factor Authentication";
      case "verify":
        return "Verify Your Code";
      case "complete":
        return "Setup Complete!";
      default:
        return "Two-Factor Authentication";
    }
  };

  const getDescription = () => {
    switch (step) {
      case "select":
        return "Choose your preferred method for two-factor authentication";
      case "verify":
        return "Enter the verification code to complete setup";
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
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            Continue
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
            Back
          </Button>
          <Button
            onClick={handleVerify}
            disabled={verificationCode.length !== 6 || modalState.isSubmitting}
            className="bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
          >
            <CheckCircle2 className="mr-2 size-4" />
            {modalState.isSubmitting ? "Verifying..." : "Verify & Enable"}
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
      icon={Key}
      iconColor="bg-blue-500/20"
      state={modalState.state}
      error={modalState.error}
      successMessage={`Two-factor authentication enabled via ${
        selectedMethod === "sms"
          ? "SMS"
          : selectedMethod === "authenticator"
            ? "Authenticator App"
            : "Push Notification"
      }`}
      size="lg"
      footer={getFooter()}
      closeOnOverlayClick={!modalState.isSubmitting}
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
              value={selectedMethod}
              onValueChange={(value) =>
                setSelectedMethod(value as "sms" | "authenticator" | "push")
              }
              disabled={modalState.isSubmitting}
            >
              {/* SMS Method */}
              <div
                className={`flex items-start gap-4 rounded-lg border p-4 transition-all cursor-pointer ${
                  selectedMethod === "sms"
                    ? "border-blue-500/50 bg-blue-500/10 shadow-lg shadow-blue-500/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
                onClick={() => setSelectedMethod("sms")}
              >
                <RadioGroupItem value="sms" id="sms" className="mt-1" />
                <div className="flex-1">
                  <Label
                    htmlFor="sms"
                    className="flex items-center gap-2 text-base font-medium text-white cursor-pointer"
                  >
                    <MessageSquare className="size-5 text-blue-400" />
                    SMS Text Message
                  </Label>
                  <p className="mt-1 text-sm text-white/60">
                    Receive a 6-digit code via SMS to your registered phone
                    number
                  </p>
                  <div className="mt-2 text-xs text-white/40">
                    Fast and convenient
                  </div>
                </div>
              </div>

              {/* Authenticator App Method */}
              <div
                className={`flex items-start gap-4 rounded-lg border p-4 transition-all cursor-pointer ${
                  selectedMethod === "authenticator"
                    ? "border-green-500/50 bg-green-500/10 shadow-lg shadow-green-500/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
                onClick={() => setSelectedMethod("authenticator")}
              >
                <RadioGroupItem
                  value="authenticator"
                  id="authenticator"
                  className="mt-1"
                />
                <div className="flex-1">
                  <Label
                    htmlFor="authenticator"
                    className="flex items-center gap-2 text-base font-medium text-white cursor-pointer"
                  >
                    <Smartphone className="size-5 text-green-400" />
                    Authenticator App
                    <span className="ml-auto rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-semibold text-green-400">
                      Recommended
                    </span>
                  </Label>
                  <p className="mt-1 text-sm text-white/60">
                    Use apps like Google Authenticator or Authy for secure
                    time-based codes
                  </p>
                  <div className="mt-2 text-xs text-green-400">
                    Most secure option
                  </div>
                </div>
              </div>

              {/* Push Notification Method */}
              <div
                className={`flex items-start gap-4 rounded-lg border p-4 transition-all cursor-pointer ${
                  selectedMethod === "push"
                    ? "border-purple-500/50 bg-purple-500/10 shadow-lg shadow-purple-500/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
                onClick={() => setSelectedMethod("push")}
              >
                <RadioGroupItem value="push" id="push" className="mt-1" />
                <div className="flex-1">
                  <Label
                    htmlFor="push"
                    className="flex items-center gap-2 text-base font-medium text-white cursor-pointer"
                  >
                    <Bell className="size-5 text-purple-400" />
                    Push Notification
                  </Label>
                  <p className="mt-1 text-sm text-white/60">
                    Approve login requests directly from your mobile device with
                    one tap
                  </p>
                  <div className="mt-2 text-xs text-white/40">
                    Quick approval
                  </div>
                </div>
              </div>
            </RadioGroup>

            <SecurityAlert message="Two-factor authentication adds an extra layer of security to your account. Even if someone knows your password, they won't be able to access your account without the second factor." />

            {/* Method Benefits */}
            <div className="rounded-lg bg-white/5 border border-white/10 p-4">
              <h4 className="text-sm font-medium text-white mb-2">
                🔒 Enhanced Security
              </h4>
              <ul className="space-y-1 text-xs text-white/60">
                <li>• Protects against unauthorized access</li>
                <li>• Alerts you to suspicious login attempts</li>
                <li>• Industry-standard security practice</li>
                <li>• Can be changed anytime</li>
              </ul>
            </div>
          </motion.div>
        )}

        {/* VERIFY STEP */}
        {step === "verify" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {selectedMethod === "authenticator" && (
              <>
                <div className="flex flex-col items-center gap-4 py-4">
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-lg bg-white p-4 shadow-lg"
                  >
                    <img
                      src={qrCodeUrl}
                      alt="QR Code"
                      className="size-48"
                      loading="lazy"
                    />
                  </motion.div>
                  <div className="w-full space-y-2">
                    <Label className="text-white/80 text-sm">
                      Or enter this code manually:
                    </Label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 rounded-lg bg-white/5 px-3 py-2 font-mono text-sm text-white border border-white/10">
                        {AUTHENTICATOR_SECRET}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCopySecret}
                        disabled={modalState.isSubmitting}
                        className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                      >
                        <Copy className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg bg-white/5 border border-white/10 p-4">
                  <div className="flex items-start gap-3">
                    <QrCode className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-white/60 space-y-1">
                      <p>
                        <strong className="text-white">Step 1:</strong> Download
                        an authenticator app like Google Authenticator or Authy
                      </p>
                      <p>
                        <strong className="text-white">Step 2:</strong> Scan the
                        QR code or enter the code manually
                      </p>
                      <p>
                        <strong className="text-white">Step 3:</strong> Enter
                        the 6-digit code from the app below
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {selectedMethod === "sms" && (
              <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-200 mb-1">
                      SMS Code Sent
                    </p>
                    <p className="text-sm text-blue-200/80">
                      We've sent a 6-digit verification code to your registered
                      phone number ending in {MOCK_PHONE}. Please enter it below
                      to complete setup.
                    </p>
                    <p className="text-xs text-blue-300 mt-2">
                      Didn't receive it? Check your messages or wait 60 seconds
                      to request a new code.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {selectedMethod === "push" && (
              <div className="rounded-lg bg-purple-500/10 border border-purple-500/20 p-4">
                <div className="flex items-start gap-3">
                  <Bell className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-purple-200 mb-1">
                      Push Notification Sent
                    </p>
                    <p className="text-sm text-purple-200/80">
                      We've sent a test push notification to your mobile device.
                      Please approve it and enter the 6-digit code displayed
                      below.
                    </p>
                    <p className="text-xs text-purple-300 mt-2">
                      Make sure you have the MyFinBank app installed and
                      notifications enabled.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="code" className="text-white/80">
                Verification Code
              </Label>
              <Input
                id="code"
                type="text"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setVerificationCode(value);
                  if (fieldErrors.verificationCode) {
                    setFieldErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.verificationCode;
                      return newErrors;
                    });
                  }
                }}
                maxLength={6}
                className={`border-white/10 bg-white/5 text-white placeholder:text-white/40 text-center text-2xl font-mono tracking-widest ${
                  fieldErrors.verificationCode
                    ? "border-red-500/50 focus-visible:ring-red-500"
                    : ""
                }`}
                disabled={modalState.isSubmitting}
                autoFocus
              />
              {fieldErrors.verificationCode ? (
                <p className="text-xs text-red-400">
                  {fieldErrors.verificationCode}
                </p>
              ) : (
                <p className="text-xs text-white/60 text-center">
                  Enter the 6-digit code ({verificationCode.length}/6)
                </p>
              )}
            </div>
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
                Two-factor authentication via{" "}
                {selectedMethod === "sms"
                  ? "SMS"
                  : selectedMethod === "authenticator"
                    ? "Authenticator App"
                    : "Push Notification"}{" "}
                has been successfully enabled
              </p>
            </div>
            <div className="w-full rounded-lg bg-gradient-to-r from-blue-500/10 to-green-500/10 border border-blue-500/20 p-4">
              <div className="flex items-start gap-3">
                <Shield className="size-5 text-green-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-white mb-1">
                    Your account is now more secure
                  </p>
                  <p className="text-xs text-white/60">
                    You'll be asked to verify with{" "}
                    {selectedMethod === "sms"
                      ? "a code sent to your phone"
                      : selectedMethod === "authenticator"
                        ? "your authenticator app"
                        : "a push notification"}{" "}
                    whenever you sign in from a new device or location.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </BaseModal>
  );
}
