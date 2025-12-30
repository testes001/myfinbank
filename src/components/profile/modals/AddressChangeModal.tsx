import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin,
  Upload,
  X,
  CheckCircle2,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { BaseModal, useModalState } from "@/components/ui/base-modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import VerificationAlert, {
  DocumentVerificationAlert,
  SecurityAlert,
  PendingVerificationAlert,
} from "./VerificationAlert";
import {
  addressChangeSchema,
  type AddressChangeFormData,
  formatZodError,
  getZodErrorMap,
} from "@/lib/validations/profile-schemas";
import { profileToasts, showError } from "@/lib/toast-messages";

interface AddressData {
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface AddressChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAddress?: string;
  onSubmit: (addressData: AddressData, verificationDoc: File) => Promise<void>;
  pendingChange?: any;
}

const initialFormState: AddressData = {
  streetAddress: "",
  city: "",
  state: "",
  zipCode: "",
  country: "United States",
};

export default function AddressChangeModal({
  isOpen,
  onClose,
  currentAddress,
  onSubmit,
  pendingChange,
}: AddressChangeModalProps) {
  const [addressData, setAddressData] = useState<AddressData>(initialFormState);
  const [verificationDoc, setVerificationDoc] = useState<File | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const modalState = useModalState();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setAddressData(initialFormState);
      setVerificationDoc(null);
      setFieldErrors({});
      modalState.reset();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [isOpen]);

  const handleAddressChange = (field: keyof AddressData, value: string) => {
    setAddressData((prev) => ({ ...prev, [field]: value }));
    // Clear field error when user types
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleFileSelect = (file: File) => {
    // Validate file type
    const validTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];
    if (!validTypes.includes(file.type)) {
      showError("Please upload a PDF or image file (JPG, PNG)");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      showError("File size must be less than 10MB");
      return;
    }

    setVerificationDoc(file);
    // Clear document error if exists
    if (fieldErrors.verificationDocument) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.verificationDocument;
        return newErrors;
      });
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleBrowseClick = () => {
    if (!pendingChange) {
      fileInputRef.current?.click();
    }
  };

  const handleRemoveFile = () => {
    setVerificationDoc(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    // Clear previous errors
    setFieldErrors({});

    // Validate with Zod
    const validationData: AddressChangeFormData = {
      streetAddress: addressData.streetAddress.trim(),
      city: addressData.city.trim(),
      state: addressData.state.trim(),
      zipCode: addressData.zipCode.trim(),
      country: addressData.country.trim(),
      verificationDocument: verificationDoc as File,
    };

    const result = addressChangeSchema.safeParse(validationData);

    if (!result.success) {
      const errors = getZodErrorMap(result.error);
      setFieldErrors(errors);
      showError(formatZodError(result.error));
      return;
    }

    modalState.setSubmitting();

    try {
      await onSubmit(addressData, result.data.verificationDocument);
      modalState.setSuccess();
      profileToasts.addressChangeSubmitted();
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to submit address change request";
      modalState.setError(errorMessage);
      showError(errorMessage);
    }
  };

  const handleClose = () => {
    if (!modalState.isSubmitting) {
      setAddressData(initialFormState);
      setVerificationDoc(null);
      setFieldErrors({});
      modalState.reset();
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onClose();
    }
  };

  const isFormValid =
    addressData.streetAddress.trim() &&
    addressData.city.trim() &&
    addressData.state.trim() &&
    addressData.zipCode.trim() &&
    verificationDoc &&
    !pendingChange;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Change Address"
      description="Request an address change with verification documentation"
      icon={MapPin}
      iconColor="bg-green-500/20"
      state={modalState.state}
      error={modalState.error}
      successMessage="Address change request submitted successfully"
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
            className="bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
          >
            <CheckCircle2 className="mr-2 size-4" />
            {modalState.isSubmitting ? "Submitting..." : "Submit Request"}
          </Button>
        </>
      }
    >
      <div className="space-y-4 py-4 max-h-[calc(90vh-280px)] overflow-y-auto pr-2">
        {/* Current Address */}
        {currentAddress && (
          <div className="rounded-lg bg-white/5 p-4 border border-white/10">
            <Label className="text-sm text-white/60">Current Address</Label>
            <p className="mt-1 text-white">{currentAddress}</p>
          </div>
        )}

        {/* Pending Change Alert */}
        <AnimatePresence>
          {pendingChange && (
            <PendingVerificationAlert
              type="address"
              estimatedCompletion="2-5 business days"
            />
          )}
        </AnimatePresence>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Street Address */}
          <div className="space-y-2">
            <Label htmlFor="streetAddress" className="text-white/80">
              Street Address <span className="text-red-400">*</span>
            </Label>
            <Input
              id="streetAddress"
              type="text"
              placeholder="123 Main Street, Apt 4B"
              value={addressData.streetAddress}
              onChange={(e) =>
                handleAddressChange("streetAddress", e.target.value)
              }
              disabled={!!pendingChange || modalState.isSubmitting}
              className={`border-white/10 bg-white/5 text-white placeholder:text-white/40 ${
                fieldErrors.streetAddress
                  ? "border-red-500/50 focus-visible:ring-red-500"
                  : ""
              }`}
            />
            {fieldErrors.streetAddress && (
              <p className="text-xs text-red-400">
                {fieldErrors.streetAddress}
              </p>
            )}
          </div>

          {/* City and State */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city" className="text-white/80">
                City <span className="text-red-400">*</span>
              </Label>
              <Input
                id="city"
                type="text"
                placeholder="New York"
                value={addressData.city}
                onChange={(e) => handleAddressChange("city", e.target.value)}
                disabled={!!pendingChange || modalState.isSubmitting}
                className={`border-white/10 bg-white/5 text-white placeholder:text-white/40 ${
                  fieldErrors.city
                    ? "border-red-500/50 focus-visible:ring-red-500"
                    : ""
                }`}
              />
              {fieldErrors.city && (
                <p className="text-xs text-red-400">{fieldErrors.city}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state" className="text-white/80">
                State <span className="text-red-400">*</span>
              </Label>
              <Input
                id="state"
                type="text"
                placeholder="NY"
                maxLength={50}
                value={addressData.state}
                onChange={(e) => handleAddressChange("state", e.target.value)}
                disabled={!!pendingChange || modalState.isSubmitting}
                className={`border-white/10 bg-white/5 text-white placeholder:text-white/40 ${
                  fieldErrors.state
                    ? "border-red-500/50 focus-visible:ring-red-500"
                    : ""
                }`}
              />
              {fieldErrors.state && (
                <p className="text-xs text-red-400">{fieldErrors.state}</p>
              )}
            </div>
          </div>

          {/* Zip Code and Country */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zipCode" className="text-white/80">
                Zip Code <span className="text-red-400">*</span>
              </Label>
              <Input
                id="zipCode"
                type="text"
                placeholder="10001"
                value={addressData.zipCode}
                onChange={(e) => {
                  // Allow only digits and hyphen
                  const value = e.target.value.replace(/[^\d-]/g, "");
                  handleAddressChange("zipCode", value);
                }}
                maxLength={10}
                disabled={!!pendingChange || modalState.isSubmitting}
                className={`border-white/10 bg-white/5 text-white placeholder:text-white/40 font-mono ${
                  fieldErrors.zipCode
                    ? "border-red-500/50 focus-visible:ring-red-500"
                    : ""
                }`}
              />
              {fieldErrors.zipCode && (
                <p className="text-xs text-red-400">{fieldErrors.zipCode}</p>
              )}
              <p className="text-xs text-white/60">
                Format: 12345 or 12345-6789
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="country" className="text-white/80">
                Country
              </Label>
              <Input
                id="country"
                type="text"
                value={addressData.country}
                onChange={(e) => handleAddressChange("country", e.target.value)}
                disabled={!!pendingChange || modalState.isSubmitting}
                className="border-white/10 bg-white/5 text-white"
              />
            </div>
          </div>

          {/* Verification Document */}
          <div className="space-y-2">
            <Label className="text-white/80">
              Verification Document <span className="text-red-400">*</span>
            </Label>
            <DocumentVerificationAlert
              documentTypes={[
                "utility bill",
                "bank statement",
                "government ID",
              ]}
              processingTime="2-5 business days"
            />

            {!verificationDoc ? (
              <div
                onClick={handleBrowseClick}
                className={`rounded-lg border-2 border-dashed bg-white/5 p-6 text-center transition-all ${
                  pendingChange || modalState.isSubmitting
                    ? "cursor-not-allowed opacity-50"
                    : "cursor-pointer border-white/20 hover:border-white/40 hover:bg-white/10"
                } ${
                  fieldErrors.verificationDocument
                    ? "border-red-500/50"
                    : "border-white/20"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileInputChange}
                  disabled={!!pendingChange || modalState.isSubmitting}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-2">
                  <div className="flex size-12 items-center justify-center rounded-full bg-green-500/20">
                    <Upload className="size-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      Click to upload
                    </p>
                    <p className="text-xs text-white/60">
                      PDF, JPG, PNG up to 10MB
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-lg bg-white/5 p-4 border border-white/10"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-green-500/20">
                      <FileText className="size-5 text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">
                        {verificationDoc.name}
                      </p>
                      <p className="text-sm text-white/60">
                        {(verificationDoc.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleRemoveFile}
                    disabled={!!pendingChange || modalState.isSubmitting}
                    className="text-red-400 hover:bg-red-500/10"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {fieldErrors.verificationDocument && (
              <p className="text-xs text-red-400">
                {fieldErrors.verificationDocument}
              </p>
            )}
          </div>

          {/* Warning Alert */}
          <VerificationAlert
            type="warning"
            icon={AlertTriangle}
            title="Important Notice"
            message="Address changes require manual verification and may take 2-5 business days to process. You'll receive an email once your request is reviewed."
            animate={false}
          />

          {/* Security Info */}
          <SecurityAlert message="Your verification documents are encrypted and will only be viewed by authorized security personnel. They will be permanently deleted after verification." />

          {/* Success Preview */}
          <AnimatePresence>
            {isFormValid && !Object.keys(fieldErrors).length && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-lg bg-green-500/10 p-4 border border-green-500/20"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="size-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-400 mb-2">
                      Ready to submit
                    </p>
                    <p className="text-sm text-white/80">
                      {addressData.streetAddress}, {addressData.city},{" "}
                      {addressData.state} {addressData.zipCode}
                    </p>
                    <p className="text-xs text-white/60 mt-1">
                      Document: {verificationDoc.name}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </BaseModal>
  );
}
