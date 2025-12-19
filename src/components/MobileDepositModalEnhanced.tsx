import React from "react";
import { MobileDepositModalNew } from "@/components/MobileDepositModalNew";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function MobileDepositModalEnhanced({ open, onOpenChange, onSuccess }: Props) {
  return (
    <>
      <Card className="mb-4">
        <div className="flex items-start gap-3 p-3">
          <AlertCircle className="w-5 h-5 text-yellow-400" />
          <div>
            <div className="font-semibold">Currency Notice</div>
            <div className="text-sm text-muted-foreground">We accept USD and EUR only. Deposits in other currencies will be rejected.</div>
          </div>
        </div>
      </Card>

      <MobileDepositModalNew open={open} onOpenChange={onOpenChange} onSuccess={onSuccess} />
    </>
  );
}

export default MobileDepositModalEnhanced;
