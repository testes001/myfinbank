import { z } from "zod";

// ============================================================================
// SECONDARY CONTACT VALIDATION
// ============================================================================

export const secondaryContactSchema = z.object({
  secondaryEmail: z
    .string()
    .email("Please enter a valid email address")
    .optional()
    .or(z.literal("")),
  secondaryPhone: z
    .string()
    .regex(
      /^\+?[\d\s\-\(\)]+$/,
      "Please enter a valid phone number"
    )
    .min(10, "Phone number must be at least 10 digits")
    .optional()
    .or(z.literal("")),
}).refine(
  (data) => data.secondaryEmail || data.secondaryPhone,
  {
    message: "Please provide at least one secondary contact method",
    path: ["secondaryEmail"],
  }
);

export type SecondaryContactFormData = z.infer<typeof secondaryContactSchema>;

// ============================================================================
// ADDRESS CHANGE VALIDATION
// ============================================================================

export const addressChangeSchema = z.object({
  streetAddress: z
    .string()
    .min(5, "Street address must be at least 5 characters")
    .max(200, "Street address is too long"),
  city: z
    .string()
    .min(2, "City name must be at least 2 characters")
    .max(100, "City name is too long"),
  state: z
    .string()
    .min(2, "State is required")
    .max(50, "State name is too long"),
  zipCode: z
    .string()
    .regex(/^\d{5}(-\d{4})?$/, "Please enter a valid ZIP code (e.g., 12345 or 12345-6789)"),
  country: z
    .string()
    .min(2, "Country is required")
    .default("United States"),
  verificationDocument: z
    .instanceof(File, { message: "Please upload a verification document" })
    .refine(
      (file) => file.size <= 10 * 1024 * 1024,
      "File size must be less than 10MB"
    )
    .refine(
      (file) =>
        ["application/pdf", "image/jpeg", "image/jpg", "image/png"].includes(
          file.type
        ),
      "File must be PDF, JPG, or PNG"
    ),
});

export type AddressChangeFormData = z.infer<typeof addressChangeSchema>;

// ============================================================================
// TWO-FACTOR AUTHENTICATION VALIDATION
// ============================================================================

export const twoFactorMethodSchema = z.enum(["sms", "authenticator", "push"], {
  errorMap: () => ({ message: "Please select a valid 2FA method" }),
});

export const twoFactorSetupSchema = z.object({
  method: twoFactorMethodSchema,
  verificationCode: z
    .string()
    .length(6, "Verification code must be 6 digits")
    .regex(/^\d{6}$/, "Verification code must contain only numbers"),
});

export type TwoFactorSetupFormData = z.infer<typeof twoFactorSetupSchema>;

// ============================================================================
// BIOMETRIC AUTHENTICATION VALIDATION
// ============================================================================

export const biometricTypeSchema = z.enum(["fingerprint", "face", "none"], {
  errorMap: () => ({ message: "Please select a valid biometric type" }),
});

export const biometricSetupSchema = z.object({
  type: biometricTypeSchema,
});

export type BiometricSetupFormData = z.infer<typeof biometricSetupSchema>;

// ============================================================================
// ACCOUNT NICKNAME VALIDATION
// ============================================================================

export const accountNicknameSchema = z.object({
  nickname: z
    .string()
    .min(1, "Nickname cannot be empty")
    .max(50, "Nickname must be 50 characters or less")
    .regex(
      /^[a-zA-Z0-9\s\-_]+$/,
      "Nickname can only contain letters, numbers, spaces, hyphens, and underscores"
    ),
});

export type AccountNicknameFormData = z.infer<typeof accountNicknameSchema>;

// ============================================================================
// LINK EXTERNAL ACCOUNT VALIDATION
// ============================================================================

export const linkAccountSchema = z.object({
  bankName: z
    .string()
    .min(2, "Bank name must be at least 2 characters")
    .max(100, "Bank name is too long"),
  accountType: z.enum(["checking", "savings"], {
    errorMap: () => ({ message: "Please select checking or savings" }),
  }),
  routingNumber: z
    .string()
    .length(9, "Routing number must be exactly 9 digits")
    .regex(/^\d{9}$/, "Routing number must contain only numbers"),
  accountNumber: z
    .string()
    .min(4, "Account number must be at least 4 digits")
    .max(17, "Account number is too long")
    .regex(/^\d+$/, "Account number must contain only numbers"),
  confirmAccountNumber: z.string(),
}).refine(
  (data) => data.accountNumber === data.confirmAccountNumber,
  {
    message: "Account numbers do not match",
    path: ["confirmAccountNumber"],
  }
);

export type LinkAccountFormData = z.infer<typeof linkAccountSchema>;

// ============================================================================
// LIMIT UPGRADE VALIDATION
// ============================================================================

export const limitTypeSchema = z.enum([
  "daily_transfer",
  "atm_withdrawal",
  "mobile_deposit",
  "wire_transfer",
]);

