import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  Phone,
  FileText,
  Shield,
  Clock,
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export type VerificationAlertVariant = "info" | "warning" | "success" | "error";

export interface VerificationAlertProps {
  variant?: VerificationAlertVariant;
  icon?: LucideIcon;
  title?: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const variantStyles: Record<VerificationAlertVariant, string> = {
  info: "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-100",
  warning:
    "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100",
  success:
    "border-green-200 bg-green-50 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100",
  error: "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100",
};

const variantIconColors: Record<VerificationAlertVariant, string> = {
  info: "text-blue-600 dark:text-blue-400",
  warning: "text-amber-600 dark:text-amber-400",
  success: "text-green-600 dark:text-green-400",
  error: "text-red-600 dark:text-red-400",
};

const defaultIcons: Record<VerificationAlertVariant, LucideIcon> = {
  info: Info,
  warning: AlertCircle,
  success: CheckCircle2,
  error: AlertCircle,
};

/**
 * Base VerificationAlert component
 *
 * A flexible alert component for displaying verification-related messages
 * with support for different variants, icons, actions, and dismissal.
 */
export function VerificationAlert({
  variant = "info",
  icon,
  title,
  message,
  action,
  dismissible = false,
  onDismiss,
  className,
}: VerificationAlertProps) {
  const Icon = icon || defaultIcons[variant];
  const iconColor = variantIconColors[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={cn("relative", className)}
    >
      <Alert className={cn("border-l-4", variantStyles[variant])}>
        <div className="flex items-start gap-3">
          {/* Icon */}
          <Icon className={cn("h-5 w-5 mt-0.5 flex-shrink-0", iconColor)} />

          {/* Content */}
          <div className="flex-1 space-y-1">
            {title && (
              <div className="font-semibold text-sm leading-tight">{title}</div>
            )}
            <AlertDescription className="text-sm leading-relaxed">
              {message}
            </AlertDescription>

            {/* Action Button */}
            {action && (
              <div className="mt-3">
                <Button
                  onClick={action.onClick}
                  variant="outline"
                  size="sm"
                  className={cn(
                    "h-8 text-xs font-medium",
                    variant === "info" &&
                      "border-blue-300 hover:bg-blue-100 dark:border-blue-700 dark:hover:bg-blue-900",
                    variant === "warning" &&
                      "border-amber-300 hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900",
                    variant === "success" &&
                      "border-green-300 hover:bg-green-100 dark:border-green-700 dark:hover:bg-green-900",
                    variant === "error" &&
                      "border-red-300 hover:bg-red-100 dark:border-red-700 dark:hover:bg-red-900"
                  )}
                >
                  {action.label}
                </Button>
              </div>
            )}
          </div>

          {/* Dismiss Button */}
          {dismissible && (
            <button
              onClick={onDismiss}
              className={cn(
                "flex-shrink-0 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2",
                iconColor
              )}
              aria-label="Dismiss alert"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </Alert>
    </motion.div>
  );
}

/**
 * Specialized wrapper for email verification alerts
 */
export interface EmailVerificationAlertProps {
  email?: string;
  onVerify?: () => void;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function EmailVerificationAlert({
  email,
  onVerify,
  dismissible,
  onDismiss,
  className,
}: EmailVerificationAlertProps) {
  return (
    <VerificationAlert
      variant="info"
      icon={Mail}
      title="Email Verification Required"
      message={
        email
          ? `Please verify your email address ${email} to continue.`
          : "Please verify your email address to continue."
      }
      action={
        onVerify
          ? {
              label: "Verify Email",
              onClick: onVerify,
            }
          : undefined
      }
      dismissible={dismissible}
      onDismiss={onDismiss}
      className={className}
    />
  );
}

/**
 * Specialized wrapper for phone verification alerts
 */
export interface PhoneVerificationAlertProps {
  phoneNumber?: string;
  onVerify?: () => void;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function PhoneVerificationAlert({
  phoneNumber,
  onVerify,
  dismissible,
  onDismiss,
  className,
}: PhoneVerificationAlertProps) {
  return (
    <VerificationAlert
      variant="info"
      icon={Phone}
      title="Phone Verification Required"
      message={
        phoneNumber
          ? `Please verify your phone number ${phoneNumber} to continue.`
          : "Please verify your phone number to continue."
      }
      action={
        onVerify
          ? {
              label: "Verify Phone",
              onClick: onVerify,
            }
          : undefined
      }
      dismissible={dismissible}
      onDismiss={onDismiss}
      className={className}
    />
  );
}

/**
 * Specialized wrapper for document verification alerts
 */
export interface DocumentVerificationAlertProps {
  documentType?: string;
  message?: string;
  onUpload?: () => void;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function DocumentVerificationAlert({
  documentType = "identity document",
  message,
  onUpload,
  dismissible,
  onDismiss,
  className,
}: DocumentVerificationAlertProps) {
  return (
    <VerificationAlert
      variant="warning"
      icon={FileText}
      title="Document Verification Required"
      message={
        message ||
        `Please upload a ${documentType} to verify your information. Accepted formats: PDF, JPEG, PNG (max 5MB).`
      }
      action={
        onUpload
          ? {
              label: "Upload Document",
              onClick: onUpload,
            }
          : undefined
      }
      dismissible={dismissible}
      onDismiss={onDismiss}
      className={className}
    />
  );
}

/**
 * Specialized wrapper for security alerts
 */
export interface SecurityAlertProps {
  title?: string;
  message: string;
  onAction?: () => void;
  actionLabel?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function SecurityAlert({
  title = "Security Notice",
  message,
  onAction,
  actionLabel = "Review Settings",
  dismissible,
  onDismiss,
  className,
}: SecurityAlertProps) {
  return (
    <VerificationAlert
      variant="warning"
      icon={Shield}
      title={title}
      message={message}
      action={
        onAction
          ? {
              label: actionLabel,
              onClick: onAction,
            }
          : undefined
      }
      dismissible={dismissible}
      onDismiss={onDismiss}
      className={className}
    />
  );
}

/**
 * Specialized wrapper for pending verification alerts
 */
export interface PendingVerificationAlertProps {
  type?: "email" | "phone" | "document" | "identity";
  estimatedTime?: string;
  message?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function PendingVerificationAlert({
  type = "identity",
  estimatedTime = "24-48 hours",
  message,
  dismissible,
  onDismiss,
  className,
}: PendingVerificationAlertProps) {
  const typeLabels = {
    email: "email verification",
    phone: "phone verification",
    document: "document verification",
    identity: "identity verification",
  };

  return (
    <VerificationAlert
      variant="info"
      icon={Clock}
      title="Verification Pending"
      message={
        message ||
        `Your ${typeLabels[type]} is currently being processed. This typically takes ${estimatedTime}. We'll notify you once it's complete.`
      }
      dismissible={dismissible}
      onDismiss={onDismiss}
      className={className}
    />
  );
}

/**
 * Specialized wrapper for verification success alerts
 */
export interface VerificationSuccessAlertProps {
  type?: "email" | "phone" | "document" | "identity" | "two-factor";
  message?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export function VerificationSuccessAlert({
  type = "identity",
  message,
  dismissible = true,
  onDismiss,
  className,
}: VerificationSuccessAlertProps) {
  const typeLabels = {
    email: "Email",
    phone: "Phone number",
    document: "Document",
    identity: "Identity",
    "two-factor": "Two-factor authentication",
  };

  return (
    <VerificationAlert
      variant="success"
      icon={CheckCircle2}
      title="Verification Complete"
      message={
        message || `${typeLabels[type]} has been successfully verified. Thank you!`
      }
      dismissible={dismissible}
      onDismiss={onDismiss}
      className={className}
    />
  );
}

/**
 * AnimatePresence wrapper for conditional rendering
 * Use this when showing/hiding alerts with animations
 */
export function AnimatedVerificationAlert({
  show,
  children,
}: {
  show: boolean;
  children: React.ReactNode;
}) {
  return <AnimatePresence>{show && children}</AnimatePresence>;
}
