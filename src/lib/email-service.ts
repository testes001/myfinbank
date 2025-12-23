/**
 * Fin-Bank Email Service Integration
 * Sends transactional emails via SendGrid (preferred) or Mailgun with Resend fallback
 */

import type { EmailTemplate } from "./email-templates";
import { EmailTemplates } from "./email-templates";

const SENDGRID_API_KEY =
  import.meta.env?.VITE_SENDGRID_API_KEY || import.meta.env?.SENDGRID_API_KEY || "";
const MAILGUN_API_KEY =
  import.meta.env?.VITE_MAILGUN_API_KEY || import.meta.env?.MAILGUN_API_KEY || "";
const MAILGUN_DOMAIN =
  import.meta.env?.VITE_MAILGUN_DOMAIN || import.meta.env?.MAILGUN_DOMAIN || "";
const RESEND_API_KEY = import.meta.env?.VITE_RESEND_API_KEY || import.meta.env?.RESEND_API_KEY || "";

const FROM_EMAIL =
  import.meta.env?.VITE_EMAIL_FROM || import.meta.env?.EMAIL_FROM || "alerts@finbank.eu";
const FROM_NAME = import.meta.env?.VITE_EMAIL_FROM_NAME || import.meta.env?.EMAIL_FROM_NAME || "Fin-Bank";

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send email via available provider (SendGrid → Mailgun → Resend)
 */
export async function sendEmail(
  to: string,
  template: EmailTemplate,
): Promise<EmailSendResult> {
  if (SENDGRID_API_KEY) {
    const sgResult = await sendWithSendGrid(to, template);
    if (sgResult.success || !MAILGUN_API_KEY) return sgResult;
  }

  if (MAILGUN_API_KEY) {
    const mgResult = await sendWithMailgun(to, template);
    if (mgResult.success) return mgResult;
  }

  if (!RESEND_API_KEY) {
    console.error("No email provider configured (SENDGRID_API_KEY / MAILGUN_API_KEY / RESEND_API_KEY)");
    return { success: false, error: "Email service not configured" };
  }

  return sendWithResend(to, template);
}

async function sendWithSendGrid(to: string, template: EmailTemplate): Promise<EmailSendResult> {
  try {
    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: FROM_EMAIL, name: FROM_NAME },
        subject: template.subject,
        content: [
          { type: "text/plain", value: template.plainText },
          { type: "text/html", value: template.html },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("SendGrid API error:", response.status, text);
      return { success: false, error: `SendGrid error: ${response.statusText}` };
    }

    return { success: true };
  } catch (error) {
    console.error("SendGrid send error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

async function sendWithMailgun(to: string, template: EmailTemplate): Promise<EmailSendResult> {
  if (!MAILGUN_DOMAIN) {
    console.error("MAILGUN_DOMAIN missing");
    return { success: false, error: "Mailgun domain missing" };
  }

  try {
    const auth = `api:${MAILGUN_API_KEY}`;
    const form = new URLSearchParams();
    form.append("from", `${FROM_NAME} <${FROM_EMAIL}>`);
    form.append("to", to);
    form.append("subject", template.subject);
    form.append("text", template.plainText);
    form.append("html", template.html);

    const response = await fetch(`https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(auth)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Mailgun API error:", response.status, text);
      return { success: false, error: `Mailgun error: ${response.statusText}` };
    }

    return { success: true };
  } catch (error) {
    console.error("Mailgun send error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

async function sendWithResend(to: string, template: EmailTemplate): Promise<EmailSendResult> {
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
  appUrl: string = "https://finbank.online",
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
