import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { UserORM } from "@/components/data/orm/orm_user";
import { AccountORM } from "@/components/data/orm/orm_account";
import { getAccountControls, freezeAccount, unfreezeAccount, updateAccountControls, type TransactionLimits } from "@/lib/transaction-limits";
import { addAuditLog, type AdminUser } from "@/lib/admin-storage";
import { Lock, Unlock, Settings, Shield, DollarSign } from "lucide-react";
import { toast } from "sonner";

export function AdminAccountControls({ adminUser }: { adminUser: AdminUser }) {
  const [accounts, setAccounts] = useState<Array<{ userId: string; accountId: string; userName: string; email: string; frozen: boolean }>>([]);
  const [selectedAccount, setSelectedAccount] = useState<{ userId: string; accountId: string; userName: string } | null>(null);
  const [showFreezeDialog, setShowFreezeDialog] = useState(false);
  const [showLimitsDialog, setShowLimitsDialog] = useState(false);
  const [freezeReason, setFreezeReason] = useState("");
  const [limits, setLimits] = useState<TransactionLimits>({
    dailyLimit: 5000,
    weeklyLimit: 20000,
    monthlyLimit: 50000,
    singleTransactionMax: 10000,
    dailyTransactionCount: 20,
  });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    const userOrm = UserORM.getInstance();
    const accountOrm = AccountORM.getInstance();

    const allUsers = await userOrm.getAllUser();
    const allAccounts = await accountOrm.getAllAccount();

    const accountData = allAccounts.map((account) => {
      const user = allUsers.find((u) => u.id === account.user_id);
      const controls = getAccountControls(account.user_id, account.id);

      return {
        userId: account.user_id,
        accountId: account.id,
        userName: user?.full_name || "Unknown",
        email: user?.email || "",
        frozen: controls.frozen,
      };
    });

    setAccounts(accountData);
  };

  const handleFreezeAccount = (userId: string, accountId: string, userName: string) => {
    setSelectedAccount({ userId, accountId, userName });
    setShowFreezeDialog(true);
  };

  const handleUnfreezeAccount = (userId: string, accountId: string) => {
    unfreezeAccount(userId, accountId);

    addAuditLog({
      actor: adminUser.id,
      actorType: "admin",
      action: "account_unfrozen",
      resource: "account",
      resourceId: accountId,
      details: { userId },
      status: "success",
    });

    toast.success("Account unfrozen successfully");
    loadAccounts();
  };

  const confirmFreeze = () => {
    if (!selectedAccount) return;

    freezeAccount(selectedAccount.userId, selectedAccount.accountId, freezeReason, adminUser.id);

    addAuditLog({
      actor: adminUser.id,
      actorType: "admin",
      action: "account_frozen",
      resource: "account",
      resourceId: selectedAccount.accountId,
      details: { userId: selectedAccount.userId, reason: freezeReason },
      status: "success",
    });

    toast.success("Account frozen successfully");
    setShowFreezeDialog(false);
    setFreezeReason("");
    setSelectedAccount(null);
    loadAccounts();
  };

  const handleEditLimits = (userId: string, accountId: string, userName: string) => {
    const controls = getAccountControls(userId, accountId);
    setLimits(controls.limits);
    setSelectedAccount({ userId, accountId, userName });
    setShowLimitsDialog(true);
  };

  const confirmLimitsUpdate = () => {
    if (!selectedAccount) return;

    updateAccountControls(selectedAccount.userId, selectedAccount.accountId, { limits });

    addAuditLog({
      actor: adminUser.id,
      actorType: "admin",
      action: "account_limits_updated",
      resource: "account",
      resourceId: selectedAccount.accountId,
      details: { userId: selectedAccount.userId, limits },
      status: "success",
    });

    toast.success("Transaction limits updated successfully");
    setShowLimitsDialog(false);
    setSelectedAccount(null);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Account Controls & Security
          </CardTitle>
          <CardDescription>
            Freeze accounts, manage transaction limits, and control access
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Account ID</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.accountId}>
                  <TableCell className="font-medium">{account.userName}</TableCell>
                  <TableCell>{account.email}</TableCell>
                  <TableCell className="font-mono text-xs">{account.accountId.slice(-12)}</TableCell>
                  <TableCell>
                    {account.frozen ? (
                      <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                        <Lock className="h-3 w-3" />
                        Frozen
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        <Unlock className="h-3 w-3" />
                        Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {account.frozen ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUnfreezeAccount(account.userId, account.accountId)}
                      >
                        <Unlock className="h-4 w-4 mr-1" />
                        Unfreeze
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFreezeAccount(account.userId, account.accountId, account.userName)}
                      >
                        <Lock className="h-4 w-4 mr-1" />
                        Freeze
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditLimits(account.userId, account.accountId, account.userName)}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Limits
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Freeze Account Dialog */}
      <Dialog open={showFreezeDialog} onOpenChange={setShowFreezeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Freeze Account</DialogTitle>
            <DialogDescription>
              {selectedAccount?.userName} - This action will prevent all transactions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="freeze-reason">Reason for Freezing</Label>
              <Textarea
                id="freeze-reason"
                value={freezeReason}
                onChange={(e) => setFreezeReason(e.target.value)}
                placeholder="Enter the reason for freezing this account..."
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFreezeDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmFreeze} disabled={!freezeReason}>
              Freeze Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Limits Dialog */}
      <Dialog open={showLimitsDialog} onOpenChange={setShowLimitsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction Limits</DialogTitle>
            <DialogDescription>
              {selectedAccount?.userName} - Adjust daily, weekly, and monthly limits
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="daily-limit">Daily Limit ($)</Label>
                <Input
                  id="daily-limit"
                  type="number"
                  value={limits.dailyLimit}
                  onChange={(e) => setLimits({ ...limits, dailyLimit: Number(e.target.value) })}
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="weekly-limit">Weekly Limit ($)</Label>
                <Input
                  id="weekly-limit"
                  type="number"
                  value={limits.weeklyLimit}
                  onChange={(e) => setLimits({ ...limits, weeklyLimit: Number(e.target.value) })}
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="monthly-limit">Monthly Limit ($)</Label>
                <Input
                  id="monthly-limit"
                  type="number"
                  value={limits.monthlyLimit}
                  onChange={(e) => setLimits({ ...limits, monthlyLimit: Number(e.target.value) })}
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="single-max">Single Transaction Max ($)</Label>
                <Input
                  id="single-max"
                  type="number"
                  value={limits.singleTransactionMax}
                  onChange={(e) => setLimits({ ...limits, singleTransactionMax: Number(e.target.value) })}
                  min="0"
                />
              </div>
              <div>
                <Label htmlFor="daily-count">Daily Transaction Count</Label>
                <Input
                  id="daily-count"
                  type="number"
                  value={limits.dailyTransactionCount}
                  onChange={(e) => setLimits({ ...limits, dailyTransactionCount: Number(e.target.value) })}
                  min="1"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLimitsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={confirmLimitsUpdate}>
              <DollarSign className="h-4 w-4 mr-2" />
              Update Limits
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
