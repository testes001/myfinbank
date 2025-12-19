import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Download, Copy, CheckCircle2, Building2, Printer } from "lucide-react";
import { FINBANK_ROUTING_NUMBER } from "@/lib/seed";
import { formatRoutingNumber } from "@/lib/banking-utils";

interface DirectDepositModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DirectDepositModal({ open, onOpenChange }: DirectDepositModalProps) {
  const { currentUser } = useAuth();
  const [showInstructions, setShowInstructions] = useState(true);

  if (!currentUser) return null;

  const accountNumber = currentUser.account.id;

  const handleCopyRoutingNumber = () => {
    navigator.clipboard.writeText(FINBANK_ROUTING_NUMBER);
    toast.success("Routing number copied to clipboard");
  };

  const handleCopyAccountNumber = () => {
    navigator.clipboard.writeText(accountNumber);
    toast.success("Account number copied to clipboard");
  };

  const handlePrintCheck = () => {
    window.print();
    toast.success("Print dialog opened");
  };

  const handleDownloadInfo = () => {
    // Create a simple text file with direct deposit information
    const content = `FinBank Direct Deposit Information

Account Holder: ${currentUser.user.full_name}
Routing Number: ${FINBANK_ROUTING_NUMBER}
Account Number: ${accountNumber}
Account Type: ${currentUser.account.account_type}
Bank Name: FinBank
Bank Address: 123 Finance Street, Suite 100, New York, NY 10001

Instructions:
Provide this information to your employer or benefits provider to set up direct deposit.

Important: Keep this information secure and only share with trusted entities.`;

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `FinBank_DirectDeposit_${accountNumber.slice(-4)}.txt`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success("Direct deposit information downloaded");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/20 bg-slate-900/95 text-white backdrop-blur-xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">Direct Deposit Setup</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Instructions */}
          <Card className="border-blue-500/20 bg-blue-500/10 p-4 backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <Building2 className="size-5 text-blue-400" />
              <div>
                <h4 className="font-semibold text-blue-400">How to Set Up Direct Deposit</h4>
                <p className="mt-2 text-sm text-blue-400/80">
                  Provide your employer or benefits provider with your routing and account numbers below.
                  You can also download a voided check image for verification purposes.
                </p>
              </div>
            </div>
          </Card>

          {/* Account Information */}
          <div className="space-y-4">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center justify-between">
                <Label className="text-white/60">Routing Number</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyRoutingNumber}
                  className="text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
                >
                  <Copy className="mr-2 size-4" />
                  Copy
                </Button>
              </div>
              <p className="font-mono text-2xl font-bold text-white">
                {formatRoutingNumber(FINBANK_ROUTING_NUMBER)}
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="mb-2 flex items-center justify-between">
                <Label className="text-white/60">Account Number</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyAccountNumber}
                  className="text-blue-400 hover:bg-blue-500/10 hover:text-blue-300"
                >
                  <Copy className="mr-2 size-4" />
                  Copy
                </Button>
              </div>
              <p className="font-mono text-2xl font-bold text-white">{accountNumber}</p>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <Label className="text-white/60">Account Type</Label>
              <p className="mt-1 text-lg font-semibold capitalize text-white">
                {currentUser.account.account_type}
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <Label className="text-white/60">Account Holder Name</Label>
              <p className="mt-1 text-lg font-semibold text-white">
                {currentUser.user.full_name}
              </p>
            </div>
          </div>

          {/* Voided Check Preview */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-white">Voided Check Preview</h3>
            <div className="overflow-hidden rounded-lg border border-white/10 bg-white p-6">
              <div className="relative">
                {/* Check Header */}
                <div className="mb-6 flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-blue-600">FinBank</h2>
                    <p className="text-xs text-gray-600">Elite Banking Solutions</p>
                    <p className="mt-1 text-xs text-gray-500">
                      123 Finance Street, Suite 100
                      <br />
                      New York, NY 10001
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm text-gray-600">Check #1001</p>
                    <p className="font-mono text-sm text-gray-600">Date: {new Date().toLocaleDateString()}</p>
                  </div>
                </div>

                {/* VOID Watermark */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-15deg] transform">
                  <p className="text-8xl font-bold text-red-500/30">VOID</p>
                </div>

                {/* Pay To Section */}
                <div className="mb-4 border-b-2 border-gray-300 pb-2">
                  <p className="mb-1 text-xs text-gray-600">Pay to the order of</p>
                  <p className="font-mono text-lg text-gray-800">{currentUser.user.full_name}</p>
                </div>

                {/* Amount Section */}
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex-1 border-b-2 border-gray-300 pb-2">
                    <p className="text-xs text-gray-600">Amount</p>
                    <p className="font-mono text-gray-800">$0.00</p>
                  </div>
                  <div className="ml-4 rounded border-2 border-gray-800 px-4 py-2">
                    <p className="font-mono font-bold text-gray-800">$0.00</p>
                  </div>
                </div>

                {/* Memo Section */}
                <div className="mb-6 border-b border-gray-300 pb-2">
                  <p className="text-xs text-gray-600">Memo: Direct Deposit Verification</p>
                </div>

                {/* MICR Line (Bottom of Check) */}
                <div className="mt-8 border-t-2 border-gray-800 pt-2">
                  <p className="font-mono text-sm text-gray-800">
                    <span className="mr-4">⑆1001⑆</span>
                    <span className="mr-4">⑇{FINBANK_ROUTING_NUMBER}⑇</span>
                    <span>⑈{accountNumber}⑈</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handlePrintCheck}
                variant="outline"
                className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                <Printer className="mr-2 size-4" />
                Print Check
              </Button>
              <Button
                onClick={handleDownloadInfo}
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
              >
                <Download className="mr-2 size-4" />
                Download Info
              </Button>
            </div>
          </div>

          {/* Security Notice */}
          <Card className="border-yellow-500/20 bg-yellow-500/10 p-4 backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="size-5 text-yellow-400" />
              <div>
                <h4 className="font-semibold text-yellow-400">Security Notice</h4>
                <p className="mt-1 text-sm text-yellow-400/80">
                  Only share this information with trusted employers, payroll providers, or government
                  agencies. FinBank will never ask for your account details via email or phone.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}
