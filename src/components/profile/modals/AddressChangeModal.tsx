import { motion } from "framer-motion";
import { useState, useRef } from "react";
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
  MapPin,
  Upload,
  X,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

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
  onSubmit: (
    addressData: AddressData,
    verificationDoc: File
  ) => Promise<void>;
  pendingChange?: any;
}

export default function AddressChangeModal({
  isOpen,
  onClose,
  currentAddress,
  onSubmit,
  pendingChange,
}: AddressChangeModalProps) {
  const [addressData, setAddressData] = useState<AddressData>({
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
  });
  const [verificationDoc, setVerificationDoc] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<AddressData>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddressChange = (field: keyof AddressData, value: string) => {
    setAddressData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
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
      toast.error("Please upload a PDF or image file (JPG, PNG)");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    setVerificationDoc(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setVerificationDoc(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<AddressData> = {};

    if (!addressData.streetAddress.trim()) {
      newErrors.streetAddress = "Street address is required";
    }

    if (!addressData.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!addressData.state.trim()) {
      newErrors.state = "State is required";
    }

    if (!addressData.zipCode.trim()) {
      newErrors.zipCode = "Zip code is required";
    } else if (!/^\d{5}(-\d{4})?$/.test(addressData.zipCode)) {
      newErrors.zipCode = "Invalid zip code format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!verificationDoc) {
      toast.error("Please upload a verification document");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(addressData, verificationDoc);
      toast.success("Address change request submitted for review");
      handleClose();
    } catch (error) {
      toast.error("Failed to submit address change request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setAddressData({
      streetAddress: "",
      city: "",
      state: "",
      zipCode: "",
      country: "United States",
    });
    setVerificationDoc(null);
    setErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="border-white/10 bg-gradient-to-br from-slate-900 via-green-900/20 to-slate-900 backdrop-blur-xl sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <div className="flex size-10 items-center justify-center rounded-full bg-green-500/20">
              <MapPin className="size-5 text-green-400" />
            </div>
            Change Address
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Request an address change with verification documentation
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto max-h-[calc(90vh-200px)] pr-2">
          {/* Current Address */}
          {currentAddress && (
            <div className="rounded-lg bg-white/5 p-4 border border-white/10">
              <Label className="text-sm text-white/60">Current Address</Label>
              <p className="mt-1 text-white">{currentAddress}</p>
            </div>
          )}

          {/* Pending Change Alert */}
          {pendingChange && (
            <Alert className="bg-amber-500/10 border-amber-500/20">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <AlertDescription className="text-amber-200 text-sm">
                You have a pending address change request. Please wait for it
                to be processed before submitting a new one.
              </AlertDescription>
            </Alert>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Street Address */}
            <div className="space-y-2">
              <Label htmlFor="streetAddress" className="text-white/80">
                Street Address *
              </Label>
              <Input
                id="streetAddress"
                type="text"
                placeholder="123 Main Street, Apt 4B"
                value={addressData.streetAddress}
                onChange={(e) =>
                  handleAddressChange("streetAddress", e.target.value)
                }
                disabled={!!pendingChange}
                className={`border-white/10 bg-white/5 text-white placeholder:text-white/40 ${
                  errors.streetAddress ? "border-red-500/50" : ""
                }`}
              />
              {errors.streetAddress && (
                <p className="text-sm text-red-400">{errors.streetAddress}</p>
              )}
            </div>

            {/* City and State */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city" className="text-white/80">
                  City *
                </Label>
                <Input
                  id="city"
                  type="text"
                  placeholder="New York"
                  value={addressData.city}
                  onChange={(e) => handleAddressChange("city", e.target.value)}
                  disabled={!!pendingChange}
                  className={`border-white/10 bg-white/5 text-white placeholder:text-white/40 ${
                    errors.city ? "border-red-500/50" : ""
                  }`}
                />
                {errors.city && (
                  <p className="text-sm text-red-400">{errors.city}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="state" className="text-white/80">
                  State *
                </Label>
                <Input
                  id="state"
                  type="text"
                  placeholder="NY"
                  value={addressData.state}
                  onChange={(e) => handleAddressChange("state", e.target.value)}
                  disabled={!!pendingChange}
                  className={`border-white/10 bg-white/5 text-white placeholder:text-white/40 ${
                    errors.state ? "border-red-500/50" : ""
                  }`}
                />
                {errors.state && (
                  <p className="text-sm text-red-400">{errors.state}</p>
                )}
              </div>
            </div>

            {/* Zip Code and Country */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zipCode" className="text-white/80">
                  Zip Code *
                </Label>
                <Input
                  id="zipCode"
                  type="text"
                  placeholder="10001"
                  value={addressData.zipCode}
                  onChange={(e) =>
                    handleAddressChange("zipCode", e.target.value)
                  }
                  disabled={!!pendingChange}
                  className={`border-white/10 bg-white/5 text-white placeholder:text-white/40 ${
                    errors.zipCode ? "border-red-500/50" : ""
                  }`}
                />
                {errors.zipCode && (
                  <p className="text-sm text-red-400">{errors.zipCode}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="country" className="text-white/80">
                  Country
                </Label>
                <Input
                  id="country"
                  type="text"
                  value={addressData.country}
                  onChange={(e) =>
                    handleAddressChange("country", e.target.value)
                  }
                  disabled={!!pendingChange}
                  className="border-white/10 bg-white/5 text-white"
                />
              </div>
            </div>

            {/* Verification Document */}
            <div className="space-y-2">
              <Label className="text-white/80">
                Verification Document *
              </Label>
              <p className="text-xs text-white/60 mb-2">
                Upload a utility bill, bank statement, or government ID showing
                your new address
              </p>

              {!verificationDoc ? (
                <div
                  onClick={handleBrowseClick}
                  className="cursor-pointer rounded-lg border-2 border-dashed border-white/20 bg-white/5 p-6 text-center transition-colors hover:border-white/40 hover:bg-white/10"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileInputChange}
                    disabled={!!pendingChange}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex size-12 items-center justify-center rounded-full bg-blue-500/20">
                      <Upload className="size-6 text-blue-400" />
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
                <div className="rounded-lg bg-white/5 p-4 border border-white/10">
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
                      disabled={!!pendingChange}
                      className="text-red-400 hover:bg-red-500/10"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Warning Alert */}
            <Alert className="bg-amber-500/10 border-amber-500/20">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <AlertDescription className="text-amber-200 text-sm">
                Address changes require manual verification and may take 2-5
                business days to process. You'll receive an email once your
                request is reviewed.
              </AlertDescription>
            </Alert>

            {/* Security Info */}
            <Alert className="bg-blue-500/10 border-blue-500/20">
              <Shield className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-200 text-sm">
                Your verification documents are encrypted and will only be
                viewed by authorized security personnel. They will be
                permanently deleted after verification.
              </AlertDescription>
            </Alert>

            {/* Success Preview */}
            {addressData.streetAddress &&
              addressData.city &&
              addressData.state &&
              addressData.zipCode &&
              verificationDoc &&
              !pendingChange && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg bg-green-500/10 p-4 border border-green-500/20"
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="size-5 text-green-400 mt-0.5" />
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
          </motion.div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="border-white/20 bg-white/10 text-white hover:bg-white/20"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !!pendingChange}
            className="bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="mr-2 size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 size-4" />
                Submit Request
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
