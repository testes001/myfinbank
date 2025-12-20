import { createFileRoute } from "@tanstack/react-router";
import { PricingPage } from "@/components/marketing/PricingPage";

export const Route = createFileRoute("/marketing/pricing")({
  component: PricingPage,
});
