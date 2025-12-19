/**
 * Email Trigger Hooks
 * Handles sending transactional emails at appropriate times
 */

import { useCallback } from "react";
import {
  sendWelcomeEmail,
  sendTransactionConfirmationEmail,
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
  const triggerWelcomeEmail = useCallback(
    async (email: string, fullName: string) => {
      try {
        await sendWelcomeEmail(email, fullName);
      } catch (error) {
        console.error("Failed to send welcome email:", error);
      }
    },
    [],
  );

  const triggerTransactionEmail = useCallback(
    async (
      email: string,
      recipientName: string,
      amount: string,
      currency: string,
      referenceNumber: string,
    ) => {
      try {
        await sendTransactionConfirmationEmail(
          email,
          recipientName,
          amount,
          currency,
          referenceNumber,
        );
      } catch (error) {
        console.error("Failed to send transaction email:", error);
      }
    },
    [],
  );

  const triggerPasswordResetCompletedEmail = useCallback(
    async (email: string, deviceInfo: string, fundAccessDelay?: boolean) => {
      try {
        await sendPasswordResetCompletedEmail(email, deviceInfo, fundAccessDelay);
      } catch (error) {
        console.error("Failed to send password reset completed email:", error);
      }
    },
    [],
  );

  const triggerNewLoginAlertEmail = useCallback(
    async (
      email: string,
      deviceInfo: string,
      loginLocation: string,
      timestamp: string,
      isUnknownDevice: boolean,
    ) => {
      try {
        await sendNewLoginAlertEmail(
          email,
          deviceInfo,
          loginLocation,
          timestamp,
          isUnknownDevice,
        );
      } catch (error) {
        console.error("Failed to send login alert email:", error);
      }
    },
    [],
  );

  const triggerMobileDepositSubmittedEmail = useCallback(
    async (email: string, depositAmount: string, currency: string) => {
      try {
        await sendMobileDepositSubmittedEmail(
          email,
          depositAmount,
          currency,
          new Date().toISOString(),
        );
      } catch (error) {
        console.error("Failed to send deposit submitted email:", error);
      }
    },
    [],
  );

  const triggerMobileDepositApprovedEmail = useCallback(
    async (email: string, depositAmount: string, currency: string) => {
      try {
        await sendMobileDepositApprovedEmail(
          email,
          depositAmount,
          currency,
          new Date().toISOString(),
        );
      } catch (error) {
        console.error("Failed to send deposit approved email:", error);
      }
    },
    [],
  );

  const triggerMobileDepositRejectedEmail = useCallback(
    async (
      email: string,
      depositAmount: string,
      currency: string,
      rejectionReason: string,
    ) => {
      try {
        await sendMobileDepositRejectedEmail(
          email,
          depositAmount,
          currency,
          rejectionReason,
          new Date().toISOString(),
        );
      } catch (error) {
        console.error("Failed to send deposit rejected email:", error);
      }
    },
    [],
  );

  return {
    triggerWelcomeEmail,
    triggerTransactionEmail,
    triggerPasswordResetCompletedEmail,
    triggerNewLoginAlertEmail,
    triggerMobileDepositSubmittedEmail,
    triggerMobileDepositApprovedEmail,
    triggerMobileDepositRejectedEmail,
  };
}
