import { createFileRoute } from "@tanstack/react-router";
import { AboutPage } from "@/components/marketing/AboutPage";

export const Route = createFileRoute("/marketing/about")({
  component: AboutPage,
});
