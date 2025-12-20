/**
 * Fin-Bank Email Service Integration
 * Sends transactional emails via Resend API
 */

import type { EmailTemplate } from "./email-templates";
import { EmailTemplates } from "./email-templates";

const RESEND_API_KEY = import.meta.env?.VITE_RESEND_API_KEY || import.meta.env?.RESEND_API_KEY || "";
const FROM_EMAIL = "noreply@finbank.eu";
const FROM_NAME = "Fin-Bank";

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send email via Resend API
 */
export async function sendEmail(
  to: string,
  template: EmailTemplate,
): Promise<EmailSendResult> {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not configured");
    return { success: false, error: "Email service not configured" };
  }

  // simple retry/backoff
  const maxAttempts = 2;
  let attempt = 0;
  while (attempt < maxAttempts) {
    attempt += 1;
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to,
          subject: template.subject,
          html: template.html,
          text: template.plainText,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        console.error("Resend API error:", response.status, text);
        if (attempt >= maxAttempts) {
          return { success: false, error: `Email send failed: ${response.statusText}` };
        }
        // small backoff
        await new Promise((r) => setTimeout(r, 300 * attempt));
        continue;
      }

      const data = await response.json() as { id?: string };
      return { success: true, messageId: data.id };
    } catch (error) {
      console.error("Email service error (attempt", attempt, "):", error);
      if (attempt >= maxAttempts) {
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
      }
      await new Promise((r) => setTimeout(r, 300 * attempt));
    }
  }
  return { success: false, error: "Unknown error" };
}

/**
 * Send welcome/onboarding email
 */
export async function sendWelcomeEmail(
  email: string,
  fullName: string,
  appUrl: string = "https://finbank.eu",
): Promise<EmailSendResult> {
  const template = EmailTemplates.welcome({
    fullName,
    email,
    appUrl,
  });
  return sendEmail(email, template);
}

/**
 * Send transaction confirmation email
 */
export async function sendTransactionConfirmationEmail(
  email: string,
  recipientName: string,
  amount: string,
  currency: string,
  referenceNumber: string,
): Promise<EmailSendResult> {
  const date = new Date().toLocaleString();
  const template = EmailTemplates.transactionConfirmation({
    recipientName,
    amount,
    currency,
    date,
    referenceNumber,
  });
  return sendEmail(email, template);
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetLink: string,
  deviceInfo: string,
): Promise<EmailSendResult> {
  const expiresIn = "24 hours";
  const template = EmailTemplates.passwordReset({
    resetLink,
    expiresIn,
    deviceInfo,
  });
  return sendEmail(email, template);
}

/**
 * Send password reset completed email
 */
export async function sendPasswordResetCompletedEmail(
  email: string,
  deviceInfo: string,
  fundAccessDelay?: boolean,
): Promise<EmailSendResult> {
  const template = EmailTemplates.passwordResetCompleted({
    deviceInfo,
    fundAccessDelay,
  });
  return sendEmail(email, template);
}

/**
 * Send new login alert email
 */
export async function sendNewLoginAlertEmail(
  email: string,
  deviceInfo: string,
  location: string,
  timestamp: string,
  isUnknownDevice: boolean,
): Promise<EmailSendResult> {
  const template = EmailTemplates.newLoginAlert({
    deviceInfo,
    location,
    timestamp,
    isUnknownDevice,
  });
  return sendEmail(email, template);
}

/**
 * Send mobile deposit submitted email
 */
export async function sendMobileDepositSubmittedEmail(
  email: string,
  amount: string,
  currency: string,
  accountType: string,
  depositDate: string,
): Promise<EmailSendResult> {
  const template = EmailTemplates.mobileDepositSubmitted({
    amount,
    currency,
    accountType,
    depositDate,
  });
  return sendEmail(email, template);
}

/**
 * Send mobile deposit approved email
 */
export async function sendMobileDepositApprovedEmail(
  email: string,
  amount: string,
  currency: string,
  newBalance: string,
  approvedDate: string,
): Promise<EmailSendResult> {
  const template = EmailTemplates.mobileDepositApproved({
    amount,
    currency,
    newBalance,
    approvedDate,
  });
  return sendEmail(email, template);
}

/**
 * Send mobile deposit rejected email
 */
export async function sendMobileDepositRejectedEmail(
  email: string,
  amount: string,
  currency: string,
  rejectionReason: string,
  submittedDate: string,
): Promise<EmailSendResult> {
  const template = EmailTemplates.mobileDepositRejected({
    amount,
    currency,
    rejectionReason,
    submittedDate,
  });
  return sendEmail(email, template);
}
