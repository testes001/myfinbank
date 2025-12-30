import { useState, useEffect } from "react";
import { BaseModal, useModalState } from "@/components/ui/base-modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Mail, Phone, CheckCircle2, Info } from "lucide-react";
import {
  secondaryContactSchema,
  type SecondaryContactFormData,
  formatZodError,
  getZodErrorMap,
} from "@/lib/validations/profile-schemas";
import { profileToasts, showError } from "@/lib/toast-messages";

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
  const modalState = useModalState();
  const [formData, setFormData] = useState<SecondaryContactFormData>({
    secondaryEmail: currentSecondaryEmail,
    secondaryPhone: currentSecondaryPhone,
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        secondaryEmail: currentSecondaryEmail,
        secondaryPhone: currentSecondaryPhone,
      });
      setFieldErrors({});
      modalState.reset();
    }
  }, [isOpen, currentSecondaryEmail, currentSecondaryPhone]);

  const handleInputChange = (
    field: keyof SecondaryContactFormData,
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
    const result = secondaryContactSchema.safeParse(formData);

    if (!result.success) {
      const errors = getZodErrorMap(result.error);
      setFieldErrors(errors);
      showError(formatZodError(result.error));
      return false;
    }

    setFieldErrors({});
    return true;
  };

  const handleSave = async () => {
    // Validate form
    if (!validateForm()) {
      return;
    }

    // Set submitting state
    modalState.setSubmitting();

    try {
      // Call the save handler
      await onSave(
        formData.secondaryEmail || "",
        formData.secondaryPhone || "",
      );

      // Set success state
      modalState.setSuccess();

      // Toast will be shown by parent or use our standardized toast
      profileToasts.secondaryContactSaved();
    } catch (error) {
      // Set error state
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to save secondary contact information";
      modalState.setError(errorMessage);
    }
  };

  const hasChanges =
    formData.secondaryEmail !== currentSecondaryEmail ||
    formData.secondaryPhone !== currentSecondaryPhone;

  const isFormValid =
    (formData.secondaryEmail && formData.secondaryEmail.trim() !== "") ||
    (formData.secondaryPhone && formData.secondaryPhone.trim() !== "");

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Secondary Contact Information"
      description="Add alternative contact methods for account recovery and notifications"
      icon={Mail}
      iconColor="bg-blue-500/20"
      state={modalState.state}
      error={modalState.error}
      successMessage="Secondary contact information updated successfully"
      size="md"
      footer={
        <>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={modalState.isSubmitting}
            className="border-white/20 bg-white/10 text-white hover:bg-white/20"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={modalState.isSubmitting || !hasChanges || !isFormValid}
            className="bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
          >
            <CheckCircle2 className="mr-2 size-4" />
            Save Changes
          </Button>
        </>
      }
    >
      <div className="space-y-4 py-4">
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
            value={formData.secondaryEmail || ""}
            onChange={(e) =>
              handleInputChange("secondaryEmail", e.target.value)
            }
            className={`border-white/10 bg-white/5 text-white placeholder:text-white/40 ${
              fieldErrors.secondaryEmail ? "border-red-500/50" : ""
            }`}
          />
          {fieldErrors.secondaryEmail && (
            <p className="text-sm text-red-400 flex items-center gap-1">
              {fieldErrors.secondaryEmail}
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
            value={formData.secondaryPhone || ""}
            onChange={(e) =>
              handleInputChange("secondaryPhone", e.target.value)
            }
            className={`border-white/10 bg-white/5 text-white placeholder:text-white/40 ${
              fieldErrors.secondaryPhone ? "border-red-500/50" : ""
            }`}
          />
          {fieldErrors.secondaryPhone && (
            <p className="text-sm text-red-400 flex items-center gap-1">
              {fieldErrors.secondaryPhone}
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
            alternative ways to reach you. At least one method is required.
          </AlertDescription>
        </Alert>

        {/* Success Preview */}
        {isFormValid && !Object.keys(fieldErrors).length && (
          <div className="rounded-lg bg-green-500/10 p-4 border border-green-500/20">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="size-5 text-green-400 mt-0.5" />
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-green-400">
                  Ready to save
                </p>
                {formData.secondaryEmail && (
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <Mail className="size-3" />
                    <span>{formData.secondaryEmail}</span>
                  </div>
                )}
                {formData.secondaryPhone && (
                  <div className="flex items-center gap-2 text-sm text-white/80">
                    <Phone className="size-3" />
                    <span>{formData.secondaryPhone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Warning if both are empty */}
        {!formData.secondaryEmail && !formData.secondaryPhone && (
          <Alert className="bg-amber-500/10 border-amber-500/20">
            <Info className="h-4 w-4 text-amber-400" />
            <AlertDescription className="text-amber-200 text-sm">
              Without secondary contact information, account recovery may be
              more difficult if you lose access to your primary contact methods.
            </AlertDescription>
          </Alert>
        )}
      </div>
    </BaseModal>
  );
}