export const limitUpgradeSchema = z.object({
  limitType: limitTypeSchema,
  requestedAmount: z
    .number()
    .positive("Amount must be greater than 0")
    .max(1000000, "Requested amount is too high"),
  reason: z
    .string()
    .min(10, "Please provide a reason (at least 10 characters)")
    .max(500, "Reason is too long")
    .optional(),
});

export type LimitUpgradeFormData = z.infer<typeof limitUpgradeSchema>;

// ============================================================================
// TRAVEL NOTIFICATION VALIDATION
// ============================================================================

export const travelNotificationSchema = z.object({
  destination: z
    .string()
    .min(2, "Destination must be at least 2 characters")
    .max(100, "Destination is too long"),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
}).refine(
  (data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end >= start;
  },
  {
    message: "End date must be after or equal to start date",
    path: ["endDate"],
  }
).refine(
  (data) => {
    const start = new Date(data.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return start >= today;
  },
  {
    message: "Start date cannot be in the past",
    path: ["startDate"],
  }
);

export type TravelNotificationFormData = z.infer<typeof travelNotificationSchema>;

// ============================================================================
// WIRE TRANSFER VALIDATION
// ============================================================================

export const wireTransferSchema = z.object({
  type: z.enum(["domestic", "international"]),
  recipientName: z
    .string()
    .min(2, "Recipient name must be at least 2 characters")
    .max(100, "Recipient name is too long"),
  amount: z
    .number()
    .positive("Amount must be greater than 0")
    .max(1000000, "Amount exceeds maximum limit"),
  bankName: z
    .string()
    .min(2, "Bank name must be at least 2 characters")
    .max(100, "Bank name is too long"),
  routingNumber: z
    .string()
    .length(9, "Routing number must be exactly 9 digits")
    .regex(/^\d{9}$/, "Routing number must contain only numbers")
    .optional(),
  accountNumber: z
    .string()
    .min(4, "Account number must be at least 4 digits")
    .max(17, "Account number is too long")
    .regex(/^\d+$/, "Account number must contain only numbers"),
  swiftCode: z
    .string()
    .regex(/^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/, "Invalid SWIFT code format")
    .optional(),
  reference: z
    .string()
    .max(200, "Reference is too long")
    .optional(),
}).refine(
  (data) => {
    // Domestic transfers require routing number
    if (data.type === "domestic" && !data.routingNumber) {
      return false;
    }
    // International transfers require SWIFT code
    if (data.type === "international" && !data.swiftCode) {
      return false;
    }
    return true;
  },
  {
    message: "Required field is missing for transfer type",
    path: ["routingNumber"],
  }
);

export type WireTransferFormData = z.infer<typeof wireTransferSchema>;

// ============================================================================
// BUDGET VALIDATION
// ============================================================================

export const budgetSchema = z.object({
  category: z
    .string()
    .min(2, "Category name must be at least 2 characters")
    .max(50, "Category name is too long")
    .regex(
      /^[a-zA-Z0-9\s\-&]+$/,
      "Category can only contain letters, numbers, spaces, hyphens, and ampersands"
    ),
  limit: z
    .number()
    .positive("Budget limit must be greater than 0")
    .max(1000000, "Budget limit is too high"),
  period: z
    .enum(["monthly", "weekly", "yearly"])
    .default("monthly")
    .optional(),
});

export type BudgetFormData = z.infer<typeof budgetSchema>;

// ============================================================================
// PROFILE PICTURE VALIDATION
// ============================================================================

export const profilePictureSchema = z.object({
  file: z
    .instanceof(File, { message: "Please select an image file" })
    .refine(
      (file) => file.size <= 5 * 1024 * 1024,
      "Image size must be less than 5MB"
    )
    .refine(
      (file) => file.type.startsWith("image/"),
      "File must be an image"
    )
    .refine(
      (file) =>
        ["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(
          file.type
        ),
      "Image must be JPEG, PNG, or WebP"
    ),
});

export type ProfilePictureFormData = z.infer<typeof profilePictureSchema>;

// ============================================================================
// NOTIFICATION PREFERENCES VALIDATION
// ============================================================================

export const notificationChannelSchema = z.object({
  email: z.boolean().default(false),
  push: z.boolean().default(false),
  sms: z.boolean().default(false),
});

export const notificationPreferencesSchema = z.object({
  transactions: notificationChannelSchema,
  security: notificationChannelSchema,
  billPay: notificationChannelSchema,
  deposits: notificationChannelSchema,
  marketing: notificationChannelSchema,
});

export type NotificationPreferencesFormData = z.infer<typeof notificationPreferencesSchema>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format Zod errors into user-friendly messages
 */
export function formatZodError(error: z.ZodError): string {
  const firstError = error.errors[0];
  return firstError?.message || "Validation error occurred";
}

/**
 * Get all validation errors as a map
 */
export function getZodErrorMap(error: z.ZodError): Record<string, string> {
  const errorMap: Record<string, string> = {};
  error.errors.forEach((err) => {
    const path = err.path.join(".");
    errorMap[path] = err.message;
  });
  return errorMap;
}

/**
 * Validate data and return typed result
 */
export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}
