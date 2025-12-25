import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { loginUser, registerUser, markUserEmailVerified, type AuthUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";
import { validatePasswordStrength } from "@/lib/password-validation";
import { issueVerificationCode, verifyEmailCode } from "@/lib/email-verification";
import { getAuthThrottle, recordAuthAttempt, resetAuthThrottle } from "@/lib/rate-limit";

interface LoginFormProps {
  onShowLanding?: () => void;
}

export function LoginForm({ onShowLanding }: LoginFormProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [step, setStep] = useState<"auth" | "verify">("auth");
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingUser, setPendingUser] = useState<AuthUser | null>(null);
  const [attemptCount, setAttemptCount] = useState(() => getAuthThrottle().attempts);
  const [lockUntil, setLockUntil] = useState<number | null>(() => getAuthThrottle().lockUntil);
  const { setCurrentUser } = useAuth();

  const deliverVerificationCode = async (emailToSend: string, code: string) => {
    try {
      const response = await fetch("/api/auth/verification-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToSend, code }),
      });
      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }
      toast.success(`Verification code sent to ${emailToSend}`);
    } catch (err) {
      console.error("Verification email send failed:", err);
      toast.error("Failed to send verification email; showing code instead.");
      toast.info(`Code: ${code}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = Date.now();
    if (lockUntil && now < lockUntil) {
      const remaining = Math.ceil((lockUntil - now) / 1000);
      toast.error(`Too many attempts. Try again in ${remaining}s.`);
      return;
    }

    setEmailError(null);
    setPasswordError(null);

    // Basic client-side validation
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailValid) {
      setEmailError("Enter a valid email address");
      return;
    }

    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    if (!isLogin) {
      const strength = validatePasswordStrength(password);
      if (!strength.isValid) {
        setPasswordError("Please choose a stronger password to continue");
        return;
      }
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const authUser = await loginUser(email, password);
        setCurrentUser(authUser);
        toast.success("Welcome back!");
        resetAuthThrottle();
        setAttemptCount(0);
        setLockUntil(null);
      } else {
        const authUser = await registerUser(email, password, fullName);
        setPendingUser(authUser);
        setVerificationEmail(email);
        setStep("verify");
        toast.success("Account created! Enter the verification code we just sent.");
        void deliverVerificationCode(email, authUser.verificationCode);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "An error occurred";
      toast.error(message);
      const { attempts, lockUntil: nextLock } = recordAuthAttempt();
      setAttemptCount(attempts);
      setLockUntil(nextLock);

      if (message.toLowerCase().includes("not verified")) {
        setVerificationEmail(email);
        setStep("verify");
        const code = issueVerificationCode(email);
        void deliverVerificationCode(email, code);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationEmail) {
      toast.error("Missing email for verification");
      return;
    }

    if (!verifyEmailCode(verificationEmail, verificationCode)) {
      toast.error("Invalid or expired code. Please try again.");
      return;
    }

    markUserEmailVerified(verificationEmail);
    toast.success("Email verified! Signing you in.");

    if (pendingUser) {
      setCurrentUser(pendingUser);
    } else if (email && password) {
      try {
        const authUser = await loginUser(email, password);
        setCurrentUser(authUser);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Login failed after verification");
      }
    }

    setStep("auth");
    setVerificationCode("");
    setPendingUser(null);
  };

  const lockActive = lockUntil ? Date.now() < lockUntil : false;

  if (step === "verify") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-950 via-slate-900 to-purple-950 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl space-y-6">
            {onShowLanding && (
              <button
                onClick={onShowLanding}
                className="text-sm text-white/60 hover:text-white transition"
              >
                ← Back to home
              </button>
            )}
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-white">Verify your email</h2>
              <p className="text-white/60 text-sm">
                Enter the 6-digit code sent to <span className="font-semibold">{verificationEmail}</span>
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verificationCode" className="text-white/80">
                  Verification code
                </Label>
                <Input
                  id="verificationCode"
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  className="border-white/20 bg-white/10 text-white placeholder:text-white/40 tracking-[0.3em] text-center"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                >
                  Verify & Continue
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/30 text-white"
                  onClick={() => {
                    if (!verificationEmail) return;
                    const code = issueVerificationCode(verificationEmail);
                    void deliverVerificationCode(verificationEmail, code);
                  }}
                >
                  Resend
                </Button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-950 via-slate-900 to-purple-950 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          {onShowLanding && (
            <button
              onClick={onShowLanding}
              className="mb-4 text-sm text-white/60 hover:text-white transition"
            >
              ← Back to home
            </button>
          )}
          <div className="mb-8 text-center">
            <h1 className="mb-2 text-3xl font-bold text-white">FinBank</h1>
            <p className="text-white/60">Your modern banking solution</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" aria-label={isLogin ? "Sign in form" : "Sign up form"}>
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-white/80">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="border-white/20 bg-white/10 text-white placeholder:text-white/40"
                  placeholder="John Doe"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/80">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-white/20 bg-white/10 text-white placeholder:text-white/40"
                placeholder="you@example.com"
                disabled={lockActive}
              />
              {emailError && (
                <p className="text-xs text-red-300 mt-1" role="alert" aria-live="polite">
                  {emailError}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/80">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-white/20 bg-white/10 text-white placeholder:text-white/40"
                placeholder="••••••••"
                disabled={lockActive}
              />
              {passwordError && (
                <p className="text-xs text-red-300 mt-1" role="alert" aria-live="polite">
                  {passwordError}
                </p>
              )}
              {!isLogin && <PasswordStrengthIndicator password={password} />}
            </div>

            <Button
              type="submit"
              disabled={isLoading || lockActive}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              {lockActive
                ? "Temporarily locked"
                : isLoading
                  ? "Please wait..."
                  : isLogin
                    ? "Sign In"
                    : "Create Account"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-white/60 hover:text-white/80"
            >
              {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </button>
            {lockActive && (
              <p className="mt-2 text-xs text-red-200/80">
                Too many attempts. Please wait a few seconds before trying again.
              </p>
            )}
          </div>

          <div className="mt-8 rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
            <p className="mb-2 text-xs font-semibold text-blue-300">Demo Users Available:</p>
            <p className="text-xs text-blue-200/60">
              alice@demo.com, bob@demo.com, charlie@demo.com
              <br />
              Password: demo123
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
