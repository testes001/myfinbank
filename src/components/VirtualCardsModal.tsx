import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getVirtualCards,
  createVirtualCard,
  freezeVirtualCard,
  unfreezeVirtualCard,
  cancelVirtualCard,
  deleteVirtualCard,
  formatCardNumber,
  maskCardNumber,
  getCardTypeDisplay,
  getNetworkDisplayName,
  validateLuhn,
  type VirtualCard,
  type VirtualCardType,
  type CardNetwork,
} from "@/lib/virtual-cards";
import { formatCurrency } from "@/lib/transactions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  CreditCard,
  Plus,
  Eye,
  EyeOff,
  Snowflake,
  Play,
  Trash2,
  Copy,
  ShoppingBag,
  RefreshCw,
  Lock,
  Shield,
  XCircle,
  CheckCircle2,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";

interface VirtualCardsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VirtualCardsModal({ open, onOpenChange }: VirtualCardsModalProps) {
  const { currentUser } = useAuth();
  const [cards, setCards] = useState<VirtualCard[]>([]);
  const [activeTab, setActiveTab] = useState<"cards" | "create">("cards");
  const [revealedCards, setRevealedCards] = useState<Set<string>>(new Set());

  // Create form state
  const [cardType, setCardType] = useState<VirtualCardType>("standard");
  const [cardNetwork, setCardNetwork] = useState<CardNetwork>("visa");
  const [nickname, setNickname] = useState("");
  const [merchantLock, setMerchantLock] = useState("");
  const [spendingLimit, setSpendingLimit] = useState("");

  const loadCards = () => {
    if (!currentUser) return;
    const allCards = getVirtualCards(currentUser.user.id);
    setCards(allCards);
  };

  useEffect(() => {
    if (open) {
      loadCards();
    }
  }, [open, currentUser]);

  const handleCreateCard = () => {
    if (!currentUser) return;

    if (!nickname) {
      toast.error("Please enter a nickname for the card");
      return;
    }

    if (cardType === "merchant_locked" && !merchantLock) {
      toast.error("Please enter a merchant name for merchant-locked cards");
      return;
    }

    try {
      const newCard = createVirtualCard(currentUser.user.id, currentUser.account.id, {
        nickname,
        type: cardType,
        network: cardNetwork,
        merchantLock: cardType === "merchant_locked" ? merchantLock : undefined,
        spendingLimit: spendingLimit ? parseFloat(spendingLimit) : undefined,
      });

      toast.success("Virtual card created successfully");
      resetForm();
      loadCards();
      setActiveTab("cards");

      // Auto-reveal the new card
      setRevealedCards((prev) => new Set(prev).add(newCard.id));
    } catch (error) {
      toast.error("Failed to create virtual card");
    }
  };

  const handleFreeze = (cardId: string) => {
    freezeVirtualCard(cardId);
    toast.success("Card frozen");
    loadCards();
  };

  const handleUnfreeze = (cardId: string) => {
    unfreezeVirtualCard(cardId);
    toast.success("Card unfrozen");
    loadCards();
  };

  const handleCancel = (cardId: string) => {
    cancelVirtualCard(cardId);
    toast.success("Card cancelled");
    loadCards();
  };

  const handleDelete = (cardId: string) => {
    deleteVirtualCard(cardId);
    toast.success("Card deleted");
    loadCards();
  };

