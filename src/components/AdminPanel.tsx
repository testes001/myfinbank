import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Shield,
  Users,
  Activity,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Lock,
  Unlock,
  LogOut,
  Eye,
  Search,
  Filter,
  Download,
  FileDown,
} from "lucide-react";
import { toast } from "sonner";
import {
  type AdminUser,
  type AuditLogEntry,
  type SuspiciousActivityFlag,
  type SystemStatus,
  adminLogin,
  adminLogout,
  getAdminSession,
  hasAdminPermission,
  initializeAdminAccounts,
  getSuspiciousActivityFlags,
  reviewSuspiciousActivity,
  getSystemStatus,
  updateSystemStatus,
  addAuditLog,
  fetchPendingKyc,
  approveKycAdmin,
  rejectKycAdmin,
  getAdminAccessToken,
  moderateTransaction,
} from "@/lib/admin-storage";
import { UserORM, type UserModel } from "@/components/data/orm/orm_user";
import { formatCurrency, formatDate } from "@/lib/transactions";
import { AdminAccountControls } from "@/components/AdminAccountControls";
import { exportAuditLogs, downloadSystemReport } from "@/lib/data-export";
import AdminDepositQueue from "@/components/AdminDepositQueue";
import { apiFetch } from "@/lib/api-client";

