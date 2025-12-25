import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSessionSecurity } from "@/hooks/useSessionSecurity";
import { AuthenticationGateway } from "@/components/AuthenticationGateway";
import { Dashboard } from "@/components/Dashboard";
import { TransactionHistory } from "@/components/TransactionHistory";
import { ProfilePage } from "@/components/ProfilePage";
import { MobileNav } from "@/components/MobileNav";
import { MobileDepositModal } from "@/components/MobileDepositModal";
import { OnboardingFlow, type OnboardingData } from "@/components/OnboardingFlow";
import { motion, AnimatePresence } from "framer-motion";
import { uploadDocument } from "@/lib/kyc-storage";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { useEffect, useRef, useState as useReactState } from "react";
import { submitKyc, uploadKycDocument, uploadKycFile } from "@/lib/backend";

export type ActivePage = "dashboard" | "transfer" | "history" | "profile" | "deposit";

export function BankingApp() {
  const { currentUser, isLoading, userStatus, refreshUserStatus } = useAuth();
  const [activePage, setActivePage] = useState<ActivePage>("dashboard");
  const [isMobileDepositOpen, setIsMobileDepositOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [scrollPositions, setScrollPositions] = useReactState<Record<ActivePage, number>>({
    dashboard: 0,
    transfer: 0,
    history: 0,
    profile: 0,
    deposit: 0,
  });

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
    return <AuthenticationGateway />;
  }

  // Handle onboarding flow
  const handleOnboardingComplete = async (data: OnboardingData) => {
    try {
      if (!currentUser?.accessToken) {
        throw new Error("Missing session token; please sign in again.");
      }

      // Upload documents (simulated)
      let idFrontUrl: string | undefined;
      let idBackUrl: string | undefined;

      if (data.idDocumentFront) {
        idFrontUrl = await uploadKycFile(data.idDocumentFront, currentUser.accessToken);
      }

      if (data.idDocumentBack) {
        idBackUrl = await uploadKycFile(data.idDocumentBack, currentUser.accessToken);
      }

      const phoneDigits = data.phoneNumber.replace(/\D/g, "");
      if (phoneDigits.length < 10) {
        throw new Error("Please provide a valid phone number for KYC.");
      }
      const normalizedPhone = `+${phoneDigits}`;

      const ssnDigits = data.ssn.replace(/\D/g, "");
      if (ssnDigits.length !== 9) {
        throw new Error("National ID / SSN must be 9 digits for verification.");
      }
      const normalizedSsn = `${ssnDigits.slice(0, 3)}-${ssnDigits.slice(3, 5)}-${ssnDigits.slice(5)}`;

      const normalizedZip = (data.zipCode.match(/\d/g) || []).join("").padEnd(5, "0").slice(0, 5);
      const normalizedState = (data.state || "NA").slice(0, 2).toUpperCase();
      const normalizedCountry = (data.country || "US").slice(0, 2).toUpperCase();

      await submitKyc(
        {
          dateOfBirth: data.dateOfBirth,
          ssn: normalizedSsn,
          phoneNumber: normalizedPhone,
          idDocumentType: data.idDocumentType?.toLowerCase().includes("pass") ? "PASSPORT" : "NATIONAL_ID",
          address: {
            street: data.streetAddress || "Not Provided",
            city: data.city || "Not Provided",
            state: normalizedState,
            zipCode: normalizedZip,
            country: normalizedCountry,
          },
        },
        currentUser.accessToken
      );

      if (idFrontUrl) {
        await uploadKycDocument("ID_FRONT", idFrontUrl, currentUser.accessToken);
      }
      if (idBackUrl) {
        await uploadKycDocument("ID_BACK", idBackUrl, currentUser.accessToken);
      }

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
                    void refreshUserStatus();
                    toast.info("We requested a fresh KYC status check.");
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Refresh Status
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

  // Preserve scroll position per tab to keep mobile navigation smooth
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setScrollPositions((prev) => ({
        ...prev,
        [activePage]: container.scrollTop,
      }));
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [activePage]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const nextTop = scrollPositions[activePage] ?? 0;
    container.scrollTo({ top: nextTop, behavior: "auto" });
  }, [activePage, scrollPositions]);

  // Show main banking app for active users
  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-blue-950 via-slate-900 to-purple-950 dark:from-blue-950 dark:via-slate-900 dark:to-purple-950 light:from-blue-50 light:via-slate-50 light:to-purple-50">
      <div className="flex-1 overflow-y-auto pb-20" ref={scrollContainerRef}>
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
