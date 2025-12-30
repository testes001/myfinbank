import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plane, CheckCircle2, Info } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface TravelNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: { destination: string; startDate: string; endDate: string }) => Promise<void>;
}

export default function TravelNotificationModal({ isOpen, onClose, onAdd }: TravelNotificationModalProps) {
  const [formData, setFormData] = useState({ destination: "", startDate: "", endDate: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.destination || !formData.startDate || !formData.endDate) {
      toast.error("Please fill in all fields");
      return;
    }
    setIsSubmitting(true);
    try {
      await onAdd(formData);
      toast.success("Travel notification added");
      onClose();
    } catch (error) {
      toast.error("Failed to add travel notification");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-white/10 bg-gradient-to-br from-slate-900 via-cyan-900/20 to-slate-900 backdrop-blur-xl sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <div className="flex size-10 items-center justify-center rounded-full bg-cyan-500/20">
              <Plane className="size-5 text-cyan-400" />
            </div>
            Add Travel Notification
          </DialogTitle>
          <DialogDescription className="text-white/60">Let us know where you're traveling to prevent card declines</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="destination" className="text-white/80">Destination *</Label>
            <Input id="destination" placeholder="e.g., Paris, France" value={formData.destination} onChange={(e) => setFormData({ ...formData, destination: e.target.value })} className="border-white/10 bg-white/5 text-white placeholder:text-white/40" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-white/80">Start Date *</Label>
              <Input id="startDate" type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="border-white/10 bg-white/5 text-white" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-white/80">End Date *</Label>
              <Input id="endDate" type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="border-white/10 bg-white/5 text-white" />
            </div>
          </div>
          <Alert className="bg-blue-500/10 border-blue-500/20">
            <Info className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-200 text-sm">
              Adding a travel notification helps prevent your card from being declined while you're away.
            </AlertDescription>
          </Alert>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="border-white/20 bg-white/10 text-white hover:bg-white/20">Cancel</Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-cyan-500 hover:bg-cyan-600 text-white"><CheckCircle2 className="mr-2 size-4" />{isSubmitting ? "Adding..." : "Add Notification"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
