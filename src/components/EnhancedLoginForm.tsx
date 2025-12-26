import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { loginUser, registerUser, markUserEmailVerified, requestPasswordReset, confirmPasswordReset } from "@/lib/auth";
import { checkRateLimit, recordLoginAttempt, clearRateLimit } from "@/lib/rate-limiter";
import { validatePasswordStrength } from "@/lib/password-validation";
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, EyeOff, AlertTriangle, Shield, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { getAuthThrottle, recordAuthAttempt, resetAuthThrottle } from "@/lib/rate-limit";
import { submitKyc, type KycSubmissionRequest } from "@/lib/backend";
import { useNavigate } from "@tanstack/react-router";

interface EnhancedLoginFormProps {
  mode?: "login" | "signup";
  defaultAccountType?: "checking" | "joint" | "business_elite";
  onSwitchToSignIn?: () => void;
}

export function EnhancedLoginForm({ mode, defaultAccountType, onSwitchToSignIn }: EnhancedLoginFormProps) {
  const { setCurrentUser, currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"login" | "register">(mode === "signup" ? "register" : "login");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [rateLimitInfo, setRateLimitInfo] = useState<{ allowed: boolean; remainingAttempts: number; message?: string; resetTime?: number }>({ allowed: true, remainingAttempts: 5 });
  const [authThrottle, setAuthThrottle] = useState(() => getAuthThrottle());
  const [isResetting, setIsResetting] = useState(false);
  const [resetRequested, setResetRequested] = useState(false);
  const [resetCode, setResetCode] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");

  // Register state
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerFullName, setRegisterFullName] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerTermsAccepted, setRegisterTermsAccepted] = useState(false);
  const [registerMarketingConsent, setRegisterMarketingConsent] = useState(false);
  const [registerAccountType, setRegisterAccountType] = useState<"checking" | "joint" | "business_elite">(defaultAccountType || "checking");
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [kycSubmitted, setKycSubmitted] = useState(false);

  const [kycForm, setKycForm] = useState({
    phone: "",
    dateOfBirth: "",
    ssn: "",
    street: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
    idDocumentType: "DRIVERS_LICENSE" as KycSubmissionRequest["idDocumentType"],
  });

  const disposableDomains = ["mailinator.com", "tempmail.com", "guerrillamail.com", "10minutemail.com", "yopmail.com"];

  const passwordRules = [
    { key: "minLength", label: "At least 12 characters" },
    { key: "upper", label: "One uppercase letter" },
    { key: "lower", label: "One lowercase letter" },
    { key: "number", label: "One number" },
    { key: "symbol", label: "One symbol (!@#$%…)" },
    { key: "notCommon", label: "Not a common/breached password" },
    { key: "notPersonal", label: "Not derived from email or name" },
  ] as const;

  const evaluatePasswordPolicy = (password: string) => {
    const emailLocal = registerEmail.split("@")[0] || "";
    const nameTokens = registerFullName.toLowerCase().split(/\s+/).filter(Boolean);
    const lowerPass = password.toLowerCase();
    const common = ["password", "password123", "12345678", "letmein", "welcome", "qwerty", "finbank"];

    const minLength = password.length >= 12;
    const upper = /[A-Z]/.test(password);
    const lower = /[a-z]/.test(password);
    const number = /\d/.test(password);
    const symbol = /[^A-Za-z0-9]/.test(password);
    const notCommon = !common.some((c) => lowerPass.includes(c));
    const notPersonal = !lowerPass.includes(emailLocal.toLowerCase()) && !nameTokens.some((t) => t && lowerPass.includes(t));

    return { minLength, upper, lower, number, symbol, notCommon, notPersonal };
  };

  const passwordPolicy = evaluatePasswordPolicy(registerPassword);
  const passwordPolicyPassed = Object.values(passwordPolicy).every(Boolean);

  useEffect(() => {
    if (currentUser) {
      navigate({ to: "/dashboard", replace: true });
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    if (mode === "signup") {
      setActiveTab("register");
    } else if (mode === "login") {
      setActiveTab("login");
    }
  }, [mode]);

  const handleRequestPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    if (!loginEmail) {
      setLoginError("Enter your email to reset password");
      return;
    }
    setIsResetting(true);
    try {
      await requestPasswordReset(loginEmail);
      setResetRequested(true);
      toast.success("Reset code sent to your email");
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Failed to request password reset");
    } finally {
      setIsResetting(false);
    }
  };

  const handleConfirmPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    if (!resetCode || !resetNewPassword) {
      setLoginError("Enter the code and new password");
      return;
    }
    setIsResetting(true);
    try {
      await confirmPasswordReset(loginEmail, resetCode, resetNewPassword);
      toast.success("Password updated. Please sign in.");
      setResetRequested(false);
      setResetCode("");
      setResetNewPassword("");
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setIsResetting(false);
    }
  };

  const validateKyc = () => {
    const phoneDigits = kycForm.phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      return "Enter a valid phone number";
    }
    if (!kycForm.dateOfBirth) {
      return "Date of birth is required";
    }
    const ssnDigits = kycForm.ssn.replace(/\D/g, "");
    if (ssnDigits.length !== 9) {
      return "SSN/National ID must be 9 digits";
    }
    if (!kycForm.street || !kycForm.city || !kycForm.state || !kycForm.zip) {
      return "Complete your address";
    }
    return null;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    const now = Date.now();
    if (authThrottle.lockUntil && now < authThrottle.lockUntil) {
      setLoginError(`Too many attempts. Try again in ${Math.ceil((authThrottle.lockUntil - now) / 1000)}s.`);
      return;
    }

    // Check rate limiting
    const limitCheck = checkRateLimit(loginEmail);
    setRateLimitInfo(limitCheck);

    if (!limitCheck.allowed) {
      setLoginError(limitCheck.message || "Too many failed attempts");
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
      setAuthThrottle(getAuthThrottle());
      navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      recordLoginAttempt(loginEmail, false);
      const limitCheckAfter = checkRateLimit(loginEmail);
      setRateLimitInfo(limitCheckAfter);

      if (limitCheckAfter.remainingAttempts <= 3 && limitCheckAfter.remainingAttempts > 0) {
        setLoginError(
          `Invalid email or password. ${limitCheckAfter.remainingAttempts} attempt${limitCheckAfter.remainingAttempts > 1 ? "s" : ""} remaining.`
        );
      } else {
        setLoginError(error instanceof Error ? error.message : "Login failed");
      }
      const next = recordAuthAttempt();
      setAuthThrottle(next);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError("");

    const passwordCheck = validatePasswordStrength(registerPassword);
    if (!passwordCheck.isValid || !passwordPolicyPassed) {
      setRegisterError("Password does not meet minimum requirements");
      return;
    }

    if (!registerTermsAccepted) {
      setRegisterError("Please accept the Terms and Privacy Policy to continue.");
      return;
    }

    const emailDomain = registerEmail.split("@")[1]?.toLowerCase() || "";
    if (disposableDomains.includes(emailDomain)) {
      setRegisterError("Disposable email domains are not allowed. Please use a permanent email.");
      return;
    }

    const kycError = validateKyc();
    if (kycError) {
      setRegisterError(kycError);
      return;
    }

    const now = Date.now();
    if (authThrottle.lockUntil && now < authThrottle.lockUntil) {
      setRegisterError("Too many attempts. Please wait a few seconds.");
      return;
    }

    setIsLoading(true);
    setKycSubmitting(false);
    setKycSubmitted(false);

    try {
      const authUser = await registerUser(registerEmail, registerPassword, registerFullName, registerAccountType);
      // This enhanced form auto-verifies for demo purposes
      markUserEmailVerified(registerEmail);
      setCurrentUser(authUser);
      toast.success("Account created successfully!");
      resetAuthThrottle();
      setAuthThrottle(getAuthThrottle());
      if (registerMarketingConsent) {
        localStorage.setItem("marketing_consent", "true");
      } else {
        localStorage.removeItem("marketing_consent");
      }

      if (authUser.accessToken) {
        setKycSubmitting(true);
        try {
          const phoneDigits = kycForm.phone.replace(/\D/g, "");
          const ssnDigits = kycForm.ssn.replace(/\D/g, "");
          const normalizedZip = (kycForm.zip.match(/\d/g) || []).join("").padEnd(5, "0").slice(0, 5);
          const normalizedState = kycForm.state.slice(0, 2).toUpperCase();
          const normalizedCountry = kycForm.country.slice(0, 2).toUpperCase();

          await submitKyc(
            {
              dateOfBirth: kycForm.dateOfBirth,
              ssn: `${ssnDigits.slice(0, 3)}-${ssnDigits.slice(3, 5)}-${ssnDigits.slice(5)}`,
              phoneNumber: `+${phoneDigits}`,
              idDocumentType: kycForm.idDocumentType,
              address: {
                street: kycForm.street,
                city: kycForm.city,
                state: normalizedState,
                zipCode: normalizedZip,
                country: normalizedCountry,
              },
            },
            authUser.accessToken
          );
          setKycSubmitted(true);
          toast.success("KYC submitted for review");
        } catch (kycErr) {
          console.error("KYC submission failed", kycErr);
          toast.error("Account created but KYC submission failed. Please retry in profile.");
        }
      }
      navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      setRegisterError(error instanceof Error ? error.message : "Registration failed");
      const next = recordAuthAttempt();
      setAuthThrottle(next);
    } finally {
      setIsLoading(false);
      setKycSubmitting(false);
    }
  };

  const showTabs = !mode;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-purple-950 flex items-center justify-center p-4 text-white overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.18),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(124,58,237,0.14),transparent_25%),radial-gradient(circle_at_60%_80%,rgba(16,185,129,0.18),transparent_25%)]" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-lg"
      >
        <Card className="bg-white/10 backdrop-blur-2xl border-white/15 shadow-2xl shadow-blue-900/30">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto mb-2 w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-white text-3xl">Fin-Bank Access</CardTitle>
            <CardDescription className="text-white/70">
              Secure banking for modern Europe
            </CardDescription>
            {mode === "signup" && (
              <p className="text-xs text-white/60">
                Already have an account?{" "}
                <button
                  type="button"
                  className="text-blue-200 hover:text-white underline"
                  onClick={() => (onSwitchToSignIn ? onSwitchToSignIn() : navigate({ to: "/login" }))}
                >
                  Sign in
                </button>
              </p>
            )}
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

            {(activeTab === "login") && (
              <div className="space-y-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-white">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-white">Password</Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 pr-10"
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {!rateLimitInfo.allowed && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{rateLimitInfo.message}</AlertDescription>
                    </Alert>
                  )}

                  {loginError && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{loginError}</AlertDescription>
                    </Alert>
                  )}

                  {rateLimitInfo.remainingAttempts <= 3 && rateLimitInfo.allowed && (
                    <Alert className="bg-amber-500/10 border-amber-500/20">
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                      <AlertDescription className="text-amber-300">
                        {rateLimitInfo.remainingAttempts} attempt{rateLimitInfo.remainingAttempts > 1 ? "s" : ""} remaining before lockout
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    disabled={isLoading || !rateLimitInfo.allowed}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>

                <div className="space-y-4">
                  <div className="p-4 bg-white/5 border border-white/10 rounded-lg text-sm space-y-2">
                    <p className="font-semibold text-white mb-1">Demo Accounts:</p>
                    <p className="text-xs text-gray-300">
                      alice@demo.com / password123<br />
                      bob@demo.com / password123
                    </p>
                  </div>

                  <div className="p-4 bg-white/5 border border-white/10 rounded-lg text-sm space-y-3">
                    <p className="font-semibold text-white">Forgot password?</p>
                    <p className="text-xs text-white/70">Request a reset code, then set a new password.</p>
                    {!resetRequested ? (
                      <form onSubmit={handleRequestPasswordReset} className="space-y-2">
                        <Input
                          type="email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="Enter your email"
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                          required
                          disabled={isResetting}
                        />
                        <Button type="submit" size="sm" className="w-full bg-white/10 border border-white/20 text-white" disabled={isResetting}>
                          {isResetting ? "Sending..." : "Send reset code"}
                        </Button>
                      </form>
                    ) : (
                      <form onSubmit={handleConfirmPasswordReset} className="space-y-2">
                        <Input
                          type="text"
                          value={resetCode}
                          onChange={(e) => setResetCode(e.target.value)}
                          placeholder="Enter code"
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                          required
                          disabled={isResetting}
                        />
                        <Input
                          type="password"
                          value={resetNewPassword}
                          onChange={(e) => setResetNewPassword(e.target.value)}
                          placeholder="New password"
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                          required
                          disabled={isResetting}
                        />
                        <div className="flex gap-2">
                          <Button type="submit" size="sm" className="flex-1 bg-white/10 border border-white/20 text-white" disabled={isResetting}>
                            {isResetting ? "Resetting..." : "Update password"}
                          </Button>
                          <Button type="button" size="sm" variant="ghost" className="text-white/70 hover:text-white" onClick={() => setResetRequested(false)} disabled={isResetting}>
                            Back
                          </Button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>
            )}

            {(activeTab === "register") && (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name" className="text-white">Full Name</Label>
                    <Input
                      id="register-name"
                      type="text"
                      value={registerFullName}
                      onChange={(e) => setRegisterFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-white">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      required
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password" className="text-white">Password</Label>
                    <div className="relative">
                      <Input
                        id="register-password"
                        type={showPassword ? "text" : "password"}
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        placeholder="Create a strong password"
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 pr-10"
                        required
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {registerPassword && (
                      <div className="mt-2 space-y-2">
                        <PasswordStrengthIndicator password={registerPassword} />
                        <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-xs text-white/80 space-y-1">
                          {passwordRules.map((rule) => {
                            const passed = passwordPolicy[rule.key];
                            return (
                              <div key={rule.key} className="flex items-center gap-2">
                                {passed ? (
                                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-400" />
                                )}
                                <span>{rule.label}</span>
                              </div>
                            );
                          })}
                        </div>
                    </div>
                  )}
                </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-white text-sm">Account Type</Label>
                      <Select
                        value={registerAccountType}
                        onValueChange={(val: "checking" | "joint" | "business_elite") => setRegisterAccountType(val)}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Choose account type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="checking">Personal Checking</SelectItem>
                          <SelectItem value="joint">Joint Account</SelectItem>
                          <SelectItem value="business_elite">Business Elite</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-[11px] text-white/60">
                        Tailor limits and features to your use case; you can add more accounts later.
                      </p>
                    </div>
                    <div />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="register-phone" className="text-white text-sm">Mobile Number</Label>
                      <Input
                        id="register-phone"
                        type="tel"
                        value={kycForm.phone}
                        onChange={(e) => setKycForm((prev) => ({ ...prev, phone: e.target.value }))}
                        placeholder="+1 (555) 123-4567"
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-dob" className="text-white text-sm">Date of Birth</Label>
                      <Input
                        id="register-dob"
                        type="date"
                        value={kycForm.dateOfBirth}
                        onChange={(e) => setKycForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="register-ssn" className="text-white text-sm">SSN / National ID</Label>
                      <Input
                        id="register-ssn"
                        type="text"
                        value={kycForm.ssn}
                        onChange={(e) => setKycForm((prev) => ({ ...prev, ssn: e.target.value }))}
                        placeholder="123-45-6789"
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-white text-sm">ID Document Type</Label>
                      <Select
                        value={kycForm.idDocumentType}
                        onValueChange={(val: KycSubmissionRequest["idDocumentType"]) =>
                          setKycForm((prev) => ({ ...prev, idDocumentType: val }))
                        }
                        disabled={isLoading}
                      >
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Select ID type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DRIVERS_LICENSE">Driver's License</SelectItem>
                          <SelectItem value="PASSPORT">Passport</SelectItem>
                          <SelectItem value="NATIONAL_ID">National ID</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white text-sm">Residential Address</Label>
                    <Input
                      type="text"
                      value={kycForm.street}
                      onChange={(e) => setKycForm((prev) => ({ ...prev, street: e.target.value }))}
                      placeholder="Street address"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      required
                      disabled={isLoading}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input
                        type="text"
                        value={kycForm.city}
                        onChange={(e) => setKycForm((prev) => ({ ...prev, city: e.target.value }))}
                        placeholder="City"
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                        required
                        disabled={isLoading}
                      />
                      <Input
                        type="text"
                        value={kycForm.state}
                        onChange={(e) => setKycForm((prev) => ({ ...prev, state: e.target.value }))}
                        placeholder="State"
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                        required
                        maxLength={2}
                        disabled={isLoading}
                      />
                      <Input
                        type="text"
                        value={kycForm.zip}
                        onChange={(e) => setKycForm((prev) => ({ ...prev, zip: e.target.value }))}
                        placeholder="ZIP"
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                        required
                        disabled={isLoading}
                      />
                    </div>
                    <Input
                      type="text"
                      value={kycForm.country}
                      onChange={(e) => setKycForm((prev) => ({ ...prev, country: e.target.value }))}
                      placeholder="Country"
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      required
                      disabled={isLoading}
                    />
                    <p className="text-[11px] text-white/60">
                      We collect KYC details to comply with AML/CTF requirements and protect your account.
                    </p>
                  </div>

                  {registerError && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{registerError}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-start space-x-2 rounded-md border border-white/10 bg-white/5 p-3">
                      <Checkbox
                        id="terms"
                        checked={registerTermsAccepted}
                        onCheckedChange={(val) => setRegisterTermsAccepted(Boolean(val))}
                        className="border-white/40 data-[state=checked]:bg-blue-600"
                      />
                      <Label htmlFor="terms" className="text-xs text-white/80 leading-snug">
                        I agree to the <a className="text-blue-300 underline" href="/legal/terms">Terms of Service</a> and{" "}
                        <a className="text-blue-300 underline" href="/legal/privacy">Privacy Policy</a>.
                      </Label>
                    </div>

                    <div className="flex items-start space-x-2 rounded-md border border-white/10 bg-white/5 p-3">
                      <Checkbox
                        id="marketing"
                        checked={registerMarketingConsent}
                        onCheckedChange={(val) => setRegisterMarketingConsent(Boolean(val))}
                        className="border-white/40 data-[state=checked]:bg-blue-600"
                      />
                      <Label htmlFor="marketing" className="text-xs text-white/80 leading-snug">
                        I agree to receive product updates and onboarding tips (optional).
                      </Label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-white/70">
                    <span>Identity verification auto-starts after signup.</span>
                    {kycSubmitted ? (
                      <span className="text-emerald-300 flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" /> KYC submitted
                      </span>
                    ) : kycSubmitting ? (
                      <span className="flex items-center gap-1">
                        <Loader2 className="h-4 w-4 animate-spin" /> Submitting KYC...
                      </span>
                    ) : null}
                  </div>

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                </form>
            )}

            {mode === "login" && (
              <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg text-sm space-y-3">
                <div>
                  <p className="font-semibold text-white mb-1">Demo Accounts:</p>
                  <p className="text-xs text-gray-300">
                    alice@demo.com / password123<br />
                    bob@demo.com / password123
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toast.info("Reset password is handled via email in production.")}
                  className="text-xs text-blue-200 hover:text-white underline"
                >
                  Forgot password?
                </button>
                {onSwitchToSignIn && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("login")}
                    className="text-xs text-white/70 hover:text-white underline"
                  >
                    Switch to sign in
                  </button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
