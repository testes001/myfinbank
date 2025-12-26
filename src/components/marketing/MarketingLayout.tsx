import type { ReactNode } from "react";
import { MarketingNavigation } from "./MarketingNavigation";
import { MarketingFooter } from "./MarketingFooter";

interface MarketingLayoutProps {
  children: ReactNode;
}

export function MarketingLayout({ children }: MarketingLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-950 via-slate-900 to-purple-950 text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.15),transparent_25%),radial-gradient(circle_at_80%_10%,rgba(124,58,237,0.12),transparent_25%),radial-gradient(circle_at_40%_80%,rgba(16,185,129,0.15),transparent_25%)]" />
      <MarketingNavigation />
      <main className="flex-1 relative z-10">
        {children}
      </main>
      <MarketingFooter />
    </div>
  );
}
