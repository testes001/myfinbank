import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Send,
  Search,
  Users,
  Zap,
  Plus,
  Star,
  ArrowRight,
  Loader2,
  Sparkles,
  History,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, p2pTransfer } from "@/lib/transactions";

// Contact/recipient types
interface P2PContact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  isFavorite: boolean;
  lastTransferAt?: string;
}

const P2P_CONTACTS_KEY = "finbank_p2p_contacts";

// Get contacts for a user
function getContacts(userId: string): P2PContact[] {
  try {
    const stored = localStorage.getItem(P2P_CONTACTS_KEY);
    if (!stored) return [];
    const allContacts: Record<string, P2PContact[]> = JSON.parse(stored);
    return allContacts[userId] || [];
  } catch {
    return [];
  }
}

// Save contacts
function saveContacts(userId: string, contacts: P2PContact[]): void {
  try {
    const stored = localStorage.getItem(P2P_CONTACTS_KEY);
    const allContacts: Record<string, P2PContact[]> = stored ? JSON.parse(stored) : {};
    allContacts[userId] = contacts;
    localStorage.setItem(P2P_CONTACTS_KEY, JSON.stringify(allContacts));
  } catch (error) {
    console.error("Failed to save contacts:", error);
  }
}

interface P2PTransferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransferComplete?: () => void;
}

