import type { ActivePage } from "@/components/BankingApp";
import { Home, History, Smartphone } from "lucide-react";
import { motion } from "framer-motion";

interface MobileNavProps {
  activePage: ActivePage;
  onNavigate: (page: ActivePage) => void;
  onMobileDeposit?: () => void;
}

export function MobileNav({ activePage, onNavigate, onMobileDeposit }: MobileNavProps) {
  const navItems = [
    { id: "dashboard" as ActivePage, icon: Home, label: "Home", action: "navigate" as const },
    { id: "deposit" as ActivePage, icon: Smartphone, label: "Deposit", action: "deposit" as const, highlight: true },
    { id: "history" as ActivePage, icon: History, label: "History", action: "navigate" as const },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-slate-900/95 backdrop-blur-xl"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-2xl items-center justify-around px-4 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;
          const isHighlight = "highlight" in item && item.highlight;

          const handleClick = () => {
            if (item.action === "deposit" && onMobileDeposit) {
              onMobileDeposit();
            } else if (item.action === "navigate") {
              onNavigate(item.id);
            }
          };

          return (
            <button
              key={item.id}
              onClick={handleClick}
              className={`relative flex flex-col items-center gap-1 px-6 py-2 ${
                isHighlight ? "-mt-4" : ""
              }`}
              aria-label={item.action === "deposit" ? "Mobile deposit" : `Navigate to ${item.label}`}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && !isHighlight && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  aria-hidden="true"
                />
              )}
              {isHighlight ? (
                <div className="flex flex-col items-center">
                  <div className="flex size-14 items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg shadow-blue-500/30">
                    <Icon className="size-6 text-white" aria-hidden="true" />
                  </div>
                  <span className="mt-1 text-xs font-medium text-blue-400">
                    {item.label}
                  </span>
                </div>
              ) : (
                <>
                  <Icon
                    className={`relative size-6 ${
                      isActive ? "text-blue-400" : "text-white/60"
                    }`}
                    aria-hidden="true"
                  />
                  <span
                    className={`relative text-xs ${
                      isActive ? "font-medium text-blue-400" : "text-white/60"
                    }`}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
