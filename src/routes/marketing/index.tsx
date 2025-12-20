import { createFileRoute } from "@tanstack/react-router";
import { MarketingHomePage } from "@/components/marketing/MarketingHomePage";

export const Route = createFileRoute("/marketing/")({
  component: MarketingHomePage,
});
