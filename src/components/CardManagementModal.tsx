import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  CreditCard,
  Lock,
  Unlock,
  Globe,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  ShieldAlert,
} from "lucide-react";

interface CardManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CardManagementModal({ open, onOpenChange }: CardManagementModalProps) {
  const [cardFrozen, setCardFrozen] = useState(false);
  const [internationalEnabled, setInternationalEnabled] = useState(true);
  const [onlineEnabled, setOnlineEnabled] = useState(true);
  const [atmEnabled, setAtmEnabled] = useState(true);
  const [locationRestrictions, setLocationRestrictions] = useState({
    usa: true,
    europe: false,
    asia: false,
    other: false,
  });

  const handleFreezeCard = () => {
    setCardFrozen(!cardFrozen);
    toast.success(cardFrozen ? "Card unfrozen successfully" : "Card frozen successfully");
  };

  const handleReportLost = () => {
    toast.success("Card reported as lost. A replacement card will be sent within 5-7 business days.");
    onOpenChange(false);
  };

  const handleReportStolen = () => {
    toast.success("Card reported as stolen. A replacement card will be sent within 5-7 business days. All recent transactions flagged for review.");
    onOpenChange(false);
  };

  const handleToggleLocation = (location: keyof typeof locationRestrictions) => {
    setLocationRestrictions((prev) => ({
      ...prev,
      [location]: !prev[location],
    }));
    toast.success(`${location.toUpperCase()} transactions ${!locationRestrictions[location] ? "enabled" : "disabled"}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/20 bg-slate-900/95 text-white backdrop-blur-xl sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl text-white">
            <CreditCard className="mr-2 size-6" />
            Card Management & Controls
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="controls" className="mt-4">
          <TabsList className="grid w-full grid-cols-3 bg-white/5">
            <TabsTrigger value="controls" className="data-[state=active]:bg-white/20">
              Controls
            </TabsTrigger>
            <TabsTrigger value="geographic" className="data-[state=active]:bg-white/20">
              Geographic
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-white/20">
              Security
            </TabsTrigger>
          </TabsList>

          {/* Card Controls Tab */}
          <TabsContent value="controls" className="space-y-4">
            {/* Freeze/Unfreeze Card */}
            <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="mb-2 flex items-center text-lg font-semibold text-white">
                    {cardFrozen ? <Lock className="mr-2 size-5" /> : <Unlock className="mr-2 size-5" />}
                    Instant Freeze/Unfreeze
                  </h3>
                  <p className="text-sm text-white/60">
                    {cardFrozen
                      ? "Your card is currently frozen. All transactions are blocked."
                      : "Temporarily freeze your card to prevent unauthorized use"}
                  </p>
                </div>
                <Switch checked={cardFrozen} onCheckedChange={handleFreezeCard} className="ml-4" />
              </div>
              {cardFrozen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 rounded-lg bg-yellow-500/10 p-3"
                >
                  <p className="flex items-center text-sm text-yellow-400">
                    <AlertTriangle className="mr-2 size-4" />
                    Card is frozen - All transactions blocked
                  </p>
                </motion.div>
              )}
            </Card>

            {/* International Transactions */}
            <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="mb-2 flex items-center text-lg font-semibold text-white">
                    <Globe className="mr-2 size-5" />
                    International Transactions
                  </h3>
                  <p className="text-sm text-white/60">
                    Allow transactions outside the United States
                  </p>
                </div>
                <Switch
                  checked={internationalEnabled}
                  onCheckedChange={(checked) => {
                    setInternationalEnabled(checked);
                    toast.success(checked ? "International transactions enabled" : "International transactions disabled");
                  }}
                  className="ml-4"
                  disabled={cardFrozen}
                />
              </div>
            </Card>

            {/* Online Transactions */}
            <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="mb-2 flex items-center text-lg font-semibold text-white">
                    <Globe className="mr-2 size-5" />
                    Online & E-commerce
                  </h3>
                  <p className="text-sm text-white/60">
                    Allow online purchases and digital payments
                  </p>
                </div>
                <Switch
                  checked={onlineEnabled}
                  onCheckedChange={(checked) => {
                    setOnlineEnabled(checked);
                    toast.success(checked ? "Online transactions enabled" : "Online transactions disabled");
                  }}
                  className="ml-4"
                  disabled={cardFrozen}
                />
              </div>
            </Card>

            {/* ATM Withdrawals */}
            <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="mb-2 flex items-center text-lg font-semibold text-white">
                    <CreditCard className="mr-2 size-5" />
                    ATM Withdrawals
                  </h3>
                  <p className="text-sm text-white/60">
                    Allow cash withdrawals from ATMs
                  </p>
                </div>
                <Switch
                  checked={atmEnabled}
                  onCheckedChange={(checked) => {
                    setAtmEnabled(checked);
                    toast.success(checked ? "ATM withdrawals enabled" : "ATM withdrawals disabled");
                  }}
                  className="ml-4"
                  disabled={cardFrozen}
                />
              </div>
            </Card>
          </TabsContent>

          {/* Geographic Controls Tab */}
          <TabsContent value="geographic" className="space-y-4">
            <Card className="border-blue-500/20 bg-blue-500/10 p-4 backdrop-blur-xl">
              <div className="flex items-start gap-3">
                <MapPin className="size-5 text-blue-400" />
                <div>
                  <h4 className="font-semibold text-blue-400">Geographic Restrictions</h4>
                  <p className="mt-1 text-sm text-blue-400/80">
                    Control where your card can be used based on geographic location
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Label className="text-lg font-semibold text-white">United States</Label>
                  <p className="mt-1 text-sm text-white/60">
                    Domestic US transactions
                  </p>
                </div>
                <Switch
                  checked={locationRestrictions.usa}
                  onCheckedChange={() => handleToggleLocation("usa")}
                  className="ml-4"
                  disabled={cardFrozen}
                />
              </div>
            </Card>

            <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Label className="text-lg font-semibold text-white">Europe</Label>
                  <p className="mt-1 text-sm text-white/60">
                    European Union & UK transactions
                  </p>
                </div>
                <Switch
                  checked={locationRestrictions.europe}
                  onCheckedChange={() => handleToggleLocation("europe")}
                  className="ml-4"
                  disabled={cardFrozen}
                />
              </div>
            </Card>

            <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Label className="text-lg font-semibold text-white">Asia Pacific</Label>
                  <p className="mt-1 text-sm text-white/60">
                    Asia, Australia, and Pacific region transactions
                  </p>
                </div>
                <Switch
                  checked={locationRestrictions.asia}
                  onCheckedChange={() => handleToggleLocation("asia")}
                  className="ml-4"
                  disabled={cardFrozen}
                />
              </div>
            </Card>

            <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <Label className="text-lg font-semibold text-white">Other Regions</Label>
                  <p className="mt-1 text-sm text-white/60">
                    Africa, Middle East, and South America
                  </p>
                </div>
                <Switch
                  checked={locationRestrictions.other}
                  onCheckedChange={() => handleToggleLocation("other")}
                  className="ml-4"
                  disabled={cardFrozen}
                />
              </div>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
            <Card className="border-red-500/20 bg-red-500/10 p-4 backdrop-blur-xl">
              <div className="flex items-start gap-3">
                <ShieldAlert className="size-5 text-red-400" />
                <div>
                  <h4 className="font-semibold text-red-400">Lost or Stolen Card</h4>
                  <p className="mt-1 text-sm text-red-400/80">
                    Report your card immediately to prevent unauthorized transactions
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <h3 className="mb-3 text-lg font-semibold text-white">Report Lost Card</h3>
              <p className="mb-4 text-sm text-white/60">
                Your card is missing but you don't suspect fraudulent activity. We'll send a replacement.
              </p>
              <Button
                onClick={handleReportLost}
                variant="outline"
                className="w-full border-yellow-500/50 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20"
              >
                <AlertTriangle className="mr-2 size-4" />
                Report Lost
              </Button>
            </Card>

            <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <h3 className="mb-3 text-lg font-semibold text-white">Report Stolen Card</h3>
              <p className="mb-4 text-sm text-white/60">
                Your card was stolen or you suspect unauthorized use. We'll freeze the card and review recent transactions.
              </p>
              <Button
                onClick={handleReportStolen}
                variant="outline"
                className="w-full border-red-500/50 bg-red-500/10 text-red-400 hover:bg-red-500/20"
              >
                <ShieldAlert className="mr-2 size-4" />
                Report Stolen
              </Button>
            </Card>

            <Card className="border-green-500/20 bg-green-500/10 p-4 backdrop-blur-xl">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="size-5 text-green-400" />
                <div>
                  <h4 className="font-semibold text-green-400">Zero Liability Protection</h4>
                  <p className="mt-1 text-sm text-green-400/80">
                    You're protected from unauthorized transactions. We'll refund fraudulent charges.
                  </p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
