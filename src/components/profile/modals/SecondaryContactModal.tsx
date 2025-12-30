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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Mail,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Info,
} from "lucide-react";
import { toast } from "sonner";

interface SecondaryContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSecondaryEmail: string;
  currentSecondaryPhone: string;
  onSave: (email: string, phone: string) => Promise<void>;
}

export default function SecondaryContactModal({
  isOpen,
  onClose,
  currentSecondaryEmail,
  currentSecondaryPhone,
  onSave,
}: SecondaryContactModalProps) {
  const [email, setEmail] = useState(currentSecondaryEmail);
  const [phone, setPhone] = useState(currentSecondaryPhone);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; phone?: string }>({});

  const validateEmail = (value: string): boolean => {
    if (!value) return true; // Optional field
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const validatePhone = (value: string): boolean => {
    if (!value) return true; // Optional field
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
    return phoneRegex.test(value) && value.replace(/\D/g, "").length >= 10;
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (errors.email) {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: undefined }));
    }
  };

  const handleSave = async () => {
    const newErrors: { email?: string; phone?: string } = {};

    if (email && !validateEmail(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (phone && !validatePhone(phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!email && !phone) {
      toast.error("Please provide at least one secondary contact method");
      return;
    }

    setIsSaving(true);
    try {
      await onSave(email, phone);
      toast.success("Secondary contact information updated");
      handleClose();
    } catch (error) {
      toast.error("Failed to update secondary contact information");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setEmail(currentSecondaryEmail);
    setPhone(currentSecondaryPhone);
    setErrors({});
    onClose();
  };

  const hasChanges =
    email !== currentSecondaryEmail || phone !== currentSecondaryPhone;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="border-white/10 bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 backdrop-blur-xl sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <div className="flex size-10 items-center justify-center rounded-full bg-blue-500/20">
              <Mail className="size-5 text-blue-400" />
            </div>
            Secondary Contact Information
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Add alternative contact methods for account recovery and notifications
          </DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 py-4"
        >
          {/* Secondary Email */}
          <div className="space-y-2">
            <Label htmlFor="secondaryEmail" className="text-white/80">
              <div className="flex items-center gap-2">
                <Mail className="size-4 text-blue-400" />
                Secondary Email Address
              </div>
            </Label>
            <Input
              id="secondaryEmail"
              type="email"
              placeholder="secondary@example.com"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              className={`border-white/10 bg-white/5 text-white placeholder:text-white/40 ${
                errors.email ? "border-red-500/50" : ""
              }`}
            />
            {errors.email && (
              <p className="text-sm text-red-400 flex items-center gap-1">
                <AlertTriangle className="size-3" />
                {errors.email}
              </p>
            )}
            <p className="text-xs text-white/60">
              Used for account recovery and important notifications
            </p>
          </div>

          {/* Secondary Phone */}
          <div className="space-y-2">
            <Label htmlFor="secondaryPhone" className="text-white/80">
              <div className="flex items-center gap-2">
                <Phone className="size-4 text-green-400" />
                Secondary Phone Number
              </div>
            </Label>
            <Input
              id="secondaryPhone"
              type="tel"
              placeholder="+1 (555) 123-4567"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              className={`border-white/10 bg-white/5 text-white placeholder:text-white/40 ${
                errors.phone ? "border-red-500/50" : ""
              }`}
            />
            {errors.phone && (
              <p className="text-sm text-red-400 flex items-center gap-1">
                <AlertTriangle className="size-3" />
                {errors.phone}
              </p>
            )}
            <p className="text-xs text-white/60">
              Used for SMS alerts and two-factor authentication
            </p>
          </div>

          {/* Info Alert */}
          <Alert className="bg-blue-500/10 border-blue-500/20">
            <Info className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-200 text-sm">
              Secondary contact information helps secure your account and provides
              alternative ways to reach you. At least one method is recommended.
            </AlertDescription>
          </Alert>

          {/* Success Preview */}
          {(email || phone) && !errors.email && !errors.phone && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg bg-green-500/10 p-4 border border-green-500/20"
            >
              <div className="flex items-start gap-3">
                <CheckCircle2 className="size-5 text-green-400 mt-0.5" />
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium text-green-400">
                    Ready to save
                  </p>
                  {email && (
                    <div className="flex items-center gap-2 text-sm text-white/80">
                      <Mail className="size-3" />
                      <span>{email}</span>
                    </div>
                  )}
                  {phone && (
                    <div className="flex items-center gap-2 text-sm text-white/80">
                      <Phone className="size-3" />
                      <span>{phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Warning if both are empty */}
          {!email && !phone && (
            <Alert className="bg-amber-500/10 border-amber-500/20">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <AlertDescription className="text-amber-200 text-sm">
                Without secondary contact information, account recovery may be
                more difficult if you lose access to your primary contact methods.
              </AlertDescription>
            </Alert>
          )}
        </motion.div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSaving}
            className="border-white/20 bg-white/10 text-white hover:bg-white/20"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="mr-2 size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 size-4" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
