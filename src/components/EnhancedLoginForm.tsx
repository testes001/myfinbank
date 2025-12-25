import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { loginUser, registerUser, markUserEmailVerified } from "@/lib/auth";
import { checkRateLimit, recordLoginAttempt, clearRateLimit } from "@/lib/rate-limiter";
import { validatePasswordStrength } from "@/lib/password-validation";
import { PasswordStrengthIndicator } from "@/components/PasswordStrengthIndicator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, EyeOff, AlertTriangle, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { getAuthThrottle, recordAuthAttempt, resetAuthThrottle } from "@/lib/rate-limit";

export function EnhancedLoginForm() {
  const { setCurrentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [rateLimitInfo, setRateLimitInfo] = useState<{ allowed: boolean; remainingAttempts: number; message?: string; resetTime?: number }>({ allowed: true, remainingAttempts: 5 });
  const [authThrottle, setAuthThrottle] = useState(() => getAuthThrottle());

  // Register state
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerFullName, setRegisterFullName] = useState("");
  const [registerError, setRegisterError] = useState("");

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

    // Validate password strength
    const passwordCheck = validatePasswordStrength(registerPassword);
    if (!passwordCheck.isValid) {
      setRegisterError("Password does not meet minimum requirements");
      return;
    }

    const now = Date.now();
    if (authThrottle.lockUntil && now < authThrottle.lockUntil) {
      setRegisterError("Too many attempts. Please wait a few seconds.");
      return;
    }

    setIsLoading(true);

    try {
      const authUser = await registerUser(registerEmail, registerPassword, registerFullName);
      // This enhanced form auto-verifies for demo purposes
      markUserEmailVerified(registerEmail);
      setCurrentUser(authUser);
      toast.success("Account created successfully!");
      resetAuthThrottle();
      setAuthThrottle(getAuthThrottle());
    } catch (error) {
      setRegisterError(error instanceof Error ? error.message : "Registration failed");
      const next = recordAuthAttempt();
      setAuthThrottle(next);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-purple-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="bg-white/10 backdrop-blur-xl border-white/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-white text-3xl">SecureBank</CardTitle>
            <CardDescription className="text-gray-300">
              Your trusted banking partner
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="register">Create Account</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
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

                <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg text-sm">
                  <p className="font-semibold text-white mb-2">Demo Accounts:</p>
                  <p className="text-xs text-gray-300">
                    alice@demo.com / password123<br />
                    bob@demo.com / password123
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="register">
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
                      <div className="mt-2">
                        <PasswordStrengthIndicator password={registerPassword} />
                      </div>
                    )}
                  </div>

                  {registerError && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{registerError}</AlertDescription>
                    </Alert>
                  )}

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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
