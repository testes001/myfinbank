import { createFileRoute } from "@tanstack/react-router";
import { FeaturesPage } from "@/components/marketing/FeaturesPage";

export const Route = createFileRoute("/marketing/features")({
  component: FeaturesPage,
});
