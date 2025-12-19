import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getAdminDepositQueue, approveDeposit, rejectDeposit, extractCheckDataFromImage, type MobileDeposit } from "@/lib/mobile-deposit";
import { CheckCircle, XCircle, ImageIcon } from "lucide-react";

export function AdminDepositQueue({ adminUser }: { adminUser: any }) {
  const [deposits, setDeposits] = useState<MobileDeposit[]>([]);
  const [selected, setSelected] = useState<MobileDeposit | null>(null);
  const [showViewer, setShowViewer] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState<string>("illegible_image");
  const [rejectDetails, setRejectDetails] = useState<string>("");

  const load = () => {
    const q = getAdminDepositQueue();
    setDeposits(q || []);
  };

  useEffect(() => {
    load();
  }, []);

  const handleApprove = async (d: MobileDeposit) => {
    try {
      const res = await approveDeposit(d.id, adminUser.id);
      if (res.success) {
        toast.success("Deposit approved and funds credited");
        load();
      } else {
        toast.error(res.error || "Failed to approve");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to approve deposit");
    }
  };

  const handleRejectConfirm = async () => {
    if (!selected) return;
    try {
      const res = await rejectDeposit(selected.id, adminUser.id, rejectReason as any, rejectDetails || undefined);
      if (res.success) {
        toast.success("Deposit rejected");
        setShowRejectDialog(false);
        setSelected(null);
        load();
      } else {
        toast.error(res.error || "Failed to reject");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to reject deposit");
    }
  };

  const openViewer = (d: MobileDeposit) => {
    setSelected(d);
    setShowViewer(true);
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Admin Deposit Queue</CardTitle>
              <CardDescription>Review and process mobile check deposits ({deposits.length} pending)</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={load}>Refresh</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {deposits.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">No deposits awaiting review</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deposits.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{new Date(d.submittedAt).toLocaleString()}</TableCell>
                    <TableCell className="font-mono text-xs">{d.userId.slice(-10)}</TableCell>
                    <TableCell className="font-bold">{d.currency}{d.amount}</TableCell>
                    <TableCell>{d.currency}</TableCell>
                    <TableCell className="capitalize">{d.accountType}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="outline" onClick={() => openViewer(d)}>
                        <ImageIcon className="h-4 w-4 mr-1" /> View
                      </Button>
                      <Button size="sm" onClick={() => handleApprove(d)}>
                        <CheckCircle className="h-4 w-4 mr-1" /> Approve
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => { setSelected(d); setShowRejectDialog(true); }}>
                        <XCircle className="h-4 w-4 mr-1" /> Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Viewer Dialog */}
      <Dialog open={showViewer} onOpenChange={setShowViewer}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check Images & OCR Data</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-2 border rounded">
              <div className="text-xs text-muted-foreground mb-2">Front</div>
              {selected?.checkFrontImageUrl ? (
                <img src={selected.checkFrontImageUrl} alt="front" className="w-full max-h-64 object-contain" />
              ) : (
                <div className="text-sm text-muted-foreground">No front image</div>
              )}
            </div>
            <div className="p-2 border rounded">
              <div className="text-xs text-muted-foreground mb-2">Back</div>
              {selected?.checkBackImageUrl ? (
                <img src={selected.checkBackImageUrl} alt="back" className="w-full max-h-64 object-contain" />
              ) : (
                <div className="text-sm text-muted-foreground">No back image</div>
              )}
            </div>
          </div>

          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2">OCR / Extracted Data</h4>
            {selected ? (
              (() => {
                const ocr = extractCheckDataFromImage(selected.checkFrontImageUrl || "");
                return (
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div>Amount: {selected.extractedAmount || ocr.amount || "N/A"}</div>
                    <div>Payee: {selected.extractedPayee || ocr.payee || "N/A"}</div>
                    <div>Submitted: {new Date(selected.submittedAt).toLocaleString()}</div>
                  </div>
                );
              })()
            ) : (
              <div className="text-sm text-muted-foreground">No deposit selected</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Deposit</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Reason</Label>
              <Select onValueChange={(v) => setRejectReason(v)}>
                <SelectTrigger>
                  <SelectValue>{rejectReason}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unsupported_currency">Unsupported Currency</SelectItem>
                  <SelectItem value="illegible_image">Illegible Image</SelectItem>
                  <SelectItem value="signature_mismatch">Signature Mismatch</SelectItem>
                  <SelectItem value="invalid_amount">Invalid Amount</SelectItem>
                  <SelectItem value="duplicate_deposit">Duplicate Deposit</SelectItem>
                  <SelectItem value="policy_violation">Policy Violation</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Details (optional)</Label>
              <textarea className="w-full rounded border p-2 text-sm" value={rejectDetails} onChange={(e) => setRejectDetails(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRejectConfirm}>Confirm Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminDepositQueue;
