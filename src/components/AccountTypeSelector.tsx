import { useState, type ReactNode } from "react";
import { Shield, Users, Briefcase, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type AccountType = "checking" | "joint" | "business_elite";

interface AccountTypeSelectorProps {
  onSelect: (type: AccountType) => void;
  onSignIn?: () => void;
}

const accountTypes: {
  type: AccountType;
  title: string;
  description: string;
  perks: string[];
  icon: ReactNode;
}[] = [
  {
    type: "checking",
    title: "Personal Checking",
    description: "Fast everyday banking with SEPA, cards, and savings tools.",
    perks: ["SEPA transfers", "Virtual + physical cards", "Spending insights"],
    icon: <Shield className="w-5 h-5 text-white" />,
  },
  {
    type: "joint",
    title: "Joint Account",
    description: "Shared budgeting, dual controls, and transparency for households.",
    perks: ["Shared controls", "Split payments", "Joint notifications"],
    icon: <Users className="w-5 h-5 text-white" />,
  },
  {
    type: "business_elite",
    title: "Business Elite",
    description: "Higher limits, team cards, and approvals built for growing teams.",
    perks: ["Higher limits", "Team cards & controls", "Export & approvals"],
    icon: <Briefcase className="w-5 h-5 text-white" />,
  },
];

export function AccountTypeSelector({ onSelect, onSignIn }: AccountTypeSelectorProps) {
  const [selected, setSelected] = useState<AccountType>("checking");

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-purple-950 text-white flex items-center justify-center p-6 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.18),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(124,58,237,0.14),transparent_25%),radial-gradient(circle_at_60%_80%,rgba(16,185,129,0.18),transparent_25%)]" />
      <div className="relative z-10 w-full max-w-5xl space-y-8">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 bg-white/10 text-xs font-semibold">
            <Shield className="w-4 h-4 text-emerald-300" />
            Fin-Bank onboarding
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold">Choose your account type</h1>
          <p className="text-white/70 max-w-2xl mx-auto">
            Tailor limits, controls, and perks to how you bank. You can add more account types later.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {accountTypes.map((option) => {
            const isActive = selected === option.type;
            return (
              <Card
                key={option.type}
                className={`cursor-pointer border ${isActive ? "border-emerald-300/70" : "border-white/10"} bg-white/10 backdrop-blur-xl shadow-lg shadow-blue-900/25 transition transform ${isActive ? "scale-[1.02]" : "hover:scale-[1.01]"}`}
                onClick={() => setSelected(option.type)}
              >
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-emerald-500 flex items-center justify-center shadow-md shadow-blue-500/30">
                      {option.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{option.title}</p>
                      <p className="text-xs text-white/60">{option.description}</p>
                    </div>
                  </div>
                  {isActive && <CheckCircle2 className="w-5 h-5 text-emerald-300" />}
                </div>
                <div className="px-4 pb-4 space-y-2">
                  {option.perks.map((perk) => (
                    <div key={perk} className="flex items-center gap-2 text-sm text-white/70">
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      {perk}
                    </div>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <Button
            variant="ghost"
            className="text-white/80 hover:text-white"
            onClick={() => onSignIn?.()}
          >
            Already have an account? Sign in
          </Button>
          <Button
            className="bg-gradient-to-r from-blue-500 via-purple-500 to-emerald-500 hover:from-blue-600 hover:via-purple-600 hover:to-emerald-600 text-white px-6"
            onClick={() => onSelect(selected)}
          >
            Continue <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}
