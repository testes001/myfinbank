import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSessionSecurity } from "@/hooks/useSessionSecurity";
import { LoginForm } from "@/components/LoginForm";
import { Dashboard } from "@/components/Dashboard";
import { TransactionHistory } from "@/components/TransactionHistory";
import { ProfilePage } from "@/components/ProfilePage";
import { MobileNav } from "@/components/MobileNav";
import { MobileDepositModal } from "@/components/MobileDepositModal";
import { OnboardingFlow, type OnboardingData } from "@/components/OnboardingFlow";
import { motion, AnimatePresence } from "framer-motion";
import { saveKYCData, uploadDocument, hashSecurityAnswer } from "@/lib/kyc-storage";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Clock, CheckCircle2, AlertCircle } from "lucide-react";

export type ActivePage = "dashboard" | "transfer" | "history" | "profile" | "deposit";

export function BankingApp() {
  const { currentUser, isLoading, userStatus, refreshUserStatus } = useAuth();
  const [activePage, setActivePage] = useState<ActivePage>("dashboard");
  const [isMobileDepositOpen, setIsMobileDepositOpen] = useState(false);

  // Initialize session security (auto-logout after 15 minutes of inactivity)
  useSessionSecurity({
    inactivityTimeout: 15 * 60 * 1000, // 15 minutes
    enableIpMonitoring: true,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-950 via-slate-900 to-purple-950 dark:from-blue-950 dark:via-slate-900 dark:to-purple-950 light:from-blue-50 light:via-slate-50 light:to-purple-50">
        <div className="text-white dark:text-white light:text-gray-900">Loading...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginForm />;
  }

  // Handle onboarding flow
  const handleOnboardingComplete = async (data: OnboardingData) => {
    try {
      // Upload documents (simulated)
      let idFrontUrl: string | undefined;
      let idBackUrl: string | undefined;

      if (data.idDocumentFront) {
        idFrontUrl = await uploadDocument(data.idDocumentFront);
      }

      if (data.idDocumentBack) {
        idBackUrl = await uploadDocument(data.idDocumentBack);
      }

      // Hash security answers
      const securityQuestions = [
        {
          question: data.securityQuestion1,
          answer: hashSecurityAnswer(data.securityAnswer1),
        },
        {
          question: data.securityQuestion2,
          answer: hashSecurityAnswer(data.securityAnswer2),
        },
        {
          question: data.securityQuestion3,
          answer: hashSecurityAnswer(data.securityAnswer3),
        },
      ];

      // Save KYC data
      saveKYCData(currentUser.user.id, {
        userId: currentUser.user.id,
        primaryAccountType: data.primaryAccountType,
        dateOfBirth: data.dateOfBirth,
        ssn: data.ssn,
        phoneNumber: data.phoneNumber,
        phoneVerified: data.phoneVerified,
        emailVerified: data.emailVerified,
        streetAddress: data.streetAddress,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country,
        residencyYears: data.residencyYears,
        securityQuestions,
        idDocumentType: data.idDocumentType,
        idDocumentFrontUrl: idFrontUrl,
        idDocumentBackUrl: idBackUrl,
        livenessCheckComplete: data.livenessCheckComplete,
        livenessCheckTimestamp: new Date().toISOString(),
        accountTypes: data.accountTypes,
        initialDepositMethod: data.initialDepositMethod,
        initialDepositAmount: data.initialDepositAmount,
        externalBankName: data.externalBankName,
        externalAccountNumber: data.externalAccountNumber,
        externalRoutingNumber: data.externalRoutingNumber,
        kycStatus: "pending",
        kycSubmittedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Refresh user status
      refreshUserStatus();

      toast.success("Application submitted successfully!");
    } catch (error) {
      console.error("Onboarding error:", error);
      toast.error("Failed to submit application. Please try again.");
      throw error;
    }
  };

  // Show onboarding flow for new users
  if (userStatus === "onboarding") {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  // Show pending KYC review screen
  if (userStatus === "pending_kyc") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-purple-950 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full"
        >
          <Card className="bg-white/10 backdrop-blur-xl border-white/20">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-8 h-8 text-amber-400" />
              </div>
              <CardTitle className="text-white text-3xl">Application Under Review</CardTitle>
              <CardDescription className="text-gray-300 text-lg">
                Thank you for submitting your account application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6">
                <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-400" />
                  What happens next?
                </h3>
                <ul className="space-y-2 text-gray-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Our compliance team is reviewing your documents</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Identity verification is being processed</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>You'll receive an email when your account is approved</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <h3 className="text-white font-semibold mb-2">Estimated Review Time</h3>
                <p className="text-gray-300">1-2 business days</p>
                <p className="text-sm text-gray-400 mt-2">
                  Most applications are reviewed within 24 hours. You may be contacted if additional information is required.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    // Simulate approval for demo purposes
                    saveKYCData(currentUser.user.id, { kycStatus: "approved" });
                    refreshUserStatus();
                    toast.success("Account approved! Welcome to SecureBank!");
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Approve (Demo)
                </Button>
                <Button
                  onClick={() => {
                    refreshUserStatus();
                  }}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  <Loader2 className="w-4 h-4 mr-2" />
                  Refresh Status
                </Button>
              </div>

              <p className="text-center text-sm text-gray-400">
                Need help? Contact us at support@finbank.eu or call +34 900 123 456
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Show main banking app for active users
  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-blue-950 via-slate-900 to-purple-950 dark:from-blue-950 dark:via-slate-900 dark:to-purple-950 light:from-blue-50 light:via-slate-50 light:to-purple-50">
      <div className="flex-1 overflow-y-auto pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={activePage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activePage === "dashboard" && <Dashboard onNavigate={setActivePage} />}
            {activePage === "history" && <TransactionHistory />}
            {activePage === "profile" && <ProfilePage />}
          </motion.div>
        </AnimatePresence>
      </div>
      <MobileNav
        activePage={activePage}
        onNavigate={setActivePage}
        onMobileDeposit={() => setIsMobileDepositOpen(true)}
      />

      {/* Global Mobile Deposit Modal accessible from bottom nav */}
      <MobileDepositModal
        open={isMobileDepositOpen}
        onOpenChange={setIsMobileDepositOpen}
        onSuccess={() => {
          setIsMobileDepositOpen(false);
          // Navigate to dashboard to see the updated balance
          setActivePage("dashboard");
        }}
      />
    </div>
  );
}
