import { useState, useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  type LucideIcon,
} from "lucide-react";

export type ModalState = "idle" | "submitting" | "success" | "error";

export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: LucideIcon;
  iconColor?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  state?: ModalState;
  error?: string | null;
  successMessage?: string;
  onSuccess?: () => void;
  autoCloseOnSuccess?: boolean;
  autoCloseDelay?: number;
  className?: string;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
}

const sizeClasses = {
  sm: "sm:max-w-[400px]",
  md: "sm:max-w-[500px]",
  lg: "sm:max-w-[600px]",
  xl: "sm:max-w-[700px]",
};

export function BaseModal({
  isOpen,
  onClose,
  title,
  description,
  icon: Icon,
  iconColor = "bg-blue-500/20",
  children,
  footer,
  size = "md",
  state = "idle",
  error = null,
  successMessage = "Operation completed successfully",
  onSuccess,
  autoCloseOnSuccess = true,
  autoCloseDelay = 1500,
  className = "",
  showCloseButton = true,
  closeOnOverlayClick = true,
}: BaseModalProps) {
  const [localState, setLocalState] = useState<ModalState>(state);

  // Sync external state with local state
  useEffect(() => {
    setLocalState(state);
  }, [state]);

  // Handle success auto-close
  useEffect(() => {
    if (localState === "success" && autoCloseOnSuccess) {
      const timer = setTimeout(() => {
        onSuccess?.();
        onClose();
        setLocalState("idle");
      }, autoCloseDelay);

      return () => clearTimeout(timer);
    }
  }, [localState, autoCloseOnSuccess, autoCloseDelay, onSuccess, onClose]);

  // Reset state on close
  const handleClose = () => {
    if (localState !== "submitting") {
      setLocalState("idle");
      onClose();
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && closeOnOverlayClick && localState !== "submitting") {
      handleClose();
    }
  };

  // Determine if modal should be interactive
  const isSubmitting = localState === "submitting";
  const isSuccess = localState === "success";
  const isError = localState === "error";
  const isIdle = localState === "idle";

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        className={`border-white/10 bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 backdrop-blur-xl ${sizeClasses[size]} ${className}`}
        onPointerDownOutside={(e) => {
          if (!closeOnOverlayClick || isSubmitting) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (isSubmitting) {
            e.preventDefault();
          }
        }}
      >
        {/* Success Overlay */}
        <AnimatePresence>
          {isSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-green-900/95 via-emerald-900/95 to-green-900/95 backdrop-blur-sm rounded-lg"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                }}
                className="flex size-24 items-center justify-center rounded-full bg-green-500/20 mb-4"
              >
                <CheckCircle2 className="size-16 text-green-400" />
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-white mb-2"
              >
                Success!
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-green-200 text-center px-6"
              >
                {successMessage}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submitting Overlay */}
        <AnimatePresence>
          {isSubmitting && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-sm rounded-lg"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <Loader2 className="size-16 text-blue-400" />
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-4 text-white/80"
              >
                Processing...
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Header */}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            {Icon && (
              <div
                className={`flex size-10 items-center justify-center rounded-full ${iconColor}`}
              >
                <Icon className="size-5" />
              </div>
            )}
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-white/60">
              {description}
            </DialogDescription>
          )}
          {showCloseButton && !isSubmitting && (
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
              aria-label="Close"
            >
              <X className="size-4 text-white" />
            </button>
          )}
        </DialogHeader>

        {/* Error Alert */}
        <AnimatePresence>
          {isError && error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              <Alert className="bg-red-500/10 border-red-500/20">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-200 text-sm">
                  {error}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={isSubmitting || isSuccess ? "pointer-events-none" : ""}
        >
          {children}
        </motion.div>

        {/* Modal Footer */}
        {footer && <DialogFooter className="gap-2">{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
}

// Helper hook for managing modal state
export function useModalState() {
  const [state, setState] = useState<ModalState>("idle");
  const [error, setError] = useState<string | null>(null);

  const setSubmitting = () => {
    setState("submitting");
    setError(null);
  };

  const setSuccess = () => {
    setState("success");
    setError(null);
  };

  const setErrorState = (errorMessage: string) => {
    setState("error");
    setError(errorMessage);
  };

  const reset = () => {
    setState("idle");
    setError(null);
  };

  return {
    state,
    error,
    setSubmitting,
    setSuccess,
    setError: setErrorState,
    reset,
    isSubmitting: state === "submitting",
    isSuccess: state === "success",
    isError: state === "error",
    isIdle: state === "idle",
  };
}
