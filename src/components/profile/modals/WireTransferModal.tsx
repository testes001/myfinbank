import { useState, useEffect } from "react";
import { Send, DollarSign, AlertTriangle, Info } from "lucide-react";
import { BaseModal, useModalState } from "@/components/ui/base-modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  wireTransferSchema,
  type WireTransferFormData,
  formatZodError,
  getZodErrorMap,
} from "@/lib/validations/profile-schemas";
import { servicesToasts, showError } from "@/lib/toast-messages";

interface WireTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInitiate: (data: WireTransferFormData) => Promise<void>;
}

interface FormState {
  type: "domestic" | "international";
  recipientName: string;
  amount: string;
  bankName: string;
  routingNumber: string;
  accountNumber: string;
  swiftCode: string;
  reference: string;
}

const initialFormState: FormState = {
  type: "domestic",
  recipientName: "",
  amount: "",
  bankName: "",
  routingNumber: "",
  accountNumber: "",
  swiftCode: "",
  reference: "",
};

export default function WireTransferModal({
  isOpen,
  onClose,
  onInitiate,
}: WireTransferModalProps) {
  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const modalState = useModalState();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormState);
      setFieldErrors({});
      modalState.reset();
    }
  }, [isOpen]);

  const fee = formData.type === "domestic" ? 25 : 45;

  const handleFieldChange = (field: keyof FormState, value: string) => {
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

  const handleSubmit = async () => {
    // Clear previous errors
    setFieldErrors({});

    // Prepare data for validation
    const validationData = {
      type: formData.type,
      recipientName: formData.recipientName.trim(),
      amount: formData.amount ? parseFloat(formData.amount) : 0,
      bankName: formData.bankName.trim(),
      routingNumber: formData.routingNumber.trim(),
      accountNumber: formData.accountNumber.trim(),
      swiftCode: formData.swiftCode.trim() || undefined,
      reference: formData.reference.trim() || undefined,
    };

    // Validate with Zod
    const result = wireTransferSchema.safeParse(validationData);

    if (!result.success) {
      const errors = getZodErrorMap(result.error);
      setFieldErrors(errors);
      showError(formatZodError(result.error));
      return;
    }

    modalState.setSubmitting();

    try {
      await onInitiate(result.data);
      modalState.setSuccess();
      servicesToasts.wireTransferInitiated(result.data.amount);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to initiate wire transfer";
      modalState.setError(errorMessage);
      showError(errorMessage);
    }
  };

  const handleClose = () => {
    if (!modalState.isSubmitting) {
      setFormData(initialFormState);
      setFieldErrors({});
      modalState.reset();
      onClose();
    }
  };

  const isFormValid =
    formData.recipientName.trim() &&
    formData.amount &&
    parseFloat(formData.amount) > 0 &&
    formData.bankName.trim() &&
    formData.accountNumber.trim() &&
    (formData.type === "domestic"
      ? formData.routingNumber.trim()
      : formData.swiftCode.trim());

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Initiate Wire Transfer"
      description="Send funds via domestic or international wire transfer"
      icon={Send}
      iconColor="bg-indigo-500/20"
      state={modalState.state}
      error={modalState.error}
      successMessage={`Wire transfer of $${parseFloat(formData.amount || "0").toLocaleString()} initiated successfully`}
      size="lg"
      footer={
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
            onClick={handleSubmit}
            disabled={!isFormValid || modalState.isSubmitting}
            className="bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-50"
          >
            <Send className="mr-2 size-4" />
            {modalState.isSubmitting ? "Initiating..." : "Initiate Transfer"}
          </Button>
        </>
      }
    >
      <div className="space-y-4 py-4">
        {/* Transfer Type Selection */}
        <div className="space-y-3">
          <Label className="text-white/80">Transfer Type</Label>
          <RadioGroup
            value={formData.type}
            onValueChange={(v) =>
              handleFieldChange("type", v as "domestic" | "international")
            }
            disabled={modalState.isSubmitting}
          >
            <div
              className={`flex items-start gap-4 rounded-lg border p-4 transition-all cursor-pointer ${
                formData.type === "domestic"
                  ? "border-indigo-500/50 bg-indigo-500/10 shadow-lg shadow-indigo-500/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
              onClick={() => handleFieldChange("type", "domestic")}
            >
              <RadioGroupItem value="domestic" id="domestic" />
              <div className="flex-1">
                <Label
                  htmlFor="domestic"
                  className="text-base font-medium text-white cursor-pointer"
                >
                  Domestic
                </Label>
                <p className="text-sm text-white/60 mt-1">
                  Within the United States
                </p>
                <p className="text-xs text-indigo-400 mt-2">
                  Fee: ${fee} • Processing: 1-3 business days
                </p>
              </div>
            </div>
            <div
              className={`flex items-start gap-4 rounded-lg border p-4 transition-all cursor-pointer ${
                formData.type === "international"
                  ? "border-indigo-500/50 bg-indigo-500/10 shadow-lg shadow-indigo-500/10"
                  : "border-white/10 bg-white/5 hover:bg-white/10"
              }`}
              onClick={() => handleFieldChange("type", "international")}
            >
              <RadioGroupItem value="international" id="international" />
              <div className="flex-1">
                <Label
                  htmlFor="international"
                  className="text-base font-medium text-white cursor-pointer"
                >
                  International
                </Label>
                <p className="text-sm text-white/60 mt-1">
                  To any country worldwide
                </p>
                <p className="text-xs text-indigo-400 mt-2">
                  Fee: ${fee} • Processing: 3-5 business days
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Recipient Name */}
        <div className="space-y-2">
          <Label htmlFor="recipientName" className="text-white/80">
            Recipient Name <span className="text-red-400">*</span>
          </Label>
          <Input
            id="recipientName"
            placeholder="John Doe"
            value={formData.recipientName}
            onChange={(e) => handleFieldChange("recipientName", e.target.value)}
            className={`border-white/10 bg-white/5 text-white placeholder:text-white/40 ${
              fieldErrors.recipientName
                ? "border-red-500/50 focus-visible:ring-red-500"
                : ""
            }`}
            disabled={modalState.isSubmitting}
          />
          {fieldErrors.recipientName && (
            <p className="text-xs text-red-400">{fieldErrors.recipientName}</p>
          )}
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <Label htmlFor="amount" className="text-white/80">
            Amount <span className="text-red-400">*</span>
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" />
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="1000.00"
              value={formData.amount}
              onChange={(e) => handleFieldChange("amount", e.target.value)}
              className={`border-white/10 bg-white/5 text-white placeholder:text-white/40 pl-9 ${
                fieldErrors.amount
                  ? "border-red-500/50 focus-visible:ring-red-500"
                  : ""
              }`}
              disabled={modalState.isSubmitting}
            />
          </div>
          {fieldErrors.amount && (
            <p className="text-xs text-red-400">{fieldErrors.amount}</p>
          )}
          {formData.amount && parseFloat(formData.amount) > 0 && (
            <p className="text-xs text-white/60">
              Total with fee: $
              {(parseFloat(formData.amount) + fee).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          )}
        </div>

        {/* Bank Name */}
        <div className="space-y-2">
          <Label htmlFor="bankName" className="text-white/80">
            Recipient Bank Name <span className="text-red-400">*</span>
          </Label>
          <Input
            id="bankName"
            placeholder="Bank of America"
            value={formData.bankName}
            onChange={(e) => handleFieldChange("bankName", e.target.value)}
            className={`border-white/10 bg-white/5 text-white placeholder:text-white/40 ${
              fieldErrors.bankName
                ? "border-red-500/50 focus-visible:ring-red-500"
                : ""
            }`}
            disabled={modalState.isSubmitting}
          />
          {fieldErrors.bankName && (
            <p className="text-xs text-red-400">{fieldErrors.bankName}</p>
          )}
        </div>

        {/* Routing Number (Domestic Only) */}
        {formData.type === "domestic" && (
          <div className="space-y-2">
            <Label htmlFor="routingNumber" className="text-white/80">
              Routing Number <span className="text-red-400">*</span>
            </Label>
            <Input
              id="routingNumber"
              placeholder="123456789"
              maxLength={9}
              value={formData.routingNumber}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, "");
                handleFieldChange("routingNumber", value);
              }}
              className={`border-white/10 bg-white/5 text-white placeholder:text-white/40 font-mono ${
                fieldErrors.routingNumber
                  ? "border-red-500/50 focus-visible:ring-red-500"
                  : ""
              }`}
              disabled={modalState.isSubmitting}
            />
            {fieldErrors.routingNumber && (
              <p className="text-xs text-red-400">
                {fieldErrors.routingNumber}
              </p>
            )}
            <p className="text-xs text-white/60">9-digit routing number</p>
          </div>
        )}

        {/* SWIFT Code (International Only) */}
        {formData.type === "international" && (
          <div className="space-y-2">
            <Label htmlFor="swiftCode" className="text-white/80">
              SWIFT/BIC Code <span className="text-red-400">*</span>
            </Label>
            <Input
              id="swiftCode"
              placeholder="BOFAUS3N"
              maxLength={11}
              value={formData.swiftCode}
              onChange={(e) => {
                const value = e.target.value.toUpperCase();
                handleFieldChange("swiftCode", value);
              }}
              className={`border-white/10 bg-white/5 text-white placeholder:text-white/40 font-mono uppercase ${
                fieldErrors.swiftCode
                  ? "border-red-500/50 focus-visible:ring-red-500"
                  : ""
              }`}
              disabled={modalState.isSubmitting}
            />
            {fieldErrors.swiftCode && (
              <p className="text-xs text-red-400">{fieldErrors.swiftCode}</p>
            )}
            <p className="text-xs text-white/60">
              8 or 11 character SWIFT/BIC code
            </p>
          </div>
        )}

        {/* Account Number */}
        <div className="space-y-2">
          <Label htmlFor="accountNumber" className="text-white/80">
            Account Number <span className="text-red-400">*</span>
          </Label>
          <Input
            id="accountNumber"
            placeholder="Enter account number"
            value={formData.accountNumber}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              handleFieldChange("accountNumber", value);
            }}
            className={`border-white/10 bg-white/5 text-white placeholder:text-white/40 font-mono ${
              fieldErrors.accountNumber
                ? "border-red-500/50 focus-visible:ring-red-500"
                : ""
            }`}
            disabled={modalState.isSubmitting}
          />
          {fieldErrors.accountNumber && (
            <p className="text-xs text-red-400">{fieldErrors.accountNumber}</p>
          )}
        </div>

        {/* Reference (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="reference" className="text-white/80">
            Reference / Memo <span className="text-white/40">(Optional)</span>
          </Label>
          <Input
            id="reference"
            placeholder="Payment for invoice #12345"
            maxLength={200}
            value={formData.reference}
            onChange={(e) => handleFieldChange("reference", e.target.value)}
            className={`border-white/10 bg-white/5 text-white placeholder:text-white/40 ${
              fieldErrors.reference
                ? "border-red-500/50 focus-visible:ring-red-500"
                : ""
            }`}
            disabled={modalState.isSubmitting}
          />
          {fieldErrors.reference && (
            <p className="text-xs text-red-400">{fieldErrors.reference}</p>
          )}
          <p className="text-xs text-white/60">
            {formData.reference.length}/200 characters
          </p>
        </div>

        {/* Warning Alert */}
        <Alert className="bg-amber-500/10 border-amber-500/20">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          <AlertDescription className="text-amber-200 text-sm">
            <strong className="font-medium">Important:</strong> Wire transfers
            cannot be canceled once initiated. Please verify all details
            carefully before submitting.
          </AlertDescription>
        </Alert>

        {/* Fee Information */}
        <Alert className="bg-blue-500/10 border-blue-500/20">
          <Info className="h-4 w-4 text-blue-400" />
          <AlertDescription className="text-blue-200 text-sm">
            <div className="space-y-1">
              <p>
                <strong className="font-medium">Transfer Fee:</strong> ${fee}
              </p>
              <p>
                <strong className="font-medium">Processing Time:</strong>{" "}
                {formData.type === "domestic" ? "1-3" : "3-5"} business days
              </p>
              {formData.type === "international" && (
                <p className="text-xs text-blue-300 mt-2">
                  International transfers may incur additional fees from
                  intermediary banks.
                </p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </BaseModal>
  );
}
