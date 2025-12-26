import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AccountTypeSelector } from "@/components/AccountTypeSelector";

export const Route = createFileRoute("/account-type")({
  component: AccountTypeRoute,
});

function AccountTypeRoute() {
  const navigate = useNavigate();

  return (
    <AccountTypeSelector
      onSelect={(type) => navigate({ to: "/signup", search: { accountType: type } })}
      onSignIn={() => navigate({ to: "/login" })}
    />
  );
}
