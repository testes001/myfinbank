import { createFileRoute } from "@tanstack/react-router";
import { BankingApp } from "@/components/BankingApp";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  return <BankingApp />;
}
