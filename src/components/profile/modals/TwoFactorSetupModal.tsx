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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { toast } from "sonner";

interface TwoFactorSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentMethod: "sms" | "authenticator" | "push";
  onMethodChange: (method: "sms" | "authenticator" | "push") => void;
  onSetup: () => void;
}

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
  const [step, setStep] = useState<"select" | "verify">("select");

  // Mock QR code and secret for authenticator setup
  const authenticatorSecret = "JBSWY3DPEHPK3PXP";
  const qrCodeUrl = `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=otpauth://totp/MyFinBank:user@example.com?secret=${authenticatorSecret}&issuer=MyFinBank`;

  const handleCopySecret = () => {
    navigator.clipboard.writeText(authenticatorSecret);
    toast.success("Secret key copied to clipboard");
  };

  const handleContinue = () => {
    setStep("verify");
  };

  const handleBack = () => {
    setStep("select");
    setVerificationCode("");
  };

  const handleVerify = () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error("Please enter a valid 6-digit code");
      return;
    }

    // Simulate verification
    onMethodChange(selectedMethod);
    onSetup();
    toast.success("Two-factor authentication enabled successfully");
    onClose();

    // Reset state
    setStep("select");
    setVerificationCode("");
  };

  const handleClose = () => {
    setStep("select");
    setVerificationCode("");
    setSelectedMethod(currentMethod);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="border-white/10 bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 backdrop-blur-xl sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <div className="flex size-10 items-center justify-center rounded-full bg-blue-500/20">
              <Key className="size-5 text-blue-400" />
            </div>
            Two-Factor Authentication
          </DialogTitle>
          <DialogDescription className="text-white/60">
            {step === "select"
              ? "Choose your preferred method for two-factor authentication"
              : "Enter the verification code to complete setup"}
          </DialogDescription>
        </DialogHeader>

        {step === "select" ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 py-4"
          >
            <RadioGroup
              value={selectedMethod}
              onValueChange={(value) =>
                setSelectedMethod(value as "sms" | "authenticator" | "push")
              }
            >
              {/* SMS Method */}
              <div
                className={`flex items-start gap-4 rounded-lg border p-4 transition-colors ${
                  selectedMethod === "sms"
                    ? "border-blue-500/50 bg-blue-500/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
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
                </div>
              </div>

              {/* Authenticator App Method */}
              <div
                className={`flex items-start gap-4 rounded-lg border p-4 transition-colors ${
                  selectedMethod === "authenticator"
                    ? "border-blue-500/50 bg-blue-500/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
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
                    <span className="ml-auto text-xs font-normal text-green-400">
                      Recommended
                    </span>
                  </Label>
                  <p className="mt-1 text-sm text-white/60">
                    Use apps like Google Authenticator or Authy for secure
                    time-based codes
                  </p>
                </div>
              </div>

              {/* Push Notification Method */}
              <div
                className={`flex items-start gap-4 rounded-lg border p-4 transition-colors ${
                  selectedMethod === "push"
                    ? "border-blue-500/50 bg-blue-500/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
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
                    Approve login requests directly from your mobile device
                  </p>
                </div>
              </div>
            </RadioGroup>

            <Alert className="bg-blue-500/10 border-blue-500/20">
              <Shield className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-200 text-sm">
                Two-factor authentication adds an extra layer of security to
                your account. Even if someone knows your password, they won't be
                able to access your account without the second factor.
              </AlertDescription>
            </Alert>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 py-4"
          >
            {selectedMethod === "authenticator" && (
              <>
                <div className="flex flex-col items-center gap-4">
                  <div className="rounded-lg bg-white p-4">
                    <img
                      src={qrCodeUrl}
                      alt="QR Code"
                      className="size-48"
                      loading="lazy"
                    />
                  </div>
                  <div className="w-full space-y-2">
                    <Label className="text-white/80 text-sm">
                      Or enter this code manually:
                    </Label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 rounded-lg bg-white/5 px-3 py-2 font-mono text-sm text-white">
                        {authenticatorSecret}
                      </code>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCopySecret}
                        className="border-white/20 bg-white/10 text-white hover:bg-white/20"
                      >
                        <Copy className="size-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                <Alert className="bg-white/5 border-white/10">
                  <QrCode className="h-4 w-4 text-white/60" />
                  <AlertDescription className="text-white/60 text-sm">
                    1. Download an authenticator app like Google Authenticator
                    or Authy
                    <br />
                    2. Scan the QR code or enter the code manually
                    <br />
                    3. Enter the 6-digit code from the app below
                  </AlertDescription>
                </Alert>
              </>
            )}

            {selectedMethod === "sms" && (
              <Alert className="bg-blue-500/10 border-blue-500/20">
                <MessageSquare className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-blue-200 text-sm">
                  We've sent a 6-digit verification code to your registered
                  phone number ending in ****1234. Please enter it below to
                  complete setup.
                </AlertDescription>
              </Alert>
            )}

            {selectedMethod === "push" && (
              <Alert className="bg-purple-500/10 border-purple-500/20">
                <Bell className="h-4 w-4 text-purple-400" />
                <AlertDescription className="text-purple-200 text-sm">
                  We've sent a test push notification to your mobile device.
                  Please approve it and enter the code displayed below.
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="code" className="text-white/80">
                Verification Code
              </Label>
              <Input
                id="code"
                type="text"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) =>
                  setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                maxLength={6}
                className="border-white/10 bg-white/5 text-white placeholder:text-white/40 text-center text-2xl font-mono tracking-widest"
              />
            </div>
          </motion.div>
        )}

        <DialogFooter className="gap-2">
          {step === "select" ? (
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
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                Continue
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={handleBack}
                className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                Back
              </Button>
              <Button
                onClick={handleVerify}
                disabled={verificationCode.length !== 6}
                className="bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
              >
                <CheckCircle2 className="mr-2 size-4" />
                Verify & Enable
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
