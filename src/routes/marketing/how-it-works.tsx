import { createFileRoute } from "@tanstack/react-router";
import { HowItWorksPage } from "@/components/marketing/HowItWorksPage";

export const Route = createFileRoute("/marketing/how-it-works")({
  component: HowItWorksPage,
});
