import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Send, DollarSign, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface WireTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInitiate: (data: any) => Promise<void>;
}

export default function WireTransferModal({ isOpen, onClose, onInitiate }: WireTransferModalProps) {
  const [type, setType] = useState<"domestic" | "international">("domestic");
  const [formData, setFormData] = useState({ recipient: "", amount: "", bankName: "", routingNumber: "", accountNumber: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fee = type === "domestic" ? 25 : 45;

  const handleSubmit = async () => {
    if (!formData.recipient || !formData.amount || !formData.bankName || !formData.accountNumber) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsSubmitting(true);
    try {
      await onInitiate({ ...formData, type, fee });
      toast.success("Wire transfer initiated");
      onClose();
    } catch (error) {
      toast.error("Failed to initiate wire transfer");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-white/10 bg-gradient-to-br from-slate-900 via-indigo-900/20 to-slate-900 backdrop-blur-xl sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <div className="flex size-10 items-center justify-center rounded-full bg-indigo-500/20">
              <Send className="size-5 text-indigo-400" />
            </div>
            Initiate Wire Transfer
          </DialogTitle>
          <DialogDescription className="text-white/60">Send funds via domestic or international wire transfer</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <RadioGroup value={type} onValueChange={(v) => setType(v as "domestic" | "international")}>
            <div className={`flex items-start gap-4 rounded-lg border p-4 ${type === "domestic" ? "border-indigo-500/50 bg-indigo-500/10" : "border-white/10 bg-white/5"}`}>
              <RadioGroupItem value="domestic" id="domestic" />
              <div className="flex-1"><Label htmlFor="domestic" className="text-base font-medium text-white cursor-pointer">Domestic ($25 fee)</Label><p className="text-sm text-white/60">Within the United States</p></div>
            </div>
            <div className={`flex items-start gap-4 rounded-lg border p-4 ${type === "international" ? "border-indigo-500/50 bg-indigo-500/10" : "border-white/10 bg-white/5"}`}>
              <RadioGroupItem value="international" id="international" />
              <div className="flex-1"><Label htmlFor="international" className="text-base font-medium text-white cursor-pointer">International ($45 fee)</Label><p className="text-sm text-white/60">To any country worldwide</p></div>
            </div>
          </RadioGroup>
          <div className="space-y-2">
            <Label className="text-white/80">Recipient Name *</Label>
            <Input placeholder="John Doe" value={formData.recipient} onChange={(e) => setFormData({ ...formData, recipient: e.target.value })} className="border-white/10 bg-white/5 text-white placeholder:text-white/40" />
          </div>
          <div className="space-y-2">
            <Label className="text-white/80">Amount *</Label>
            <div className="relative"><DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40" /><Input type="number" placeholder="1000.00" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="border-white/10 bg-white/5 text-white placeholder:text-white/40 pl-9" /></div>
          </div>
          <div className="space-y-2">
            <Label className="text-white/80">Recipient Bank Name *</Label>
            <Input placeholder="Bank Name" value={formData.bankName} onChange={(e) => setFormData({ ...formData, bankName: e.target.value })} className="border-white/10 bg-white/5 text-white placeholder:text-white/40" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {type === "domestic" && (<div className="space-y-2"><Label className="text-white/80">Routing Number</Label><Input placeholder="123456789" value={formData.routingNumber} onChange={(e) => setFormData({ ...formData, routingNumber: e.target.value })} className="border-white/10 bg-white/5 text-white placeholder:text-white/40 font-mono" /></div>)}
            <div className="space-y-2 col-span-2"><Label className="text-white/80">Account Number *</Label><Input placeholder="Account number" value={formData.accountNumber} onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })} className="border-white/10 bg-white/5 text-white placeholder:text-white/40 font-mono" /></div>
          </div>
          <Alert className="bg-amber-500/10 border-amber-500/20">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <AlertDescription className="text-amber-200 text-sm">
              Fee: ${fee}. Processing time: 1-3 business days. Wire transfers cannot be canceled once initiated.
            </AlertDescription>
          </Alert>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="border-white/20 bg-white/10 text-white hover:bg-white/20">Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-indigo-500 hover:bg-indigo-600 text-white"><Send className="mr-2 size-4" />{isSubmitting ? "Initiating..." : "Initiate Transfer"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
