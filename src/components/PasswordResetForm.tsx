import { useState } from "react";
import { AlertTriangle, Loader2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PasswordResetFormProps {
  email: string;
  onEmailChange: (email: string) => void;
  onSubmitRequest: (e: React.FormEvent) => Promise<void>;
  onSubmitConfirm: (e: React.FormEvent) => Promise<void>;
  onBack: () => void;
  resetCode: string;
  onResetCodeChange: (code: string) => void;
  newPassword: string;
  onNewPasswordChange: (password: string) => void;
  isLoading: boolean;
  error: string;
  resetRequested: boolean;
}

export function PasswordResetForm({
  email,
  onEmailChange,
  onSubmitRequest,
  onSubmitConfirm,
  onBack,
  resetCode,
  onResetCodeChange,
  newPassword,
  onNewPasswordChange,
  isLoading,
  error,
  resetRequested,
}: PasswordResetFormProps) {
  const [emailTouched, setEmailTouched] = useState(false);

  if (!resetRequested) {
    // Step 1: Request reset code
    return (
      <form onSubmit={onSubmitRequest} className="space-y-4" noValidate>
        <p className="text-xs text-white/70 mb-4">
          Request a reset code, then set a new password.
        </p>

        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="reset-email" className="text-white font-medium">
            Email Address
          </Label>
          <Input
            id="reset-email"
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            onBlur={() => setEmailTouched(true)}
            placeholder="your.email@example.com"
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            required
            disabled={isLoading}
            aria-label="Email address for password reset"
            aria-describedby={emailTouched && !email ? "reset-email-error" : undefined}
            aria-invalid={emailTouched && !email}
          />
          {emailTouched && !email && (
            <p id="reset-email-error" className="text-xs text-red-300 mt-1" role="alert">
              Email is required
            </p>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" role="alert" aria-live="assertive">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-blue-950"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
              Sending...
            </>
          ) : (
            "Send Reset Code"
          )}
        </Button>

        {/* Back Button */}
        <Button
          type="button"
          variant="ghost"
          className="w-full text-sm text-white/70 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          onClick={onBack}
          disabled={isLoading}
        >
          <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
          Back to sign in
        </Button>
      </form>
    );
  }

  // Step 2: Confirm reset with code and new password
  return (
    <form onSubmit={onSubmitConfirm} className="space-y-4" noValidate>
      <p className="text-xs text-white/70 mb-4">
        Enter the code we sent and your new password.
      </p>

      {/* Reset Code Field */}
      <div className="space-y-2">
        <Label htmlFor="reset-code" className="text-white font-medium">
          Verification Code
        </Label>
        <Input
          id="reset-code"
          type="text"
          value={resetCode}
          onChange={(e) => onResetCodeChange(e.target.value)}
          placeholder="000000"
          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          required
          disabled={isLoading}
          maxLength={10}
          aria-label="Verification code from email"
        />
      </div>

      {/* New Password Field */}
      <div className="space-y-2">
        <Label htmlFor="reset-password" className="text-white font-medium">
          New Password
        </Label>
        <Input
          id="reset-password"
          type="password"
          value={newPassword}
          onChange={(e) => onNewPasswordChange(e.target.value)}
          placeholder="••••••••••••"
          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          required
          disabled={isLoading}
          aria-label="New password"
        />
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" role="alert" aria-live="assertive">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full bg-green-600 hover:bg-green-700 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-blue-950"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Resetting...
          </>
        ) : (
          "Reset Password"
        )}
      </Button>

      {/* Back Button */}
      <Button
        type="button"
        variant="ghost"
        className="w-full text-sm text-white/70 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
        onClick={onBack}
        disabled={isLoading}
      >
        <ChevronLeft className="mr-1 h-4 w-4" aria-hidden="true" />
        Back to sign in
      </Button>
    </form>
  );
}
