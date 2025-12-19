import { useCallback } from "react";
import {
  sendWelcomeEmail,
  sendTransactionConfirmationEmail,
  sendPasswordResetEmail,
  sendPasswordResetCompletedEmail,
  sendNewLoginAlertEmail,
  sendMobileDepositSubmittedEmail,
  sendMobileDepositApprovedEmail,
  sendMobileDepositRejectedEmail,
} from "@/lib/email-service";

/**
 * Hook for managing email triggers throughout the app
 */
export function useEmailTriggers() {
  const triggerWelcomeEmail = useCallback(async (email: string, fullName: string) => {
    void sendWelcomeEmail(email, fullName).catch((e) => console.error("Welcome email failed:", e));
  }, []);

  const triggerTransactionEmail = useCallback(
    async (email: string, recipientName: string, amount: string, currency: string, referenceNumber: string) => {
      void sendTransactionConfirmationEmail(email, recipientName, amount, currency, referenceNumber).catch((e) =>
        console.error("Transaction email failed:", e),
      );
    },
    [],
  );

  const triggerNewLoginAlertEmail = useCallback(
    async (email: string, deviceInfo: string, loginLocation: string, timestamp: string, isUnknownDevice: boolean) => {
      void sendNewLoginAlertEmail(email, deviceInfo, loginLocation, timestamp, isUnknownDevice).catch((e) =>
        console.error("New login alert email failed:", e),
      );
    },
    [],
  );

  const triggerMobileDepositSubmittedEmail = useCallback(
    async (email: string, amount: string, currency: string, accountType?: string, depositDate?: string) => {
      void sendMobileDepositSubmittedEmail(email, amount, currency, accountType || "Checking", depositDate || new Date().toLocaleString()).catch((e) =>
        console.error("Mobile deposit submitted email failed:", e),
      );
    },
    [],
  );

  const triggerMobileDepositApprovedEmail = useCallback(
    async (email: string, amount: string, currency: string, newBalance: string, approvedDate?: string) => {
      void sendMobileDepositApprovedEmail(email, amount, currency, newBalance, approvedDate || new Date().toLocaleString()).catch((e) =>
        console.error("Mobile deposit approved email failed:", e),
      );
    },
    [],
  );

  const triggerMobileDepositRejectedEmail = useCallback(
    async (email: string, amount: string, currency: string, rejectionReason: string, submittedDate?: string) => {
      void sendMobileDepositRejectedEmail(email, amount, currency, rejectionReason, submittedDate || new Date().toLocaleString()).catch((e) =>
        console.error("Mobile deposit rejected email failed:", e),
      );
    },
    [],
  );

  const triggerPasswordResetEmail = useCallback(async (email: string, resetLink: string, deviceInfo: string) => {
    void sendPasswordResetEmail(email, resetLink, deviceInfo).catch((e) => console.error("Password reset email failed:", e));
  }, []);

  const triggerPasswordResetCompletedEmail = useCallback(async (email: string, deviceInfo: string, fundAccessDelay?: boolean) => {
    void sendPasswordResetCompletedEmail(email, deviceInfo, fundAccessDelay).catch((e) =>
      console.error("Password reset completed email failed:", e),
    );
  }, []);

  return {
    triggerWelcomeEmail,
    triggerTransactionEmail,
    triggerNewLoginAlertEmail,
    triggerMobileDepositSubmittedEmail,
    triggerMobileDepositApprovedEmail,
    triggerMobileDepositRejectedEmail,
    triggerPasswordResetEmail,
    triggerPasswordResetCompletedEmail,
  } as const;
}

export default useEmailTriggers;
