import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { EnhancedLoginForm } from "@/components/EnhancedLoginForm";

export const Route = createFileRoute("/signup")({
  validateSearch: (search: Record<string, unknown>) => ({
    accountType: (search.accountType as "checking" | "joint" | "business_elite" | undefined) ?? undefined,
  }),
  component: SignUpRoute,
});

function SignUpRoute() {
  const navigate = useNavigate();
  const search = Route.useSearch() as { accountType?: "checking" | "joint" | "business_elite" };

  return (
    <EnhancedLoginForm
      mode="signup"
      defaultAccountType={search.accountType}
      onSwitchToSignIn={() => navigate({ to: "/login" })}
    />
  );
}
