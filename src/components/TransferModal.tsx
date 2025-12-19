import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { UserORM } from "@/components/data/orm/orm_user";
import { AccountORM } from "@/components/data/orm/orm_account";
import { transferFunds } from "@/lib/transactions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { CheckCircle2, Mail, CreditCard, AlertCircle, Clock } from "lucide-react";
import { isFundAccessRestricted, getFundRestrictionTimeRemaining } from "@/lib/ip-geolocation";
import { FINBANK_ROUTING_NUMBER } from "@/lib/seed";
import {
  isValidRoutingNumber,
  isValidAccountNumber,
  getBankName,
  isInternalTransfer,
  calculateTransferFee,
  getProcessingTime,
} from "@/lib/banking-utils";

interface TransferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function TransferModal({ open, onOpenChange, onSuccess }: TransferModalProps) {
  const { currentUser } = useAuth();
  const [transferMethod, setTransferMethod] = useState<"email" | "account">("email");

  // Email transfer fields
  const [recipientEmail, setRecipientEmail] = useState("");

  // Account transfer fields
  const [routingNumber, setRoutingNumber] = useState("");
  const [recipientAccountNumber, setRecipientAccountNumber] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [bankName, setBankName] = useState("");

  // Common fields
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [transferFee, setTransferFee] = useState(0);
  const [processingTime, setProcessingTime] = useState("");
  const [isFundsRestricted, setIsFundsRestricted] = useState(false);
  const [restrictionTimeRemaining, setRestrictionTimeRemaining] = useState(0);

  // Check fund access restrictions when modal opens
  useEffect(() => {
    if (open && currentUser) {
      const restricted = isFundAccessRestricted(currentUser.user.id);
      setIsFundsRestricted(restricted);
      if (restricted) {
        const timeRemaining = getFundRestrictionTimeRemaining(currentUser.user.id);
        setRestrictionTimeRemaining(timeRemaining);
      }
    }
  }, [open, currentUser]);

  const handleRoutingNumberChange = (value: string) => {
    setRoutingNumber(value);
    if (isValidRoutingNumber(value)) {
      const bank = getBankName(value);
      if (bank) {
        setBankName(bank);
        const isInternal = isInternalTransfer(value);
        const fee = calculateTransferFee(parseFloat(amount) || 0, isInternal ? 'internal' : 'ach');
        const time = getProcessingTime(isInternal ? 'internal' : 'ach');
        setTransferFee(fee);
        setProcessingTime(time);

        // Auto-lookup account if we have a valid account number and internal transfer
        if (isInternal && recipientAccountNumber && isValidAccountNumber(recipientAccountNumber)) {
          handleAccountNumberLookup(recipientAccountNumber);
        }
      } else {
        setBankName("Unknown Bank");
        toast.error("Routing number not recognized");
      }
    } else {
      setBankName("");
      setTransferFee(0);
      setProcessingTime("");
      setRecipientName("");
    }
  };

  const handleAccountNumberLookup = async (accountNum: string) => {
    if (!isInternalTransfer(routingNumber) || !isValidAccountNumber(accountNum)) {
      setRecipientName("");
      return;
    }

    try {
      const accountOrm = AccountORM.getInstance();
      const recipientAccounts = await accountOrm.getAccountById(accountNum);

      if (recipientAccounts.length > 0) {
        const recipientAccount = recipientAccounts[0];
        const userOrm = UserORM.getInstance();
        const recipientUsers = await userOrm.getUserById(recipientAccount.user_id);

        if (recipientUsers.length > 0) {
          const fullName = recipientUsers[0].full_name;
          setRecipientName(fullName);
          toast.success(`Account found: ${fullName} - ${recipientAccount.account_type}`);
        }
      } else {
        setRecipientName("");
        toast.error("Account not found at FinBank");
      }
    } catch (error) {
      console.error("Error looking up account:", error);
      setRecipientName("");
    }
  };

  const handleAccountNumberChange = (value: string) => {
    setRecipientAccountNumber(value);

    // Auto-lookup if we have a valid internal routing number and complete account number
    if (isInternalTransfer(routingNumber) && isValidAccountNumber(value)) {
      handleAccountNumberLookup(value);
    } else {
      setRecipientName("");
    }
  };

