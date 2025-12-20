import { createFileRoute } from "@tanstack/react-router";
import { SecurityPage } from "@/components/marketing/SecurityPage";

export const Route = createFileRoute("/marketing/security")({
  component: SecurityPage,
});
