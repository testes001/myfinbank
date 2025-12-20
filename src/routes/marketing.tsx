import { Outlet, createFileRoute } from "@tanstack/react-router";
import { MarketingLayout } from "@/components/marketing/MarketingLayout";

export const Route = createFileRoute("/marketing")({
  component: MarketingLayoutComponent,
});

function MarketingLayoutComponent() {
  return (
    <MarketingLayout>
      <Outlet />
    </MarketingLayout>
  );
}
