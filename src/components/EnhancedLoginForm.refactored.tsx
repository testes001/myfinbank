/**
 * This is a preview of how EnhancedLoginForm should be refactored to use
 * the new accessible form components. The actual refactoring should be
 * done in phases:
 * 
 * Phase A: Replace login section with LoginFormFields
 * Phase B: Replace password reset with PasswordResetForm
 * Phase C: Extract signup/KYC into separate components
 * Phase D: Final cleanup and testing
 */

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { loginUser, registerUser, requestPasswordReset, confirmPasswordReset } from "@/lib/auth";
import { checkRateLimit, recordLoginAttempt, clearRateLimit } from "@/lib/rate-limiter";
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";
import { LoginFormFields } from "@/components/LoginFormFields";
import { PasswordResetForm } from "@/components/PasswordResetForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { getAuthThrottle, recordAuthAttempt, resetAuthThrottle } from "@/lib/rate-limit";
import { submitKyc, type KycSubmissionRequest } from "@/lib/backend";
import { useNavigate, Link } from "@tanstack/react-router";
import { OnboardingBreadcrumb } from "@/components/OnboardingBreadcrumb";

interface EnhancedLoginFormProps {
  mode?: "login" | "signup";
  defaultAccountType?: "checking" | "joint" | "business_elite";
  onSwitchToSignIn?: () => void;
}

export function EnhancedLoginForm({ mode, defaultAccountType, onSwitchToSignIn }: EnhancedLoginFormProps) {
  const { setCurrentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"login" | "register">(mode === "signup" ? "register" : "login");
  const [isLoading, setIsLoading] = useState(false);

  // LOGIN STATE
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    allowed: boolean;
    remainingAttempts: number;
    message?: string;
  }>({ allowed: true, remainingAttempts: 5 });
  const [authThrottle, setAuthThrottle] = useState(() => getAuthThrottle());
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetRequested, setResetRequested] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");

  // REGISTER STATE
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerFullName, setRegisterFullName] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerTermsAccepted, setRegisterTermsAccepted] = useState(false);

  // LOGIN HANDLERS
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!loginEmail || !loginPassword) {
      setLoginError("Email and password are required");
      return;
    }

    setIsLoading(true);

    try {
      const authUser = await loginUser(loginEmail, loginPassword);
      recordLoginAttempt(loginEmail, true);
      clearRateLimit(loginEmail);
      setCurrentUser(authUser);
      toast.success("Welcome back!");
      resetAuthThrottle();
      navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      recordLoginAttempt(loginEmail, false);
      const limitCheckAfter = checkRateLimit(loginEmail);
      setRateLimitInfo(limitCheckAfter);

      // Generic error message - never reveal account existence
      setLoginError("Email or password is incorrect");
      const next = recordAuthAttempt();
      setAuthThrottle(next);
    } finally {
      setIsLoading(false);
    }
  };

  // PASSWORD RESET HANDLERS
  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    if (!loginEmail) {
      setLoginError("Enter your email to reset password");
      return;
    }
    setIsResettingPassword(true);
    try {
      await requestPasswordReset(loginEmail);
      setResetRequested(true);
      // Generic success message - doesn't reveal if email exists
      toast.success("Check your email for reset instructions");
    } catch (err) {
      // Don't reveal if email exists or not
      setLoginError("");
      toast.success("Check your email for reset instructions");
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleConfirmPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    if (!resetCode || !resetNewPassword) {
      setLoginError("Enter the code and new password");
      return;
    }
    setIsResettingPassword(true);
    try {
      await confirmPasswordReset(loginEmail, resetCode, resetNewPassword);
      toast.success("Password updated. Please sign in.");
      setResetRequested(false);
      setResetCode("");
      setResetNewPassword("");
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setIsResettingPassword(false);
    }
  };

  const showTabs = !mode;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-purple-950 flex items-center justify-center p-4 text-white overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.18),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(124,58,237,0.14),transparent_25%),radial-gradient(circle_at_60%_80%,rgba(16,185,129,0.18),transparent_25%)]" />

      {mode === "signup" && (
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
          <Link
            to="/account-type"
            className="flex items-center gap-1 text-white/70 hover:text-white transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Link>
          <OnboardingBreadcrumb currentStep="signup" />
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-lg"
      >
        <Card className="bg-white/10 backdrop-blur-2xl border-white/15 shadow-2xl shadow-blue-900/30">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto mb-2 w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Shield className="w-8 h-8 text-white" aria-hidden="true" />
            </div>
            <CardTitle className="text-white text-3xl">Fin-Bank Access</CardTitle>
            <CardDescription className="text-white/70">
              Secure banking for modern Europe
            </CardDescription>
          </CardHeader>

          <CardContent>
            {showTabs && (
              <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="register">Create Account</TabsTrigger>
                </TabsList>
              </Tabs>
            )}

            {/* LOGIN TAB - USING NEW ACCESSIBLE COMPONENT */}
            {activeTab === "login" && !isResettingPassword && (
              <LoginFormFields
                email={loginEmail}
                password={loginPassword}
                onEmailChange={setLoginEmail}
                onPasswordChange={setLoginPassword}
                onSubmit={handleLogin}
                isLoading={isLoading}
                error={loginError}
                rateLimitInfo={rateLimitInfo}
                onForgotPassword={() => setIsResettingPassword(true)}
              />
            )}

            {/* PASSWORD RESET - USING NEW ACCESSIBLE COMPONENT */}
            {activeTab === "login" && isResettingPassword && (
              <PasswordResetForm
                email={loginEmail}
                onEmailChange={setLoginEmail}
                onSubmitRequest={handleRequestPasswordReset}
                onSubmitConfirm={handleConfirmPasswordReset}
                onBack={() => {
                  setIsResettingPassword(false);
                  setResetRequested(false);
                  setResetCode("");
                  setResetNewPassword("");
                  setLoginError("");
                }}
                resetCode={resetCode}
                onResetCodeChange={setResetCode}
                newPassword={resetNewPassword}
                onNewPasswordChange={setResetNewPassword}
                isLoading={isLoading}
                error={loginError}
                resetRequested={resetRequested}
              />
            )}

            {/* SIGNUP TAB - SIMPLIFIED VIEW (Details in separate component) */}
            {activeTab === "register" && (
              <div className="text-center space-y-4">
                <p className="text-white/70">
                  Signup form would be refactored into a separate component
                </p>
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => navigate({ to: "/signup" })}
                >
                  Go to Full Signup
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
