import { useState } from "react";
import { Eye, EyeOff, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LoginFormFieldsProps {
  email: string;
  password: string;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  isLoading: boolean;
  error: string;
  rateLimitInfo: {
    allowed: boolean;
    remainingAttempts: number;
    message?: string;
  };
  onForgotPassword: () => void;
}

export function LoginFormFields({
  email,
  password,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  isLoading,
  error,
  rateLimitInfo,
  onForgotPassword,
}: LoginFormFieldsProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailTouched(true);
    setPasswordTouched(true);
    await onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {/* Email Field */}
      <div className="space-y-2">
        <Label htmlFor="login-email" className="text-white font-medium">
          Email Address
        </Label>
        <Input
          id="login-email"
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          onBlur={() => setEmailTouched(true)}
          placeholder="your.email@example.com"
          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          required
          disabled={isLoading}
          aria-describedby={emailTouched && !email ? "email-error" : undefined}
          aria-invalid={emailTouched && !email}
        />
        {emailTouched && !email && (
          <p id="email-error" className="text-xs text-red-300 mt-1" role="alert">
            Email is required
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <Label htmlFor="login-password" className="text-white font-medium">
          Password
        </Label>
        <div className="relative">
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            onBlur={() => setPasswordTouched(true)}
            placeholder="••••••••••••"
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            required
            disabled={isLoading}
            aria-describedby={passwordTouched && !password ? "password-error" : undefined}
            aria-invalid={passwordTouched && !password}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            tabIndex={0}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {passwordTouched && !password && (
          <p id="password-error" className="text-xs text-red-300 mt-1" role="alert">
            Password is required
          </p>
        )}
      </div>

      {/* Rate Limit Alert */}
      {!rateLimitInfo.allowed && (
        <Alert variant="destructive" role="alert">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>{rateLimitInfo.message}</AlertDescription>
        </Alert>
      )}

      {/* Login Error Alert */}
      {error && (
        <Alert variant="destructive" role="alert" aria-live="assertive">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Remaining Attempts Warning */}
      {rateLimitInfo.remainingAttempts <= 3 && rateLimitInfo.allowed && (
        <Alert
          className="bg-amber-500/10 border-amber-500/20"
          role="status"
          aria-live="polite"
        >
          <AlertTriangle className="h-4 w-4 text-amber-400" aria-hidden="true" />
          <AlertDescription className="text-amber-300">
            {rateLimitInfo.remainingAttempts} attempt
            {rateLimitInfo.remainingAttempts > 1 ? "s" : ""} remaining before lockout
          </AlertDescription>
        </Alert>
      )}

      {/* Sign In Button */}
      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-blue-950 focus:ring"
        disabled={isLoading || !rateLimitInfo.allowed}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Signing in...
          </>
        ) : (
          "Sign In"
        )}
      </Button>

      {/* Forgot Password Link */}
      <button
        type="button"
        onClick={onForgotPassword}
        className="w-full text-sm text-blue-200 hover:text-blue-100 underline transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1 focus:ring"
        disabled={isLoading}
      >
        Forgot your password?
      </button>
    </form>
  );
}
