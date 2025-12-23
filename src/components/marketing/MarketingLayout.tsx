import type { ReactNode } from "react";
import { MarketingNavigation } from "./MarketingNavigation";
import { MarketingFooter } from "./MarketingFooter";

interface MarketingLayoutProps {
  children: ReactNode;
}

export function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950">
      <MarketingNavigation />
      <main className="flex-1">
        {children}
      </main>
      <MarketingFooter />
    </div>
  );
}