  const toggleReveal = (cardId: string) => {
    setRevealedCards((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const resetForm = () => {
    setCardType("standard");
    setCardNetwork("visa");
    setNickname("");
    setMerchantLock("");
    setSpendingLimit("");
  };

  const getStatusBadge = (status: VirtualCard["status"]) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500/20 text-green-400">
            <CheckCircle2 className="mr-1 size-3" /> Active
          </Badge>
        );
      case "frozen":
        return (
          <Badge className="bg-blue-500/20 text-blue-400">
            <Snowflake className="mr-1 size-3" /> Frozen
          </Badge>
        );
      case "expired":
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400">
            <XCircle className="mr-1 size-3" /> Expired
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-500/20 text-red-400">
            <XCircle className="mr-1 size-3" /> Cancelled
          </Badge>
        );
    }
  };

  const getCardTypeIcon = (type: VirtualCardType) => {
    switch (type) {
      case "single_use":
        return <Lock className="size-4" />;
      case "merchant_locked":
        return <ShoppingBag className="size-4" />;
      case "recurring":
        return <RefreshCw className="size-4" />;
      default:
        return <CreditCard className="size-4" />;
    }
  };

  const activeCards = cards.filter((c) => c.status === "active");

  if (!currentUser) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden border-white/20 bg-slate-900/95 text-white backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <CreditCard className="size-5" />
            Virtual Cards
            <Badge className="ml-2 bg-green-500/20 text-green-400">
              {activeCards.length} Active
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Security Info */}
        <Card className="border-blue-500/20 bg-blue-500/10 p-3">
          <div className="flex items-start gap-2">
            <Shield className="mt-0.5 size-4 text-blue-400" />
            <div>
              <p className="text-sm font-medium text-blue-400">Secure Online Shopping</p>
              <p className="text-xs text-blue-400/80">
                Virtual cards protect your real card number. Use them for online purchases,
                subscriptions, or anywhere you'd use a credit card.
              </p>
            </div>
          </div>
        </Card>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="grid w-full grid-cols-2 bg-white/5">
            <TabsTrigger value="cards" className="data-[state=active]:bg-white/20">
              My Cards
            </TabsTrigger>
            <TabsTrigger value="create" className="data-[state=active]:bg-white/20">
              <Plus className="mr-2 size-4" />
              Create Card
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cards" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              {cards.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CreditCard className="mb-4 size-12 text-white/20" />
                  <p className="text-white/60">No virtual cards</p>
                  <p className="text-sm text-white/40">
                    Create a virtual card for secure online shopping
                  </p>
                  <Button
                    onClick={() => setActiveTab("create")}
                    className="mt-4 bg-gradient-to-r from-blue-500 to-purple-500"
                  >
                    <Plus className="mr-2 size-4" />
                    Create First Card
                  </Button>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  <div className="space-y-4">
                    {cards.map((card, index) => {
                      const isRevealed = revealedCards.has(card.id);

                      return (
                        <motion.div
                          key={card.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          {/* Virtual Card Display */}
                          <div
                            className={`relative overflow-hidden rounded-xl p-5 ${
                              card.status === "active"
                                ? "bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900"
                                : "bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 opacity-75"
                            }`}
                          >
                            {/* Card Background Pattern */}
                            <div className="absolute inset-0 opacity-10">
                              <div className="absolute -right-10 -top-10 size-40 rounded-full bg-white/20" />
                              <div className="absolute -bottom-10 -left-10 size-40 rounded-full bg-white/20" />
                            </div>

                            <div className="relative">
                              {/* Card Header */}
                              <div className="mb-4 flex items-start justify-between">
                                <div className="flex items-center gap-2">
                                  {getCardTypeIcon(card.type)}
                                  <span className="text-sm font-medium text-white">
                                    {card.nickname}
                                  </span>
                                </div>
                                {getStatusBadge(card.status)}
                              </div>

                              {/* Card Number */}
                              <div className="mb-4">
                                <p className="mb-1 text-xs text-white/40">Card Number</p>
                                <div className="flex items-center gap-2">
                                  <p className="font-mono text-lg tracking-wider text-white">
                                    {isRevealed
                                      ? formatCardNumber(card.fullCardNumber)
                                      : maskCardNumber(card.fullCardNumber)}
                                  </p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleReveal(card.id)}
                                    className="p-1 text-white/60 hover:text-white"
                                  >
                                    {isRevealed ? (
                                      <EyeOff className="size-4" />
                                    ) : (
                                      <Eye className="size-4" />
                                    )}
                                  </Button>
                                  {isRevealed && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        copyToClipboard(card.fullCardNumber, "Card number")
                                      }
                                      className="p-1 text-white/60 hover:text-white"
                                    >
                                      <Copy className="size-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>

                              {/* Card Details */}
                              <div className="flex gap-6">
                                <div>
                                  <p className="text-xs text-white/40">Expires</p>
                                  <p className="font-mono text-white">
                                    {card.expiryMonth}/{card.expiryYear}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-white/40">CVV</p>
                                  <div className="flex items-center gap-2">
                                    <p className="font-mono text-white">
                                      {isRevealed ? card.cvv : "•••"}
                                    </p>
                                    {isRevealed && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => copyToClipboard(card.cvv, "CVV")}
                                        className="p-1 text-white/60 hover:text-white"
                                      >
                                        <Copy className="size-3" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                {card.spendingLimit && (
                                  <div>
                                    <p className="text-xs text-white/40">Limit</p>
                                    <p className="text-white">
                                      {formatCurrency(card.spentAmount)} /{" "}
                                      {formatCurrency(card.spendingLimit)}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {/* Card Type Info */}
                              <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                                <div className="flex items-center gap-2 text-xs text-white/60">
                                  {getCardTypeIcon(card.type)}
                                  {getCardTypeDisplay(card.type)}
                                  {card.network && (
                                    <Badge className="bg-white/10 text-white/80 text-[10px] px-1.5 py-0">
                                      {getNetworkDisplayName(card.network)}
                                    </Badge>
                                  )}
                                  {card.merchantLock && (
                                    <span className="rounded bg-white/10 px-2 py-0.5">
                                      {card.merchantLock}
                                    </span>
                                  )}
                                </div>

                                {/* Card Actions */}
                                <div className="flex gap-1">
                                  {card.status === "active" && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleFreeze(card.id)}
                                      className="text-blue-400 hover:bg-blue-500/20"
                                    >
                                      <Snowflake className="size-4" />
                                    </Button>
                                  )}
                                  {card.status === "frozen" && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleUnfreeze(card.id)}
                                      className="text-green-400 hover:bg-green-500/20"
                                    >
                                      <Play className="size-4" />
                                    </Button>
                                  )}
                                  {(card.status === "active" || card.status === "frozen") && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleCancel(card.id)}
                                      className="text-red-400 hover:bg-red-500/20"
                                    >
                                      <XCircle className="size-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(card.id)}
                                    className="text-white/40 hover:bg-white/10 hover:text-red-400"
                                  >
                                    <Trash2 className="size-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </AnimatePresence>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="create" className="mt-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {/* Card Type Selection */}
                <div>
                  <Label className="text-white/60">Card Type</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {(["standard", "single_use", "merchant_locked", "recurring"] as VirtualCardType[]).map(
                      (type) => (
                        <Card
                          key={type}
                          onClick={() => setCardType(type)}
                          className={`cursor-pointer p-3 transition-colors ${
                            cardType === type
                              ? "border-blue-500/40 bg-blue-500/20"
                              : "border-white/10 bg-white/5 hover:bg-white/10"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {getCardTypeIcon(type)}
                            <div>
                              <p className="text-sm font-medium text-white">
                                {getCardTypeDisplay(type)}
                              </p>
                              <p className="text-xs text-white/60">
                                {type === "single_use" && "One-time use only"}
                                {type === "merchant_locked" && "Lock to one merchant"}
                                {type === "recurring" && "For subscriptions"}
                                {type === "standard" && "General purpose"}
                              </p>
                            </div>
                          </div>
                        </Card>
                      )
                    )}
                  </div>
                </div>

                {/* Card Network Selection */}
                <div>
                  <Label className="text-white/60">Card Network</Label>
                  <div className="mt-2 grid grid-cols-4 gap-2">
                    {(["visa", "mastercard", "amex", "discover"] as CardNetwork[]).map(
                      (network) => (
                        <Card
                          key={network}
                          onClick={() => setCardNetwork(network)}
                          className={`cursor-pointer p-2 text-center transition-colors ${
                            cardNetwork === network
                              ? "border-blue-500/40 bg-blue-500/20"
                              : "border-white/10 bg-white/5 hover:bg-white/10"
                          }`}
                        >
                          <p className="text-xs font-medium text-white">
                            {getNetworkDisplayName(network)}
                          </p>
                        </Card>
                      )
                    )}
                  </div>
                </div>

                {/* Card Nickname */}
                <div>
                  <Label className="text-white/60">Card Nickname</Label>
                  <Input
                    placeholder="e.g., Amazon Shopping, Netflix"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="mt-1 border-white/20 bg-white/10 text-white placeholder:text-white/40"
                  />
                </div>

                {/* Merchant Lock (for merchant-locked cards) */}
                {cardType === "merchant_locked" && (
                  <div>
                    <Label className="text-white/60">Merchant Name</Label>
                    <Input
                      placeholder="e.g., Amazon, Netflix, Spotify"
                      value={merchantLock}
                      onChange={(e) => setMerchantLock(e.target.value)}
                      className="mt-1 border-white/20 bg-white/10 text-white placeholder:text-white/40"
                    />
                    <p className="mt-1 text-xs text-white/40">
                      This card will only work at the specified merchant
                    </p>
                  </div>
                )}

                {/* Spending Limit */}
                <div>
                  <Label className="text-white/60">Spending Limit (Optional)</Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="No limit"
                      value={spendingLimit}
                      onChange={(e) => setSpendingLimit(e.target.value)}
                      className="border-white/20 bg-white/10 pl-10 text-white placeholder:text-white/40"
                    />
                  </div>
                </div>

                {/* Quick Limit Buttons */}
                <div className="flex flex-wrap gap-2">
                  {[50, 100, 250, 500, 1000].map((amount) => (
                    <Button
                      key={amount}
                      variant="outline"
                      size="sm"
                      onClick={() => setSpendingLimit(amount.toString())}
                      className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                    >
                      ${amount}
                    </Button>
                  ))}
                </div>

                {/* Card Preview */}
                <Card className="border-white/10 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 p-4">
                  <p className="mb-2 text-xs text-white/40">Preview</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getCardTypeIcon(cardType)}
                      <span className="font-medium text-white">
                        {nickname || "Card Nickname"}
                      </span>
                    </div>
                    <Badge className="bg-white/20">{getCardTypeDisplay(cardType)}</Badge>
                  </div>
                  <p className="mt-2 font-mono text-lg text-white/60">•••• •••• •••• ••••</p>
                </Card>

                {/* Create Button */}
                <Button
                  onClick={handleCreateCard}
                  disabled={!nickname || (cardType === "merchant_locked" && !merchantLock)}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500"
                >
                  <Plus className="mr-2 size-4" />
                  Create Virtual Card
                </Button>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
