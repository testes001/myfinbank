import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Edit, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface AccountNicknameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentNickname: string;
  onSave: (nickname: string) => Promise<void>;
}

export default function AccountNicknameModal({ isOpen, onClose, currentNickname, onSave }: AccountNicknameModalProps) {
  const [nickname, setNickname] = useState(currentNickname);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!nickname.trim()) {
      toast.error("Nickname cannot be empty");
      return;
    }
    setIsSaving(true);
    try {
      await onSave(nickname);
      toast.success("Account nickname updated");
      onClose();
    } catch (error) {
      toast.error("Failed to update nickname");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-white/10 bg-gradient-to-br from-slate-900 via-blue-900/20 to-slate-900 backdrop-blur-xl sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <div className="flex size-10 items-center justify-center rounded-full bg-blue-500/20">
              <Edit className="size-5 text-blue-400" />
            </div>
            Edit Account Nickname
          </DialogTitle>
          <DialogDescription className="text-white/60">Choose a memorable name for your account</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="nickname" className="text-white/80">Account Nickname</Label>
            <Input id="nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} maxLength={50} placeholder="e.g., Primary Checking, Savings Goal" className="border-white/10 bg-white/5 text-white placeholder:text-white/40" />
            <p className="text-xs text-white/60">{nickname.length}/50 characters</p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="border-white/20 bg-white/10 text-white hover:bg-white/20">Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving || nickname === currentNickname} className="bg-blue-500 hover:bg-blue-600 text-white disabled:opacity-50"><CheckCircle2 className="mr-2 size-4" />Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
