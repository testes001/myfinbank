import { toast } from "sonner";

// ============================================================================
// TOAST MESSAGE TYPES
// ============================================================================

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastOptions {
  duration?: number;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// ============================================================================
// STANDARDIZED MESSAGES
// ============================================================================

export const TOAST_MESSAGES = {
  // Profile & Account
  PROFILE_UPDATED: "Profile updated successfully",
  PROFILE_PHOTO_UPLOADED:
    "Profile photo uploaded successfully. This cannot be changed.",
  SECONDARY_CONTACT_SAVED: "Secondary contact information saved",
  ACCOUNT_NICKNAME_UPDATED: "Account nickname updated",

  // Address
  ADDRESS_CHANGE_SUBMITTED: "Address change request submitted for review",
  ADDRESS_CHANGE_PENDING: "You have a pending address change request",
  ADDRESS_VERIFICATION_REQUIRED: "Please upload a verification document",

  // Security
  TWO_FACTOR_ENABLED: "Two-factor authentication enabled successfully",
  TWO_FACTOR_DISABLED: "Two-factor authentication disabled",
  TWO_FACTOR_METHOD_UPDATED: "2FA method updated successfully",
  BIOMETRIC_ENABLED: "Biometric authentication enabled successfully",
  BIOMETRIC_DISABLED: "Biometric authentication disabled",
  PASSWORD_CHANGED: "Password changed successfully",
  PASSWORD_RESET_SENT: "Password reset email sent",
  SESSION_TERMINATED: "Session terminated successfully",
  ALL_SESSIONS_TERMINATED: "All other sessions terminated",

  // Services
  ACCOUNT_LINKED: "External account linked successfully",
  ACCOUNT_UNLINKED: "External account unlinked successfully",
  OVERDRAFT_ENABLED: "Overdraft protection enabled",
  OVERDRAFT_DISABLED: "Overdraft protection disabled",
  TRAVEL_NOTIFICATION_ADDED: "Travel notification added",
  TRAVEL_NOTIFICATION_REMOVED: "Travel notification removed",
  WIRE_TRANSFER_INITIATED: "Wire transfer initiated successfully",
  LIMIT_UPGRADE_REQUESTED: "Limit upgrade request submitted for review",

  // Notifications
  NOTIFICATION_PREFERENCES_SAVED: "Notification preferences saved",
  EMAIL_NOTIFICATIONS_ENABLED: "Email notifications enabled",
  EMAIL_NOTIFICATIONS_DISABLED: "Email notifications disabled",
  PUSH_NOTIFICATIONS_ENABLED: "Push notifications enabled",
  PUSH_NOTIFICATIONS_DISABLED: "Push notifications disabled",
  SMS_NOTIFICATIONS_ENABLED: "SMS notifications enabled",
  SMS_NOTIFICATIONS_DISABLED: "SMS notifications disabled",

  // Financial Tools
  BUDGET_ADDED: "Budget added successfully",
  BUDGET_UPDATED: "Budget updated successfully",
  BUDGET_REMOVED: "Budget removed successfully",
  REPORT_EXPORTED: "Report exported successfully",

  // Generic
  CHANGES_SAVED: "Changes saved successfully",
  OPERATION_SUCCESS: "Operation completed successfully",
  COPIED_TO_CLIPBOARD: "Copied to clipboard",

  // Errors
  GENERIC_ERROR: "An error occurred. Please try again.",
  NETWORK_ERROR: "Network error. Please check your connection.",
  VALIDATION_ERROR: "Please check your input and try again.",
  UNAUTHORIZED: "You are not authorized to perform this action.",
  SESSION_EXPIRED: "Your session has expired. Please log in again.",
  FILE_TOO_LARGE: "File size exceeds the maximum limit",
  INVALID_FILE_TYPE: "Invalid file type. Please select a valid file.",
  REQUIRED_FIELD: "Please fill in all required fields",

  // Warnings
  UNSAVED_CHANGES: "You have unsaved changes",
  CANNOT_UNDO: "This action cannot be undone",
  VERIFICATION_PENDING:
    "Verification is pending. This may take 2-5 business days.",
} as const;

// ============================================================================
// TOAST FUNCTIONS
// ============================================================================

/**
 * Show a success toast
 */
export function showSuccess(message: string, options?: ToastOptions) {
  return toast.success(message, {
    duration: options?.duration || 3000,
    description: options?.description,
    action: options?.action,
  });
}

/**
 * Show an error toast
 */
export function showError(message: string, options?: ToastOptions) {
  return toast.error(message, {
    duration: options?.duration || 4000,
    description: options?.description,
    action: options?.action,
  });
}

/**
 * Show a warning toast
 */
export function showWarning(message: string, options?: ToastOptions) {
  return toast.warning(message, {
    duration: options?.duration || 3500,
    description: options?.description,
    action: options?.action,
  });
}

/**
 * Show an info toast
 */
export function showInfo(message: string, options?: ToastOptions) {
  return toast.info(message, {
    duration: options?.duration || 3000,
    description: options?.description,
    action: options?.action,
  });
}

/**
 * Show a loading toast (returns ID for dismissal)
 */
export function showLoading(message: string = "Processing...") {
  return toast.loading(message);
}

/**
 * Dismiss a specific toast
 */
export function dismissToast(toastId: string | number) {
  toast.dismiss(toastId);
}

/**
 * Dismiss all toasts
 */
export function dismissAllToasts() {
  toast.dismiss();
}

// ============================================================================
// SPECIALIZED TOAST FUNCTIONS
// ============================================================================

/**
 * Profile & Account Toasts
 */
export const profileToasts = {
  photoUploaded: () => showSuccess(TOAST_MESSAGES.PROFILE_PHOTO_UPLOADED),
  profileUpdated: () => showSuccess(TOAST_MESSAGES.PROFILE_UPDATED),
  secondaryContactSaved: () =>
    showSuccess(TOAST_MESSAGES.SECONDARY_CONTACT_SAVED),
  nicknameUpdated: () => showSuccess(TOAST_MESSAGES.ACCOUNT_NICKNAME_UPDATED),
  addressChangeSubmitted: () =>
    showSuccess(TOAST_MESSAGES.ADDRESS_CHANGE_SUBMITTED, {
      description:
        "We'll review your request and update your address within 2-5 business days.",
      duration: 4000,
    }),
};

/**
 * Security Toasts
 */
export const securityToasts = {
  twoFactorEnabled: (method: string) =>
    showSuccess(TOAST_MESSAGES.TWO_FACTOR_ENABLED, {
      description: `You're now protected with ${method} verification`,
    }),
  twoFactorDisabled: () =>
    showWarning(TOAST_MESSAGES.TWO_FACTOR_DISABLED, {
      description: "Your account is less secure without 2FA",
    }),
  biometricEnabled: (type: string) =>
    showSuccess(TOAST_MESSAGES.BIOMETRIC_ENABLED, {
      description: `You can now use ${type} to log in`,
    }),
  biometricDisabled: () => showSuccess(TOAST_MESSAGES.BIOMETRIC_DISABLED),
  passwordChanged: () => showSuccess(TOAST_MESSAGES.PASSWORD_CHANGED),
  sessionTerminated: () => showSuccess(TOAST_MESSAGES.SESSION_TERMINATED),
  allSessionsTerminated: () =>
    showSuccess(TOAST_MESSAGES.ALL_SESSIONS_TERMINATED),
};

/**
 * Services Toasts
 */
export const servicesToasts = {
  accountLinked: (bankName: string) =>
    showSuccess(TOAST_MESSAGES.ACCOUNT_LINKED, {
      description: `${bankName} account is now connected`,
    }),
  accountUnlinked: () => showSuccess(TOAST_MESSAGES.ACCOUNT_UNLINKED),
  overdraftEnabled: () => showSuccess(TOAST_MESSAGES.OVERDRAFT_ENABLED),
  overdraftDisabled: () => showSuccess(TOAST_MESSAGES.OVERDRAFT_DISABLED),
  travelAdded: (destination: string) =>
    showSuccess(TOAST_MESSAGES.TRAVEL_NOTIFICATION_ADDED, {
      description: `Travel notification set for ${destination}`,
    }),
  wireTransferInitiated: (amount: number) =>
    showSuccess(TOAST_MESSAGES.WIRE_TRANSFER_INITIATED, {
      description: `Transfer of $${amount.toLocaleString()} is being processed`,
    }),
  limitUpgradeRequested: () =>
    showSuccess(TOAST_MESSAGES.LIMIT_UPGRADE_REQUESTED, {
      description: "We'll review your request within 1-3 business days",
    }),
};

/**
 * Notification Toasts
 */
export const notificationToasts = {
  preferencesSaved: () =>
    showSuccess(TOAST_MESSAGES.NOTIFICATION_PREFERENCES_SAVED),
  channelEnabled: (channel: string, category: string) =>
    showSuccess(`${channel} notifications enabled for ${category}`),
  channelDisabled: (channel: string, category: string) =>
    showSuccess(`${channel} notifications disabled for ${category}`),
  allEnabled: () => showSuccess("All notifications enabled"),
  allDisabled: () => showWarning("All notifications disabled"),
};

/**
 * Financial Tools Toasts
 */
export const toolsToasts = {
  budgetAdded: (category: string) =>
    showSuccess(TOAST_MESSAGES.BUDGET_ADDED, {
      description: `Budget created for ${category}`,
    }),
  budgetRemoved: (category: string) =>
    showSuccess(TOAST_MESSAGES.BUDGET_REMOVED, {
      description: `${category} budget removed`,
    }),
  reportExported: (type: string) =>
    showSuccess(TOAST_MESSAGES.REPORT_EXPORTED, {
      description: `${type} report has been downloaded`,
    }),
};

/**
 * Validation Error Toast
 */
export function showValidationError(fieldErrors: string[]) {
  showError(TOAST_MESSAGES.VALIDATION_ERROR, {
    description: fieldErrors.join(", "),
    duration: 4000,
  });
}

/**
 * API Error Toast Handler
 */
export function handleApiError(error: unknown) {
  if (error instanceof Error) {
    showError(error.message);
  } else if (typeof error === "string") {
    showError(error);
  } else {
    showError(TOAST_MESSAGES.GENERIC_ERROR);
  }
}

/**
 * Promise Toast - Shows loading, then success or error
 */
export async function showPromiseToast<T>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error: string;
  },
): Promise<T> {
  const toastId = showLoading(messages.loading);

  try {
    const result = await promise;
    dismissToast(toastId);
    showSuccess(messages.success);
    return result;
  } catch (error) {
    dismissToast(toastId);
    handleApiError(error);
    throw error;
  }
}

