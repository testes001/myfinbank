import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { loginUser, registerUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { toast } from "sonner";

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
  const { setCurrentUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

    setIsLoading(true);

    try {
      if (isLogin) {
        const authUser = await loginUser(email, password);
        setCurrentUser(authUser);
        toast.success("Welcome back!");
      } else {
        const authUser = await registerUser(email, password, fullName);
        setCurrentUser(authUser);
        toast.success("Account created successfully!");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

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
              />
              {passwordError && (
                <p className="text-xs text-red-300 mt-1" role="alert" aria-live="polite">
                  {passwordError}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
            >
              {isLoading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
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