export function AdminPanel() {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeAdminAccounts();
    const session = getAdminSession();
    setAdminUser(session);
    setIsLoading(false);
  }, []);

  const handleLogin = (user: AdminUser) => {
    setAdminUser(user);
  };

  const handleLogout = () => {
    adminLogout();
    setAdminUser(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-muted-foreground">Loading admin console...</p>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return <AdminDashboard adminUser={adminUser} onLogout={handleLogout} />;
}

function AdminLogin({ onLogin }: { onLogin: (user: AdminUser) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const admin = await adminLogin(username, password);
      if (admin) {
        onLogin(admin);
      } else {
        setError("Invalid username or password");
      }
    } catch (err) {
      console.error(err);
      setError("Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-zinc-900 to-zinc-800">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">Admin Console</CardTitle>
          <CardDescription>
            Secure administrative access to banking system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Authenticating..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-6 p-4 bg-muted rounded-lg text-sm">
            <p className="font-semibold mb-2">Demo Credentials:</p>
            <p className="text-xs text-muted-foreground">
              superadmin / Admin@2024<br />
              compliance / Compliance@2024<br />
              approver / Approver@2024
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminDashboard({ adminUser, onLogout }: { adminUser: AdminUser; onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [systemStatus, setSystemStatus] = useState<SystemStatus>(getSystemStatus());

  useEffect(() => {
    const interval = setInterval(() => {
      const status = getSystemStatus();
      status.uptime = Math.floor((Date.now() - new Date(adminUser.createdAt).getTime()) / 1000);
      setSystemStatus(status);
    }, 5000);

    return () => clearInterval(interval);
  }, [adminUser.createdAt]);

  const toggleSystemMode = () => {
    const newMode = systemStatus.mode === "demo" ? "live" : "demo";
    updateSystemStatus({ mode: newMode });
    setSystemStatus({ ...systemStatus, mode: newMode });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Super Admin Control Panel</h1>
                <p className="text-sm text-muted-foreground">
                  {adminUser.fullName} • {adminUser.role.replace("_", " ").toUpperCase()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Badge variant={systemStatus.mode === "demo" ? "secondary" : "default"}>
                  {systemStatus.mode.toUpperCase()}
                </Badge>
                <Switch
                  checked={systemStatus.mode === "live"}
                  onCheckedChange={toggleSystemMode}
                />
                <span className="text-sm text-muted-foreground">Live Mode</span>
              </div>
              <Separator orientation="vertical" className="h-8" />
              <Button variant="outline" onClick={onLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">
              <Activity className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="kyc">
              <Users className="h-4 w-4 mr-2" />
              KYC Review
            </TabsTrigger>
            <TabsTrigger value="transactions">
              <TrendingUp className="h-4 w-4 mr-2" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="deposits">
              <FileText className="h-4 w-4 mr-2" />
              Deposits
            </TabsTrigger>
            <TabsTrigger value="controls">
              <Lock className="h-4 w-4 mr-2" />
              Controls
            </TabsTrigger>
            <TabsTrigger value="monitoring">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Monitoring
            </TabsTrigger>
            <TabsTrigger value="audit">
              <FileText className="h-4 w-4 mr-2" />
              Audit Log
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <SystemOverview systemStatus={systemStatus} />
          </TabsContent>

          <TabsContent value="kyc">
            <KYCReviewPanel adminUser={adminUser} />
          </TabsContent>

          <TabsContent value="transactions">
            <TransactionApprovalPanel adminUser={adminUser} />
          </TabsContent>

          <TabsContent value="deposits">
            <AdminDepositQueue adminUser={adminUser} />
          </TabsContent>

          <TabsContent value="controls">
            <AdminAccountControls adminUser={adminUser} />
          </TabsContent>

          <TabsContent value="monitoring">
            <MonitoringPanel adminUser={adminUser} />
          </TabsContent>

          <TabsContent value="audit">
            <AuditLogPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function SystemOverview({ systemStatus }: { systemStatus: SystemStatus }) {
  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const handleDownloadReport = () => {
    downloadSystemReport();
    toast.success("System report downloaded successfully");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button onClick={handleDownloadReport} variant="outline">
          <FileDown className="h-4 w-4 mr-2" />
          Download System Report
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">System Status</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">Operational</div>
          <p className="text-xs text-muted-foreground">Uptime: {formatUptime(systemStatus.uptime)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">API Response Time</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{systemStatus.apiResponseTime}ms</div>
          <p className="text-xs text-muted-foreground">Average response time</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Sign-ups</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{systemStatus.pendingSignups}</div>
          <p className="text-xs text-muted-foreground">Awaiting KYC review</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Transactions</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{systemStatus.pendingTransactions}</div>
          <p className="text-xs text-muted-foreground">Awaiting approval</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Fraud Alerts</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{systemStatus.activeFraudAlerts}</div>
          <p className="text-xs text-muted-foreground">Requires investigation</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">System Mode</CardTitle>
          {systemStatus.mode === "demo" ? (
            <Unlock className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Lock className="h-4 w-4 text-muted-foreground" />
          )}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{systemStatus.mode.toUpperCase()}</div>
          <p className="text-xs text-muted-foreground">
            {systemStatus.mode === "demo" ? "Demo environment active" : "Live production mode"}
          </p>
        </CardContent>
      </Card>
    </div>
    </div>
  );
}

function KYCReviewPanel({ adminUser }: { adminUser: AdminUser }) {
  const [pending, setPending] = useState<any[]>([]);
  const [selectedKyc, setSelectedKyc] = useState<any | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const loadPendingUsers = async () => {
    try {
      const list = await fetchPendingKyc();
      setPending(list);
      updateSystemStatus({ pendingSignups: list.length });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load pending KYC");
    }
  };

  const handleReview = (kyc: any, action: "approve" | "reject") => {
    setSelectedKyc(kyc);
    setActionType(action);
    setShowDialog(true);
  };

  const confirmReview = async () => {
    if (!selectedKyc || !actionType) return;

    const newStatus = actionType === "approve" ? "approved" : "rejected";
    try {
      if (actionType === "approve") {
        await approveKycAdmin(selectedKyc.id, adminUser.id);
      } else {
        await rejectKycAdmin(selectedKyc.id, reviewNotes || "Rejected", adminUser.id);
      }

      addAuditLog({
        actor: adminUser.id,
        actorType: "admin",
        action: `kyc_${actionType}`,
        resource: "user",
        resourceId: selectedKyc.userId,
        details: { email: selectedKyc.email, notes: reviewNotes },
        status: "success",
      });

      toast.success(`KYC ${newStatus}`);
      setShowDialog(false);
      setReviewNotes("");
      setSelectedKyc(null);
      setActionType(null);
      loadPendingUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update KYC");
    }
  };

  if (pending.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Pending KYC Reviews</h3>
          <p className="text-muted-foreground text-center">
            All user sign-ups have been reviewed and processed.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Pending KYC Reviews</CardTitle>
          <CardDescription>
            Review and approve or reject user sign-ups ({pending.length} pending)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Submitted</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Documents</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pending.map((kyc) => (
            <TableRow key={kyc.id}>
              <TableCell className="font-medium">{kyc.email || kyc.userId}</TableCell>
              <TableCell>{kyc.email}</TableCell>
              <TableCell>{new Date(kyc.submittedAt || "").toLocaleDateString()}</TableCell>
              <TableCell>
                <Badge variant={kyc.status === "PENDING" ? "secondary" : "default"}>
                  {kyc.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="text-xs text-muted-foreground">
                  {kyc.idDocumentType || "N/A"}
                </div>
              </TableCell>
              <TableCell className="text-right space-x-2">
                <Button size="sm" variant="outline" onClick={() => handleReview(kyc, "approve")}>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleReview(kyc, "reject")}>
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve" : "Reject"} KYC Application
            </DialogTitle>
            <DialogDescription>
              {selectedKyc?.email || selectedKyc?.userId}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="notes">Review Notes</Label>
              <Textarea
                id="notes"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Enter notes about this review decision..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmReview}
              variant={actionType === "approve" ? "default" : "destructive"}
            >
              Confirm {actionType === "approve" ? "Approval" : "Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function TransactionApprovalPanel({ adminUser }: { adminUser: AdminUser }) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState<any | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [moderationNotes, setModerationNotes] = useState("");

  useEffect(() => {
    loadPendingTransactions();
  }, []);

  const loadPendingTransactions = async () => {
    const token = getAdminAccessToken();
    if (!token) return;
    try {
      const resp = await apiFetch("/api/admin/transactions", { tokenOverride: token });
      if (!resp.ok) throw new Error("Failed to load transactions");
      const data = await resp.json();
      setTransactions(data.data?.transactions || []);
      updateSystemStatus({ pendingTransactions: data.data?.transactions?.length || 0 });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load transactions");
    }
  };

  const handleReview = (transaction: any, action: "approve" | "reject") => {
    setSelectedTransaction(transaction);
    setActionType(action);
    setShowDialog(true);
  };

  const confirmReview = async () => {
    if (!selectedTransaction || !actionType) return;

    try {
      await moderateTransaction(
        selectedTransaction.id,
        actionType === "approve" ? "APPROVED" : "REJECTED",
        moderationNotes
      );
      toast.success(`Transaction ${actionType === "approve" ? "approved" : "rejected"}`);
      setShowDialog(false);
      setSelectedTransaction(null);
      setActionType(null);
      setModerationNotes("");
      loadPendingTransactions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update transaction");
    }
  };

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Pending Transactions</h3>
          <p className="text-muted-foreground text-center">
            All transactions have been processed.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Pending Transaction Approvals</CardTitle>
          <CardDescription>
            Review and approve high-value or flagged transactions ({transactions.length} loaded)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>From Account</TableHead>
                <TableHead>To Account</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{formatDate(transaction.create_time)}</TableCell>
                  <TableCell className="font-bold">{formatCurrency(transaction.amount)}</TableCell>
                  <TableCell>
                    <Badge>{transaction.transaction_type}</Badge>
                  </TableCell>
                  <TableCell className="text-xs">{transaction.from_account_id?.slice(-8)}</TableCell>
                  <TableCell className="text-xs">{transaction.to_account_id?.slice(-8)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {transaction.description || "—"}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleReview(transaction, "approve")}>
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleReview(transaction, "reject")}>
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve" : "Reject"} Transaction
            </DialogTitle>
            <DialogDescription>
              Amount: {selectedTransaction && formatCurrency(selectedTransaction.amount)}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label htmlFor="moderation-notes">Notes</Label>
            <Textarea
              id="moderation-notes"
              placeholder="Add reviewer notes (optional)"
              value={moderationNotes}
              onChange={(e) => setModerationNotes(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={confirmReview}
              variant={actionType === "approve" ? "default" : "destructive"}
            >
              Confirm {actionType === "approve" ? "Approval" : "Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MonitoringPanel({ adminUser }: { adminUser: AdminUser }) {
  const [flags, setFlags] = useState<SuspiciousActivityFlag[]>([]);
  const [selectedFlag, setSelectedFlag] = useState<SuspiciousActivityFlag | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");

  useEffect(() => {
    loadFlags();
  }, []);

  const loadFlags = () => {
    const allFlags = getSuspiciousActivityFlags();
    setFlags(allFlags);
    const unreviewed = allFlags.filter((f) => !f.reviewed).length;
    updateSystemStatus({ activeFraudAlerts: unreviewed });
  };

  const handleReview = (flag: SuspiciousActivityFlag) => {
    setSelectedFlag(flag);
    setShowDialog(true);
  };

  const confirmReview = () => {
    if (!selectedFlag) return;

    reviewSuspiciousActivity(selectedFlag.id, adminUser.id, reviewNotes);
    setShowDialog(false);
    setReviewNotes("");
    setSelectedFlag(null);
    loadFlags();
  };

  const getSeverityColor = (severity: SuspiciousActivityFlag["severity"]) => {
    switch (severity) {
      case "critical":
        return "destructive";
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "secondary";
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Suspicious Activity Monitoring</CardTitle>
          <CardDescription>
            Flagged activities requiring investigation ({flags.filter((f) => !f.reviewed).length} unreviewed)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {flags.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Suspicious Activity</h3>
              <p className="text-muted-foreground text-center">
                No flagged activities at this time.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flags.map((flag) => (
                  <TableRow key={flag.id}>
                    <TableCell>{new Date(flag.timestamp).toLocaleDateString()}</TableCell>
                    <TableCell className="text-xs font-mono">{flag.userId.slice(-12)}</TableCell>
                    <TableCell className="text-xs">{flag.flagType.replace(/_/g, " ")}</TableCell>
                    <TableCell>
                      <Badge variant={getSeverityColor(flag.severity)}>{flag.severity}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{flag.description}</TableCell>
                    <TableCell>
                      {flag.reviewed ? (
                        <Badge variant="outline">Reviewed</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReview(flag)}
                        disabled={flag.reviewed}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {flag.reviewed ? "View" : "Review"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Suspicious Activity</DialogTitle>
            <DialogDescription>
              {selectedFlag?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">Severity:</span>{" "}
                <Badge variant={selectedFlag ? getSeverityColor(selectedFlag.severity) : "secondary"}>
                  {selectedFlag?.severity}
                </Badge>
              </div>
              <div>
                <span className="font-semibold">Type:</span> {selectedFlag?.flagType.replace(/_/g, " ")}
              </div>
            </div>
            {!selectedFlag?.reviewed && (
              <div>
                <Label htmlFor="review-notes">Review Notes</Label>
                <Textarea
                  id="review-notes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Enter your investigation notes..."
                  rows={4}
                />
              </div>
            )}
            {selectedFlag?.reviewed && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-semibold mb-1">Previous Review</p>
                <p className="text-sm text-muted-foreground">{selectedFlag.reviewNotes}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Reviewed by {selectedFlag.reviewedBy} on{" "}
                  {selectedFlag.reviewedAt && new Date(selectedFlag.reviewedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              {selectedFlag?.reviewed ? "Close" : "Cancel"}
            </Button>
            {!selectedFlag?.reviewed && (
              <Button onClick={confirmReview}>Mark as Reviewed</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function AuditLogPanel() {
  const [logs, setLogs] = useState<any[]>([]);
  const [filterAction, setFilterAction] = useState("");
  const [filterActorType, setFilterActorType] = useState<"user" | "admin" | "">("");

  useEffect(() => {
    loadLogs();
  }, [filterAction, filterActorType]);

  const loadLogs = () => {
    const token = getAdminAccessToken();
    if (!token) return;
    apiFetch("/api/admin/audit-logs", { tokenOverride: token })
      .then(async (resp: Response) => {
        if (!resp.ok) throw new Error("Failed to load audit logs");
        const data = await resp.json();
        let auditLogs: any[] = data.data || [];
        if (filterAction) {
          auditLogs = auditLogs.filter((log) => log.action?.includes(filterAction));
        }
        if (filterActorType) {
          auditLogs = auditLogs.filter((log) =>
            (log.actorType || log.actor_type || "").toLowerCase() === filterActorType
          );
        }
        setLogs(auditLogs);
      })
      .catch((err: unknown) => {
        console.error(err);
        toast.error("Failed to load audit logs");
      });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Audit Log</CardTitle>
            <CardDescription>
              Comprehensive log of all system actions and events
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportAuditLogs(logs, "csv")}
              aria-label="Export audit log as CSV"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportAuditLogs(logs, "json")}
              aria-label="Export audit log as JSON"
            >
              <FileDown className="h-4 w-4 mr-2" />
              Export JSON
            </Button>
          </div>
        </div>
        <div className="flex gap-4 mt-4">
          <div className="flex-1">
            <Label htmlFor="search">Search Action</Label>
            <Input
              id="search"
              placeholder="Filter by action..."
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
            />
          </div>
          <div className="w-48">
            <Label htmlFor="actor-type">Actor Type</Label>
            <select
              id="actor-type"
              className="w-full h-10 px-3 rounded-md border bg-background"
              value={filterActorType}
              onChange={(e) => setFilterActorType(e.target.value as "user" | "admin" | "")}
            >
              <option value="">All</option>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs">
                    {new Date(log.timestamp || log.createdAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                    <Badge variant={(log.actorType || log.actor_type) === "admin" ? "default" : "secondary"}>
                      {log.actorType || log.actor_type}
                    </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{log.action}</TableCell>
                    <TableCell className="text-xs">{log.resource}</TableCell>
                    <TableCell>
                    <Badge variant={(log.status || log.status_text) === "SUCCESS" || log.status === "success" ? "outline" : "destructive"}>
                      {log.status || log.status_text}
                    </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground max-w-md truncate">
                    {JSON.stringify(log.details || log.metadata || {})}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
