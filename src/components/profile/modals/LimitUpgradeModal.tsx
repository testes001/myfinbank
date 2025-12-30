import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowUpCircle, DollarSign, Info } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface LimitUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRequest: (limitType: string, amount: number) => Promise<void>;
}

export default function LimitUpgradeModal({ isOpen, onClose, onRequest }: LimitUpgradeModalProps) {
  const [selectedType, setSelectedType] = useState("daily_transfer");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const limitOptions = [
    { id: "daily_transfer", label: "Daily Transfer Limit", current: "$10,000", requested: "$25,000" },
    { id: "atm_withdrawal", label: "Daily ATM Withdrawal", current: "$1,000", requested: "$2,500" },
    { id: "mobile_deposit", label: "Mobile Deposit Limit", current: "$5,000", requested: "$10,000" },
    { id: "wire_transfer", label: "Wire Transfer Limit", current: "$50,000", requested: "$100,000" },
  ];

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const selected = limitOptions.find((opt) => opt.id === selectedType);
      await onRequest(selectedType, parseInt(selected?.requested.replace(/\D/g, "") || "0"));
      toast.success("Limit upgrade request submitted");
      onClose();
    } catch (error) {
      toast.error("Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-white/10 bg-gradient-to-br from-slate-900 via-amber-900/20 to-slate-900 backdrop-blur-xl sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/20">
              <ArrowUpCircle className="size-5 text-amber-400" />
            </div>
            Request Limit Upgrade
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Select which limit you'd like to increase
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <RadioGroup value={selectedType} onValueChange={setSelectedType}>
            {limitOptions.map((option) => (
              <div key={option.id} className={`flex items-start gap-4 rounded-lg border p-4 ${selectedType === option.id ? "border-amber-500/50 bg-amber-500/10" : "border-white/10 bg-white/5"}`}>
                <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor={option.id} className="text-base font-medium text-white cursor-pointer">{option.label}</Label>
                  <div className="mt-2 flex items-center gap-2 text-sm text-white/60">
                    <span>Current: {option.current}</span>
                    <span>→</span>
                    <span className="text-amber-400">Requested: {option.requested}</span>
                  </div>
                </div>
              </div>
            ))}
          </RadioGroup>
          <Alert className="bg-blue-500/10 border-blue-500/20">
            <Info className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-200 text-sm">
              Limit upgrade requests are typically reviewed within 1-3 business days. We may require additional documentation.
            </AlertDescription>
          </Alert>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="border-white/20 bg-white/10 text-white hover:bg-white/20">Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-amber-500 hover:bg-amber-600 text-white">{isSubmitting ? "Submitting..." : "Submit Request"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