export function P2PTransferModal({ open, onOpenChange, onTransferComplete }: P2PTransferModalProps) {
  const { currentUser } = useAuth();
  const [step, setStep] = useState<"select" | "amount" | "confirm" | "success">("select");
  const [contacts, setContacts] = useState<P2PContact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedContact, setSelectedContact] = useState<P2PContact | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);

  // New contact form
  const [newContactName, setNewContactName] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");

  // Load contacts
  useEffect(() => {
    if (open && currentUser) {
      setContacts(getContacts(currentUser.user.id));
    }
  }, [open, currentUser]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setStep("select");
      setSelectedContact(null);
      setAmount("");
      setNote("");
      setSearchQuery("");
      setShowAddContact(false);
    }
  }, [open]);

  // Filter contacts based on search
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const query = searchQuery.toLowerCase();
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query) ||
        c.phone?.includes(query)
    );
  }, [contacts, searchQuery]);

  // Favorite contacts first
  const sortedContacts = useMemo(() => {
    return [...filteredContacts].sort((a, b) => {
      if (a.isFavorite && !b.isFavorite) return -1;
      if (!a.isFavorite && b.isFavorite) return 1;
      // Then by recent usage
      if (a.lastTransferAt && b.lastTransferAt) {
        return new Date(b.lastTransferAt).getTime() - new Date(a.lastTransferAt).getTime();
      }
      return 0;
    });
  }, [filteredContacts]);

  const handleAddContact = () => {
    if (!currentUser) return;
    if (!newContactName.trim()) {
      toast.error("Please enter a name");
      return;
    }
    if (!newContactEmail && !newContactPhone) {
      toast.error("Please enter an email or phone number");
      return;
    }

    const newContact: P2PContact = {
      id: `contact_${Date.now()}`,
      name: newContactName.trim(),
      email: newContactEmail.trim() || undefined,
      phone: newContactPhone.trim() || undefined,
      isFavorite: false,
    };

    const updatedContacts = [...contacts, newContact];
    setContacts(updatedContacts);
    saveContacts(currentUser.user.id, updatedContacts);

    setNewContactName("");
    setNewContactEmail("");
    setNewContactPhone("");
    setShowAddContact(false);
    toast.success("Contact added");
  };

  const handleToggleFavorite = (contactId: string) => {
    if (!currentUser) return;
    const updatedContacts = contacts.map((c) =>
      c.id === contactId ? { ...c, isFavorite: !c.isFavorite } : c
    );
    setContacts(updatedContacts);
    saveContacts(currentUser.user.id, updatedContacts);
  };

  const handleSelectContact = (contact: P2PContact) => {
    setSelectedContact(contact);
    setStep("amount");
  };

  const handleSendMoney = async () => {
    if (!currentUser || !selectedContact) return;
    if (!selectedContact.email) {
        toast.error("Contact needs an email address for transfers");
        return;
    }

    const amountNum = parseFloat(amount);

    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!currentUser.account?.id) {
        toast.error("Account information missing");
        return;
    }

    const balance = parseFloat(currentUser.account.balance);
    if (amountNum > balance) {
      toast.error("Insufficient balance");
      return;
    }

    setIsProcessing(true);

    try {
        await p2pTransfer(
            currentUser.account.id,
            selectedContact.email,
            amountNum,
            note.trim() || undefined
        );

        // Update contact's last transfer time
        const updatedContacts = contacts.map((c) =>
        c.id === selectedContact.id ? { ...c, lastTransferAt: new Date().toISOString() } : c
        );
        setContacts(updatedContacts);
        saveContacts(currentUser.user.id, updatedContacts);

        setIsProcessing(false);
        setStep("success");
        onTransferComplete?.();
    } catch (error) {
        setIsProcessing(false);
        toast.error(error instanceof Error ? error.message : "Transfer failed");
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!currentUser) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-md overflow-hidden border-white/20 bg-slate-900/95 text-white backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <Send className="size-5" />
            Send Money
            {step === "select" && (
              <Badge className="ml-2 bg-green-500/20 text-green-400">
                <Zap className="mr-1 size-3" />
                Instant
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {/* Step 1: Select Recipient */}
          {step === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/40" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="border-white/20 bg-white/10 pl-10 text-white placeholder:text-white/40"
                />
              </div>

              <Separator className="bg-white/10" />

              {/* Contacts List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <Users className="size-4" />
                    Contacts
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowAddContact(!showAddContact)}
                    className="text-blue-400 hover:bg-blue-500/20 h-7"
                  >
                    <Plus className="size-4 mr-1" />
                    Add
                  </Button>
                </div>

                {/* Add Contact Form */}
                {showAddContact && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-3"
                  >
                    <Card className="border-white/20 bg-white/5 p-3 space-y-2">
                      <Input
                        placeholder="Name"
                        value={newContactName}
                        onChange={(e) => setNewContactName(e.target.value)}
                        className="border-white/20 bg-white/10 text-white placeholder:text-white/40"
                      />
                      <Input
                        placeholder="Email"
                        type="email"
                        value={newContactEmail}
                        onChange={(e) => setNewContactEmail(e.target.value)}
                        className="border-white/20 bg-white/10 text-white placeholder:text-white/40"
                      />
                      <Input
                        placeholder="Phone"
                        type="tel"
                        value={newContactPhone}
                        onChange={(e) => setNewContactPhone(e.target.value)}
                        className="border-white/20 bg-white/10 text-white placeholder:text-white/40"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowAddContact(false)}
                          className="flex-1 border-white/20 text-white hover:bg-white/10"
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleAddContact}
                          className="flex-1 bg-blue-500 hover:bg-blue-600"
                        >
                          Save
                        </Button>
                      </div>
                    </Card>
                  </motion.div>
                )}

                <ScrollArea className="h-[250px] pr-2">
                  {sortedContacts.length === 0 ? (
                    <div className="text-center py-8 text-white/40">
                      <Users className="size-10 mx-auto mb-2 opacity-50" />
                      <p>No contacts yet</p>
                      <p className="text-xs">Add a contact to send money</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {sortedContacts.map((contact) => (
                        <motion.div
                          key={contact.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <Card
                            onClick={() => handleSelectContact(contact)}
                            className="flex items-center gap-3 p-3 border-white/10 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors"
                          >
                            <Avatar className="size-10 border border-white/20">
                              <AvatarImage src={contact.avatarUrl} />
                              <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm">
                                {getInitials(contact.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-white truncate">
                                  {contact.name}
                                </p>
                                {contact.isFavorite && (
                                  <Star className="size-3 text-amber-400 fill-amber-400" />
                                )}
                              </div>
                              <p className="text-xs text-white/60 truncate">
                                {contact.email || contact.phone}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleFavorite(contact.id);
                              }}
                              className={`p-1 ${
                                contact.isFavorite
                                  ? "text-amber-400"
                                  : "text-white/40 hover:text-amber-400"
                              }`}
                            >
                              <Star
                                className={`size-4 ${
                                  contact.isFavorite ? "fill-amber-400" : ""
                                }`}
                              />
                            </Button>
                            <ArrowRight className="size-4 text-white/40" />
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </motion.div>
          )}

          {/* Step 2: Enter Amount */}
          {step === "amount" && selectedContact && (
            <motion.div
              key="amount"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              {/* Recipient Info */}
              <Card className="flex items-center gap-3 p-4 border-white/20 bg-white/5">
                <Avatar className="size-12 border border-white/20">
                  <AvatarImage src={selectedContact.avatarUrl} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                    {getInitials(selectedContact.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium text-white">Sending to</p>
                  <p className="text-lg text-white">{selectedContact.name}</p>
                  <p className="text-xs text-white/60">
                    {selectedContact.email || selectedContact.phone}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setStep("select")}
                  className="text-white/60 hover:text-white"
                >
                  Change
                </Button>
              </Card>

              {/* Amount Input */}
              <div className="text-center py-4">
                <Label className="text-white/60 text-sm">Amount</Label>
                <div className="relative mt-2">
                  <span className="absolute left-1/2 -translate-x-[calc(100%+0.5rem)] top-1/2 -translate-y-1/2 text-4xl text-white/60">
                    $
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="text-center text-4xl font-bold border-none bg-transparent text-white placeholder:text-white/20 focus:ring-0"
                    autoFocus
                  />
                </div>
                <p className="text-sm text-white/40 mt-2">
                  Available: {formatCurrency(parseFloat(currentUser.account.balance))}
                </p>
              </div>

              {/* Note */}
              <div>
                <Label className="text-white/60">Add a note (optional)</Label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What's this for?"
                  className="mt-1 border-white/20 bg-white/10 text-white placeholder:text-white/40 resize-none"
                  rows={2}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep("select")}
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                >
                  Back
                </Button>
                <Button
                  onClick={() => setStep("confirm")}
                  disabled={!amount || parseFloat(amount) <= 0}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500"
                >
                  Review
                  <ArrowRight className="ml-2 size-4" />
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Confirm */}
          {step === "confirm" && selectedContact && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <Card className="border-white/20 bg-white/5 p-4 text-center">
                <p className="text-white/60 mb-2">You're sending</p>
                <p className="text-4xl font-bold text-white mb-4">
                  {formatCurrency(parseFloat(amount))}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <div className="flex flex-col items-center">
                    <Avatar className="size-12 border border-white/20 mb-1">
                      <AvatarFallback className="bg-blue-500 text-white">
                        {getInitials(currentUser.user.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-xs text-white/60">You</p>
                  </div>
                  <ArrowRight className="size-6 text-green-400" />
                  <div className="flex flex-col items-center">
                    <Avatar className="size-12 border border-white/20 mb-1">
                      <AvatarImage src={selectedContact.avatarUrl} />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                        {getInitials(selectedContact.name)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-xs text-white/60">{selectedContact.name}</p>
                  </div>
                </div>
                {note && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <p className="text-xs text-white/40">Note</p>
                    <p className="text-sm text-white">{note}</p>
                  </div>
                )}
              </Card>

              <Card className="border-amber-500/20 bg-amber-500/10 p-3">
                <div className="flex items-start gap-2">
                  <Zap className="size-4 text-amber-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-400">Instant Transfer</p>
                    <p className="text-xs text-amber-400/80">
                      Money will be delivered instantly. This action cannot be undone.
                    </p>
                  </div>
                </div>
              </Card>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setStep("amount")}
                  className="flex-1 border-white/20 text-white hover:bg-white/10"
                  disabled={isProcessing}
                >
                  Back
                </Button>
                <Button
                  onClick={handleSendMoney}
                  disabled={isProcessing}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 size-4" />
                      Send Now
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 4: Success */}
          {step === "success" && selectedContact && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-6"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="size-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle2 className="size-10 text-white" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <h3 className="text-xl font-bold text-white mb-2">Money Sent!</h3>
                <p className="text-white/60">
                  {formatCurrency(parseFloat(amount))} was sent to {selectedContact.name}
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center justify-center gap-2 mt-4 text-green-400"
              >
                <Sparkles className="size-4" />
                <span className="text-sm">Delivered instantly</span>
              </motion.div>
              <Button
                onClick={() => onOpenChange(false)}
                className="mt-6 bg-white/10 hover:bg-white/20 text-white"
              >
                Done
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
