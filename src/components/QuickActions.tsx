import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "cmdk";
import {
  ArrowRightLeft,
  Wallet,
  CreditCard,
  ShieldCheck,
  UserPlus,
  LifeBuoy,
  Sparkles,
  Target,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

interface QuickActionsProps {
  onAction?: (action: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const actions = [
  { id: "transfer", label: "New transfer", icon: ArrowRightLeft, hint: "Send between accounts" },
  { id: "p2p", label: "Send to contact", icon: Wallet, hint: "P2P instant send" },
  { id: "freeze-card", label: "Freeze card", icon: CreditCard, hint: "Temporarily lock" },
  { id: "bill-pay", label: "Schedule bill pay", icon: Target, hint: "Plan recurring" },
  { id: "add-beneficiary", label: "Add beneficiary", icon: UserPlus, hint: "Trusted payees" },
  { id: "security", label: "Security center", icon: Shield, hint: "MFA & devices" },
  { id: "support", label: "Concierge support", icon: LifeBuoy, hint: "Priority chat" },
];

export function QuickActions({ onAction, open, onOpenChange }: QuickActionsProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const actualOpen = open ?? isOpen;
  const setOpen = onOpenChange ?? setIsOpen;

  const handleSelect = (action: string) => {
    setOpen(false);
    toast.success("Action queued", { description: action.replace("-", " ") });
    onAction?.(action);
  };

  return (
    <Dialog open={actualOpen} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-white/20 text-white/80 hover:bg-white/10"
          aria-label="Open quick actions"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Quick Actions
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg border-white/10 bg-slate-950/90 text-white shadow-2xl backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-white">Command Palette</DialogTitle>
          <DialogDescription className="text-white/60">
            Jump to common actions and concierge features
          </DialogDescription>
        </DialogHeader>
        <Command
          label="Quick actions"
          className="rounded-xl border border-white/10 bg-white/5 text-white shadow-inner"
        >
          <CommandInput
            placeholder="Type an action or feature"
            value={query}
            onValueChange={setQuery}
            className="border-b border-white/10 bg-transparent text-white"
          />
          <CommandList>
            <CommandEmpty className="p-4 text-sm text-white/60">No actions found</CommandEmpty>
            <CommandGroup heading="Actions" className="text-white/70">
              {actions
                .filter((a) => a.label.toLowerCase().includes(query.toLowerCase()))
                .map((action) => {
                  const Icon = action.icon;
                  return (
                    <CommandItem
                      key={action.id}
                      value={action.id}
                      onSelect={handleSelect}
                      className="flex items-center justify-between gap-3 text-white"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4 text-emerald-400" aria-hidden />
                        <div className="flex flex-col text-left">
                          <span className="font-medium">{action.label}</span>
                          <span className="text-xs text-white/60">{action.hint}</span>
                        </div>
                      </div>
                    </CommandItem>
                  );
                })}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