/**
 * Copy to Clipboard Toast
 */
export function showCopiedToast(item: string = "text") {
  showSuccess(TOAST_MESSAGES.COPIED_TO_CLIPBOARD, {
    description: `${item} has been copied`,
    duration: 2000,
  });
}

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Show multiple errors in sequence
 */
export function showErrors(errors: string[], delay: number = 500) {
  errors.forEach((error, index) => {
    setTimeout(() => showError(error), index * delay);
  });
}

/**
 * Show a sequence of toasts
 */
export function showSequence(
  messages: Array<{ type: ToastType; message: string; delay: number }>,
  onComplete?: () => void,
) {
  let totalDelay = 0;

  messages.forEach((item) => {
    setTimeout(() => {
      switch (item.type) {
        case "success":
          showSuccess(item.message);
          break;
        case "error":
          showError(item.message);
          break;
        case "warning":
          showWarning(item.message);
          break;
        case "info":
          showInfo(item.message);
          break;
      }
    }, totalDelay);

    totalDelay += item.delay;
  });

  if (onComplete) {
    setTimeout(onComplete, totalDelay);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  loading: showLoading,
  dismiss: dismissToast,
  dismissAll: dismissAllToasts,
  profile: profileToasts,
  security: securityToasts,
  services: servicesToasts,
  notifications: notificationToasts,
  tools: toolsToasts,
  validationError: showValidationError,
  apiError: handleApiError,
  promise: showPromiseToast,
  copied: showCopiedToast,
  messages: TOAST_MESSAGES,
};
