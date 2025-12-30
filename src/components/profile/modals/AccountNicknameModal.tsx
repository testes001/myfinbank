import { useState, useEffect } from "react";
import { Edit, CheckCircle2 } from "lucide-react";
import { BaseModal, useModalState } from "@/components/ui/base-modal";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  accountNicknameSchema,
  type AccountNicknameFormData,
  formatZodError,
} from "@/lib/validations/profile-schemas";
import { profileToasts, showError } from "@/lib/toast-messages";

interface AccountNicknameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNickname: string;
  onSave: (nickname: string) => Promise<void>;
}

export default function AccountNicknameModal({
  isOpen,
  onClose,
  currentNickname,
  onSave,
}: AccountNicknameModalProps) {
  const [nickname, setNickname] = useState(currentNickname);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const modalState = useModalState();

  // Reset form when modal opens/closes or nickname changes
  useEffect(() => {
    if (isOpen) {
      setNickname(currentNickname);
      setFieldError(null);
      modalState.reset();
    }
  }, [isOpen, currentNickname]);

  const handleSave = async () => {
    // Clear previous errors
    setFieldError(null);

    // Validate with Zod
    const result = accountNicknameSchema.safeParse({ nickname });

    if (!result.success) {
      const errorMessage = formatZodError(result.error);
      setFieldError(errorMessage);
      showError(errorMessage);
      return;
    }

    // Check if nickname has changed
    if (nickname.trim() === currentNickname) {
      showError("Please enter a different nickname");
      return;
    }

    modalState.setSubmitting();

    try {
      await onSave(result.data.nickname);
      modalState.setSuccess();
      profileToasts.nicknameUpdated();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to update nickname";
      modalState.setError(errorMessage);
      showError(errorMessage);
    }
  };

  const handleClose = () => {
    if (!modalState.isSubmitting) {
      setNickname(currentNickname);
      setFieldError(null);
      modalState.reset();
      onClose();
    }
  };

  const isUnchanged = nickname.trim() === currentNickname;
  const canSave =
    nickname.trim().length > 0 && !isUnchanged && !modalState.isSubmitting;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Account Nickname"
      description="Choose a memorable name for your account"
      icon={Edit}
      iconColor="bg-blue-500/20"
      state={modalState.state}
      error={modalState.error}
      successMessage="Account nickname updated successfully"
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
            onClick={handleSave}
            disabled={!canSave}
            className="bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"
          >
            <CheckCircle2 className="mr-2 size-4" />
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="nickname" className="text-white/80">
            Account Nickname
          </Label>
          <Input
            id="nickname"
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value);
              setFieldError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && canSave) {
                handleSave();
              }
            }}
            maxLength={50}
            placeholder="e.g., Primary Checking, Savings Goal"
            className={`border-white/10 bg-white/5 text-white placeholder:text-white/40 ${
              fieldError ? "border-red-500/50 focus-visible:ring-red-500" : ""
            }`}
            disabled={modalState.isSubmitting}
            autoFocus
          />
          <div className="flex items-center justify-between text-xs">
            <span className={fieldError ? "text-red-400" : "text-white/60"}>
              {fieldError || `${nickname.length}/50 characters`}
            </span>
            {!fieldError && nickname.length >= 45 && (
              <span className="text-amber-400">
                {50 - nickname.length} characters remaining
              </span>
            )}
          </div>
        </div>

        <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3">
          <p className="text-sm text-blue-200">
            <strong className="font-medium">Tip:</strong> Use descriptive names
            like "Emergency Fund" or "Vacation Savings" to easily identify your
            accounts.
          </p>
        </div>
      </div>
    </BaseModal>
  );
}
