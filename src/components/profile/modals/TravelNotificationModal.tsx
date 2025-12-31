import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plane,
  CheckCircle2,
  Calendar,
  MapPin,
  Globe,
  Info,
  Clock,
} from "lucide-react";
import { BaseModal, useModalState } from "@/components/ui/base-modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  travelNotificationSchema,
  type TravelNotificationFormData,
  formatZodError,
  getZodErrorMap,
} from "@/lib/validations/profile-schemas";
import { servicesToasts, showError } from "@/lib/toast-messages";

interface TravelNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: {
    destination: string;
    startDate: string;
    endDate: string;
  }) => Promise<void>;
}

export default function TravelNotificationModal({
  isOpen,
  onClose,
  onAdd,
}: TravelNotificationModalProps) {
  const [formData, setFormData] = useState<TravelNotificationFormData>({
    destination: "",
    startDate: "",
    endDate: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const modalState = useModalState();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        destination: "",
        startDate: "",
        endDate: "",
      });
      setFieldErrors({});
      modalState.reset();
    }
  }, [isOpen]);

  const handleInputChange = (
    field: keyof TravelNotificationFormData,
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

  const calculateTravelDuration = (): number | null => {
    if (!formData.startDate || !formData.endDate) return null;

    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getTodayDate = (): string => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  const validateForm = (): boolean => {
    const result = travelNotificationSchema.safeParse(formData);

    if (!result.success) {
      const errors = getZodErrorMap(result.error);
      setFieldErrors(errors);
      showError(formatZodError(result.error));
      return false;
    }

    setFieldErrors({});
    return true;
  };

  const handleSubmit = async () => {
    // Validate form
    if (!validateForm()) {
      return;
    }

    modalState.setSubmitting();

    try {
      await onAdd({
        destination: formData.destination,
        startDate: formData.startDate,
        endDate: formData.endDate,
      });

      modalState.setSuccess();
      servicesToasts.travelAdded(formData.destination);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to add travel notification";
      modalState.setError(errorMessage);
    }
  };

  const handleClose = () => {
    if (!modalState.isSubmitting) {
      setFormData({
        destination: "",
        startDate: "",
        endDate: "",
      });
      setFieldErrors({});
      modalState.reset();
      onClose();
    }
  };

  const duration = calculateTravelDuration();
  const isFormValid =
    formData.destination.trim() && formData.startDate && formData.endDate;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Travel Notification"
      description="Let us know where you're traveling to prevent card declines"
      icon={Plane}
      iconColor="bg-cyan-500/20"
      state={modalState.state}
      error={modalState.error}
      successMessage={`Travel notification added for ${formData.destination}. Your cards will work seamlessly during your trip!`}
      size="md"
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
            disabled={modalState.isSubmitting || !isFormValid}
            className="bg-cyan-500 hover:bg-cyan-600 text-white disabled:opacity-50"
          >
            <CheckCircle2 className="mr-2 size-4" />
            Add Notification
          </Button>
        </>
      }
    >
      <div className="space-y-4 py-4">
        {/* Destination */}
        <div className="space-y-2">
          <Label htmlFor="destination" className="text-white/80">
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-cyan-400" />
              Destination
              <span className="text-red-400">*</span>
            </div>
          </Label>
          <Input
            id="destination"
            placeholder="e.g., Paris, France or Tokyo, Japan"
            value={formData.destination}
            onChange={(e) => handleInputChange("destination", e.target.value)}
            className={`border-white/10 bg-white/5 text-white placeholder:text-white/40 ${
              fieldErrors.destination ? "border-red-500/50" : ""
            }`}
            autoComplete="off"
            autoFocus
          />
          {fieldErrors.destination && (
            <p className="text-sm text-red-400 flex items-center gap-1">
              {fieldErrors.destination}
            </p>
          )}
          <p className="text-xs text-white/60">
            Enter the city and country you'll be visiting
          </p>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-4">
          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="startDate" className="text-white/80">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-green-400" />
                Start Date
                <span className="text-red-400">*</span>
              </div>
            </Label>
            <Input
              id="startDate"
              type="date"
              min={getTodayDate()}
              value={formData.startDate}
              onChange={(e) => handleInputChange("startDate", e.target.value)}
              className={`border-white/10 bg-white/5 text-white ${
                fieldErrors.startDate ? "border-red-500/50" : ""
              }`}
            />
            {fieldErrors.startDate && (
              <p className="text-sm text-red-400 flex items-center gap-1">
                {fieldErrors.startDate}
              </p>
            )}
            {formData.startDate && !fieldErrors.startDate && (
              <p className="text-xs text-green-400">
                {formatDate(formData.startDate)}
              </p>
            )}
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label htmlFor="endDate" className="text-white/80">
              <div className="flex items-center gap-2">
                <Calendar className="size-4 text-red-400" />
                End Date
                <span className="text-red-400">*</span>
              </div>
            </Label>
            <Input
              id="endDate"
              type="date"
              min={formData.startDate || getTodayDate()}
              value={formData.endDate}
              onChange={(e) => handleInputChange("endDate", e.target.value)}
              className={`border-white/10 bg-white/5 text-white ${
                fieldErrors.endDate ? "border-red-500/50" : ""
              }`}
            />
            {fieldErrors.endDate && (
              <p className="text-sm text-red-400 flex items-center gap-1">
                {fieldErrors.endDate}
              </p>
            )}
            {formData.endDate && !fieldErrors.endDate && (
              <p className="text-xs text-green-400">
                {formatDate(formData.endDate)}
              </p>
            )}
          </div>
        </div>

        {/* Travel Duration Display */}
        {duration !== null &&
          duration >= 0 &&
          !fieldErrors.startDate &&
          !fieldErrors.endDate && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg bg-cyan-500/10 p-4 border border-cyan-500/20"
            >
              <div className="flex items-center gap-3">
                <Clock className="size-5 text-cyan-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-cyan-400">
                    Trip Duration
                  </p>
                  <p className="text-white text-lg font-semibold">
                    {duration === 0
                      ? "Same day"
                      : duration === 1
                        ? "1 day"
                        : `${duration} days`}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

        {/* Travel Summary Preview */}
        {isFormValid && !Object.keys(fieldErrors).length && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg bg-white/5 p-4 border border-white/10"
          >
            <div className="flex items-start gap-3">
              <Globe className="size-5 text-purple-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <p className="text-sm font-medium text-white/80">
                  Travel Summary
                </p>
                <div className="space-y-1">
                  <p className="text-white">
                    <span className="text-white/60">Destination: </span>
                    <span className="font-semibold">
                      {formData.destination}
                    </span>
                  </p>
                  <p className="text-white">
                    <span className="text-white/60">Dates: </span>
                    <span className="font-medium">
                      {formatDate(formData.startDate)} →{" "}
                      {formatDate(formData.endDate)}
                    </span>
                  </p>
                  {duration !== null && (
                    <p className="text-white">
                      <span className="text-white/60">Duration: </span>
                      <span className="font-medium">
                        {duration === 0
                          ? "Same day trip"
                          : duration === 1
                            ? "1 day"
                            : `${duration} days`}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Information Alerts */}
        <div className="space-y-3">
          <div className="rounded-lg bg-blue-500/10 p-4 border border-blue-500/20">
            <div className="flex items-start gap-3">
              <Info className="size-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-blue-400 font-semibold text-sm mb-1">
                  Why Add a Travel Notification?
                </h4>
                <p className="text-blue-200 text-sm">
                  Travel notifications help us distinguish between legitimate
                  purchases and potential fraud. This prevents your card from
                  being declined while you're traveling.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-green-500/10 p-4 border border-green-500/20">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="size-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-green-400 font-semibold text-sm mb-1">
                  What Happens Next?
                </h4>
                <p className="text-green-200 text-sm">
                  Your travel notification will be active immediately. All your
                  cards will work normally at your destination. You'll receive a
                  confirmation email with your travel details.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-purple-500/10 p-4 border border-purple-500/20">
            <div className="flex items-start gap-3">
              <Globe className="size-5 text-purple-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h4 className="text-purple-400 font-semibold text-sm mb-1">
                  International Travel Tips
                </h4>
                <ul className="text-purple-200 text-sm space-y-1 list-disc list-inside">
                  <li>Your card works in 200+ countries worldwide</li>
                  <li>
                    No foreign transaction fees on international purchases
                  </li>
                  <li>ATM withdrawals available at partner banks</li>
                  <li>24/7 customer support while traveling</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BaseModal>
  );
}
