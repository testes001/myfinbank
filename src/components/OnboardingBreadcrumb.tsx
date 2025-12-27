import { ChevronRight } from "lucide-react";
import { Link } from "@tanstack/react-router";

type Step = "marketing" | "account-type" | "signup";

interface OnboardingBreadcrumbProps {
  currentStep: Step;
}

const steps: Record<Step, { label: string; path: string }> = {
  marketing: { label: "Marketing", path: "/marketing" },
  "account-type": { label: "Account Type", path: "/account-type" },
  signup: { label: "Sign Up", path: "/signup" },
};

export function OnboardingBreadcrumb({ currentStep }: OnboardingBreadcrumbProps) {
  const breadcrumbSteps: Step[] = ["marketing", "account-type", "signup"];
  const currentStepIndex = breadcrumbSteps.indexOf(currentStep);

  return (
    <div className="flex items-center gap-2 text-sm text-white/70">
      {breadcrumbSteps.map((step, index) => {
        const isCurrentStep = step === currentStep;
        const isFutureStep = index > currentStepIndex;
        const stepConfig = steps[step];

        return (
          <div key={step} className="flex items-center gap-2">
            {isCurrentStep ? (
              <span className="text-white font-medium">{stepConfig.label}</span>
            ) : isFutureStep ? (
              <span className="text-white/40">{stepConfig.label}</span>
            ) : (
              <Link
                to={stepConfig.path}
                className="text-emerald-300 hover:text-emerald-200 transition-colors"
              >
                {stepConfig.label}
              </Link>
            )}

            {index < breadcrumbSteps.length - 1 && (
              <ChevronRight className="w-4 h-4 text-white/40" />
            )}
          </div>
        );
      })}
    </div>
  );
}
