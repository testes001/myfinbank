import { Progress } from "@/components/ui/progress";
import { validatePasswordStrength, getPasswordStrengthColor, getPasswordStrengthBgColor } from "@/lib/password-validation";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
  showFeedback?: boolean;
}

export function PasswordStrengthIndicator({ password, showFeedback = true }: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  const strength = validatePasswordStrength(password);

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Password Strength:</span>
          <span className={cn("font-semibold capitalize", getPasswordStrengthColor(strength.level))}>
            {strength.level.replace("_", " ")}
          </span>
        </div>
        <div className="relative">
          <Progress value={strength.score} className="h-2" />
          <div className={cn("absolute inset-0 h-2 rounded-full transition-all", getPasswordStrengthBgColor(strength.level))} style={{ width: `${strength.score}%` }} />
        </div>
      </div>

      {showFeedback && strength.feedback.length > 0 && (
        <div className="space-y-1">
          {strength.feedback.map((feedback, index) => (
            <div key={index} className="flex items-start gap-2 text-xs text-muted-foreground">
              {strength.isValid ? (
                <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-3 w-3 mt-0.5 text-amber-600 flex-shrink-0" />
              )}
              <span>{feedback}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