  const handleEmailSubmit = async () => {
    if (!currentUser) return;

    const userOrm = UserORM.getInstance();
    const accountOrm = AccountORM.getInstance();

    const recipientUsers = await userOrm.getUserByEmail(recipientEmail.trim().toLowerCase());

    if (recipientUsers.length === 0) {
      toast.error("Recipient not found. Please check the email address.");
      return null;
    }

    const recipientUser = recipientUsers[0];

    if (recipientUser.id === currentUser.user.id) {
      toast.error("You cannot send money to yourself");
      return null;
    }

    const recipientAccounts = await accountOrm.getAccountByUserId(recipientUser.id);

    if (recipientAccounts.length === 0) {
      toast.error("Recipient account not found");
      return null;
    }

    return {
      recipientAccount: recipientAccounts[0],
      recipientName: recipientUser.full_name,
    };
  };

  const handleAccountSubmit = async () => {
    if (!currentUser) return null;

    if (!isValidRoutingNumber(routingNumber)) {
      toast.error("Please enter a valid 9-digit routing number");
      return null;
    }

    if (!isValidAccountNumber(recipientAccountNumber)) {
      toast.error("Please enter a valid account number (10-12 digits)");
      return null;
    }

    if (!getBankName(routingNumber)) {
      toast.error("Routing number not recognized");
      return null;
    }

    const isInternal = isInternalTransfer(routingNumber);

    if (isInternal) {
      const accountOrm = AccountORM.getInstance();
      const recipientAccounts = await accountOrm.getAccountById(recipientAccountNumber);

      if (recipientAccounts.length === 0) {
        toast.error("Recipient account not found at FinBank");
        return null;
      }

      const recipientAccount = recipientAccounts[0];

      if (recipientAccount.id === currentUser.account.id) {
        toast.error("You cannot send money to yourself");
        return null;
      }

      const userOrm = UserORM.getInstance();
      const recipientUsers = await userOrm.getUserById(recipientAccount.user_id);

      return {
        recipientAccount: recipientAccount,
        recipientName: recipientUsers[0]?.full_name || "FinBank Customer",
      };
    } else {
      toast.info("External transfers would be processed via ACH in 1-3 business days");
      return {
        recipientAccount: null,
        recipientName: `External Account at ${bankName}`,
      };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    // Check if fund access is restricted (24-hour delay after password reset from unknown device)
    if (isFundAccessRestricted(currentUser.user.id)) {
      const timeRemaining = getFundRestrictionTimeRemaining(currentUser.user.id);
      const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
      const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
      toast.error(
        `Fund access is temporarily restricted for security. Access restored in ${hours}h ${minutes}m`,
      );
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    const currentBalance = parseFloat(currentUser.account.balance);
    const totalAmount = amountNum + transferFee;

    if (totalAmount > currentBalance) {
      toast.error(`Insufficient funds. You need $${totalAmount.toFixed(2)} (including $${transferFee} fee)`);
      return;
    }

    setIsLoading(true);

    try {
      let recipientInfo;

      if (transferMethod === "email") {
        recipientInfo = await handleEmailSubmit();
      } else {
        recipientInfo = await handleAccountSubmit();
      }

      if (!recipientInfo) {
        setIsLoading(false);
        return;
      }

      if (recipientInfo.recipientAccount) {
        await transferFunds(
          currentUser.account.id,
          recipientInfo.recipientAccount.id,
          amountNum,
          description || undefined
        );

        toast.success(`Successfully sent $${amountNum.toFixed(2)} to ${recipientInfo.recipientName}`);
      } else {
        toast.success(`Transfer initiated to ${recipientInfo.recipientName}. Processing time: ${processingTime}`);
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        resetForm();
        onSuccess();
      }, 2000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Transfer failed");
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setRecipientEmail("");
    setRoutingNumber("");
    setRecipientAccountNumber("");
    setRecipientName("");
    setBankName("");
    setAmount("");
    setDescription("");
    setTransferFee(0);
    setProcessingTime("");
  };

  const handleClose = () => {
    if (!isLoading && !showSuccess) {
      resetForm();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/20 bg-slate-900/95 text-white backdrop-blur-xl">
        {showSuccess ? (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center justify-center py-8"
          >
            <CheckCircle2 className="mb-4 size-16 text-green-400" />
            <h3 className="text-2xl font-bold">Transfer Successful!</h3>
            <p className="mt-2 text-white/60">Your money is on its way</p>
          </motion.div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl text-white">Send Money</DialogTitle>
            </DialogHeader>

            {isFundsRestricted && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3"
              >
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-200 mb-1">Security Delay Active</p>
                    <p className="text-xs text-amber-200/80">
                      For your security, fund transfers are temporarily disabled. Access will be restored in{" "}
                      {Math.floor(restrictionTimeRemaining / (1000 * 60 * 60))}h{" "}
                      {Math.floor((restrictionTimeRemaining % (1000 * 60 * 60)) / (1000 * 60))}m
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            <Tabs value={transferMethod} onValueChange={(v) => setTransferMethod(v as "email" | "account")}>
              <TabsList className="grid w-full grid-cols-2 bg-white/5">
                <TabsTrigger value="email" className="data-[state=active]:bg-white/20">
                  <Mail className="mr-2 size-4" />
                  By Email
                </TabsTrigger>
                <TabsTrigger value="account" className="data-[state=active]:bg-white/20">
                  <CreditCard className="mr-2 size-4" />
                  By Account
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                <TabsContent value="email" className="mt-0 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="recipient" className="text-white/80">
                      Recipient Email
                    </Label>
                    <Input
                      id="recipient"
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      required={transferMethod === "email"}
                      className="border-white/20 bg-white/10 text-white placeholder:text-white/40"
                      placeholder="recipient@example.com"
                    />
                    <p className="text-xs text-white/50">
                      Try: alice@demo.com, bob@demo.com, or charlie@demo.com
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="account" className="mt-0 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="routing" className="text-white/80">
                      Routing Number
                    </Label>
                    <Input
                      id="routing"
                      type="text"
                      value={routingNumber}
                      onChange={(e) => handleRoutingNumberChange(e.target.value)}
                      required={transferMethod === "account"}
                      maxLength={9}
                      className="border-white/20 bg-white/10 font-mono text-white placeholder:text-white/40"
                      placeholder="123456789"
                    />
                    {bankName && (
                      <div className="flex items-center text-sm text-green-400">
                        <CheckCircle2 className="mr-2 size-4" />
                        {bankName}
                      </div>
                    )}
                    <p className="text-xs text-white/50">
                      FinBank: {FINBANK_ROUTING_NUMBER} (instant transfer)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="account" className="text-white/80">
                      Account Number (10-12 digits)
                    </Label>
                    <Input
                      id="account"
                      type="text"
                      value={recipientAccountNumber}
                      onChange={(e) => handleAccountNumberChange(e.target.value)}
                      required={transferMethod === "account"}
                      maxLength={12}
                      className="border-white/20 bg-white/10 font-mono text-white placeholder:text-white/40"
                      placeholder="Enter account number"
                    />
                    {recipientName && (
                      <div className="flex items-center text-sm text-green-400">
                        <CheckCircle2 className="mr-2 size-4" />
                        {recipientName}
                      </div>
                    )}
                  </div>

                  {processingTime && (
                    <div className="rounded-lg bg-blue-500/10 p-3">
                      <p className="flex items-center text-sm text-blue-400">
                        <AlertCircle className="mr-2 size-4" />
                        Processing time: {processingTime}
                      </p>
                    </div>
                  )}
                </TabsContent>

                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-white/80">
                    Amount
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="border-white/20 bg-white/10 text-white placeholder:text-white/40"
                    placeholder="0.00"
                  />
                  {transferFee > 0 && (
                    <p className="text-sm text-yellow-400">
                      Transfer fee: ${transferFee.toFixed(2)}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white/80">
                    Description (Optional)
                  </Label>
                  <Input
                    id="description"
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="border-white/20 bg-white/10 text-white placeholder:text-white/40"
                    placeholder="What's this for?"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="flex-1 border-white/20 bg-white/10 text-white hover:bg-white/20"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                  >
                    {isLoading ? "Sending..." : "Send Money"}
                  </Button>
                </div>
              </form>
            </Tabs>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
