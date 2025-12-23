import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ShieldCheck, Users, Mail } from "lucide-react";

interface JointAccountInviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface StoredInvite {
  id: string;
  invitee: string;
  permissions: "view" | "full";
  dailyLimit: string;
  createdAt: string;
  status: "pending";
}

const STORAGE_KEY = "finbank_joint_invites";

export function JointAccountInviteModal({ open, onOpenChange }: JointAccountInviteModalProps) {
  const [email, setEmail] = useState("");
  const [permission, setPermission] = useState<"view" | "full">("view");
  const [dailyLimit, setDailyLimit] = useState("500");
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  const saveInvite = (invite: StoredInvite) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const existing: StoredInvite[] = stored ? JSON.parse(stored) : [];
      existing.push(invite);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
    } catch (err) {
      console.error("Failed to persist invite", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter an invitee email");
      return;
    }
    if (!agree) {
      toast.error("You must confirm both parties are EU/EEA residents");
      return;
    }
    setLoading(true);
    const invite: StoredInvite = {
      id: `invite_${Date.now()}`,
      invitee: email.trim().toLowerCase(),
      permissions: permission,
      dailyLimit,
      createdAt: new Date().toISOString(),
      status: "pending",
    };
    saveInvite(invite);
    toast.success("Invitation created. A confirmation email will be sent.");
    setLoading(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Invite to Joint Account
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">Invitee email</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="partner@example.eu"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Permissions</Label>
            <Select value={permission} onValueChange={(v) => setPermission(v as "view" | "full")}>
              <SelectTrigger>
                <SelectValue placeholder="Choose permissions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">View-only (no transfers)</SelectItem>
                <SelectItem value="full">Full access (spending/transfers)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="daily-limit">Daily spend/transfer limit (€)</Label>
            <Input
              id="daily-limit"
              type="number"
              min="0"
              step="50"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(e.target.value)}
            />
          </div>
          <div className="flex items-start gap-3">
            <Checkbox id="eu-check" checked={agree} onCheckedChange={(v) => setAgree(Boolean(v))} />
            <Label htmlFor="eu-check" className="text-sm leading-snug">
              I confirm both account holders are EU residents (ES/DE/FR/IT/PT) and will complete KYC before activation.
            </Label>
          </div>
          <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
            <div className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="w-4 h-4" />
              Security reminders
            </div>
            <ul className="list-disc ml-5 mt-2 space-y-1">
              <li>Invites expire in 48 hours if not accepted.</li>
              <li>New device logins may trigger 24h fund delays.</li>
              <li>Permissions can be changed or revoked anytime.</li>
            </ul>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            <Mail className="w-4 h-4 mr-2" />
            Send invitation
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
