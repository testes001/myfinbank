/**
 * @deprecated This file is deprecated. Use @/components/ui/verification-alert instead.
 *
 * This version is kept for backward compatibility but will be removed in a future version.
 * All new code should import from @/components/ui/verification-alert.
 *
 * Migration:
 * - Old: import { DocumentVerificationAlert } from "./VerificationAlert"
 * - New: import { DocumentVerificationAlert } from "@/components/ui/verification-alert"
 *
 * The new version has enhanced features:
 * - Action button support
 * - Dismissible functionality
 * - Better TypeScript support
 * - More consistent API
 */

import { motion } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Shield,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Mail,
  Phone,
  FileText,
  Info,
  type LucideIcon,
} from "lucide-react";

type VerificationType =
  | "email"
  | "phone"
  | "document"
  | "pending"
  | "success"
  | "warning"
  | "info";

interface VerificationAlertProps {
  type: VerificationType;
  title?: string;
  message: string;
  className?: string;
  icon?: LucideIcon;
  animate?: boolean;
}

const alertConfig: Record<
  VerificationType,
  {
    bgColor: string;
    borderColor: string;
    textColor: string;
    icon: LucideIcon;
    iconColor: string;
  }
> = {
  email: {
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    textColor: "text-blue-200",
    icon: Mail,
    iconColor: "text-blue-400",
  },
  phone: {
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    textColor: "text-green-200",
    icon: Phone,
    iconColor: "text-green-400",
  },
  document: {
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/20",
    textColor: "text-purple-200",
    icon: FileText,
    iconColor: "text-purple-400",
  },
  pending: {
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    textColor: "text-amber-200",
    icon: Clock,
    iconColor: "text-amber-400",
  },
  success: {
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/20",
    textColor: "text-green-200",
    icon: CheckCircle2,
    iconColor: "text-green-400",
  },
  warning: {
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/20",
    textColor: "text-amber-200",
    icon: AlertTriangle,
    iconColor: "text-amber-400",
  },
  info: {
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    textColor: "text-blue-200",
    icon: Info,
    iconColor: "text-blue-400",
  },
};

export default function VerificationAlert({
  type,
  title,
  message,
  className = "",
  icon: CustomIcon,
  animate = true,
}: VerificationAlertProps) {
  const config = alertConfig[type];
  const Icon = CustomIcon || config.icon;

  const alertContent = (
    <Alert className={`${config.bgColor} ${config.borderColor} ${className}`}>
      <Icon className={`h-4 w-4 ${config.iconColor}`} />
      <AlertDescription className={`${config.textColor} text-sm`}>
        {title && <strong className="font-medium block mb-1">{title}</strong>}
        {message}
      </AlertDescription>
    </Alert>
  );

  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
      >
        {alertContent}
      </motion.div>
    );
  }

  return alertContent;
}

// Specialized verification alert components for common use cases

interface EmailVerificationAlertProps {
  email: string;
  expiresIn?: string;
  className?: string;
}

export function EmailVerificationAlert({
  email,
  expiresIn = "24 hours",
  className,
}: EmailVerificationAlertProps) {
  return (
    <VerificationAlert
      type="email"
      title="Email Verification Required"
      message={`A verification link has been sent to ${email}. Please check your inbox and click the link to verify. The link expires in ${expiresIn}.`}
      className={className}
    />
  );
}

interface PhoneVerificationAlertProps {
  phone: string;
  codeLength?: number;
  className?: string;
}

export function PhoneVerificationAlert({
  phone,
  codeLength = 6,
  className,
}: PhoneVerificationAlertProps) {
  return (
    <VerificationAlert
      type="phone"
      title="SMS Verification Required"
      message={`A ${codeLength}-digit verification code has been sent to ${phone}. Please enter the code below to verify your phone number.`}
      className={className}
    />
  );
}

interface DocumentVerificationAlertProps {
  documentTypes?: string[];
  processingTime?: string;
  className?: string;
}

export function DocumentVerificationAlert({
  documentTypes = ["utility bill", "bank statement", "government ID"],
  processingTime = "2-5 business days",
  className,
}: DocumentVerificationAlertProps) {
  const typesText = documentTypes.join(", ");
  return (
    <VerificationAlert
      type="document"
      title="Document Verification Required"
      message={`Please upload a ${typesText} to verify your information. Documents will be reviewed within ${processingTime}.`}
      className={className}
    />
  );
}

interface SecurityAlertProps {
  message: string;
  className?: string;
}

export function SecurityAlert({ message, className }: SecurityAlertProps) {
  return (
    <VerificationAlert
      type="info"
      icon={Shield}
      title="Security Notice"
      message={message}
      className={className}
    />
  );
}

interface PendingVerificationAlertProps {
  type: "email" | "phone" | "document" | "address";
  estimatedCompletion?: string;
  className?: string;
}

export function PendingVerificationAlert({
  type,
  estimatedCompletion,
  className,
}: PendingVerificationAlertProps) {
  const messages: Record<typeof type, string> = {
    email: "Email verification is pending. Please check your inbox.",
    phone: "Phone verification is pending. Please check your messages.",
    document:
      "Document verification is in progress. Our team is reviewing your submission.",
    address:
      "Address change request is pending review. You'll receive an email once it's processed.",
  };

  return (
    <VerificationAlert
      type="pending"
      title="Verification Pending"
      message={
        estimatedCompletion
          ? `${messages[type]} Estimated completion: ${estimatedCompletion}.`
          : messages[type]
      }
      className={className}
    />
  );
}

interface VerificationSuccessAlertProps {
  message: string;
  className?: string;
}

export function VerificationSuccessAlert({
  message,
  className,
}: VerificationSuccessAlertProps) {
  return (
    <VerificationAlert type="success" message={message} className={className} />
  );
}
