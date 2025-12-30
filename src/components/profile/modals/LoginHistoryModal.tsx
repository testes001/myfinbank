import { motion } from "framer-motion";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Clock,
  Monitor,
  Smartphone,
  Tablet,
  MapPin,
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Filter,
  Download,
} from "lucide-react";
import { toast } from "sonner";

interface LoginAttempt {
  id: string;
  device: string;
  location: string;
  ip: string;
  time: string;
  success: boolean;
}

interface LoginHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  loginHistory: LoginAttempt[];
  onDownloadHistory?: () => void;
}

export default function LoginHistoryModal({
  isOpen,
  onClose,
  loginHistory,
  onDownloadHistory,
}: LoginHistoryModalProps) {
  const [filter, setFilter] = useState<"all" | "success" | "failed">("all");

  const getDeviceIcon = (device: string) => {
    const deviceLower = device.toLowerCase();
    if (deviceLower.includes("iphone") || deviceLower.includes("android")) {
      return <Smartphone className="size-5 text-blue-400" />;
    }
    if (deviceLower.includes("ipad") || deviceLower.includes("tablet")) {
      return <Tablet className="size-5 text-purple-400" />;
    }
    return <Monitor className="size-5 text-cyan-400" />;
  };

  const handleDownload = () => {
    if (onDownloadHistory) {
      onDownloadHistory();
    }
    toast.success("Login history exported successfully");
  };

  const filteredHistory = loginHistory.filter((attempt) => {
    if (filter === "all") return true;
    if (filter === "success") return attempt.success;
    if (filter === "failed") return !attempt.success;
    return true;
  });

  const failedAttempts = loginHistory.filter((attempt) => !attempt.success);
  const successfulLogins = loginHistory.filter((attempt) => attempt.success);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-white/10 bg-gradient-to-br from-slate-900 via-indigo-900/20 to-slate-900 backdrop-blur-xl sm:max-w-[700px] max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <div className="flex size-10 items-center justify-center rounded-full bg-indigo-500/20">
              <Clock className="size-5 text-indigo-400" />
            </div>
            Login History
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Review all login attempts to your account
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-white/5 p-3 border border-white/10">
              <div className="flex items-center gap-2 text-xs text-white/60 mb-1">
                <Clock className="size-3" />
                <span>Total</span>
              </div>
              <p className="text-2xl font-bold text-white">
                {loginHistory.length}
              </p>
            </div>
            <div className="rounded-lg bg-green-500/10 p-3 border border-green-500/20">
              <div className="flex items-center gap-2 text-xs text-green-400 mb-1">
                <CheckCircle2 className="size-3" />
                <span>Successful</span>
              </div>
              <p className="text-2xl font-bold text-green-400">
                {successfulLogins.length}
              </p>
            </div>
            <div className="rounded-lg bg-red-500/10 p-3 border border-red-500/20">
              <div className="flex items-center gap-2 text-xs text-red-400 mb-1">
                <XCircle className="size-3" />
                <span>Failed</span>
              </div>
              <p className="text-2xl font-bold text-red-400">
                {failedAttempts.length}
              </p>
            </div>
          </div>

          {/* Filter and Download */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-white/40" />
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant={filter === "all" ? "default" : "ghost"}
                  onClick={() => setFilter("all")}
                  className={
                    filter === "all"
                      ? "bg-white/20 text-white h-7 text-xs"
                      : "text-white/60 hover:bg-white/10 h-7 text-xs"
                  }
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant={filter === "success" ? "default" : "ghost"}
                  onClick={() => setFilter("success")}
                  className={
                    filter === "success"
                      ? "bg-green-500/20 text-green-400 h-7 text-xs"
                      : "text-white/60 hover:bg-white/10 h-7 text-xs"
                  }
                >
                  Success
                </Button>
                <Button
                  size="sm"
                  variant={filter === "failed" ? "default" : "ghost"}
                  onClick={() => setFilter("failed")}
                  className={
                    filter === "failed"
                      ? "bg-red-500/20 text-red-400 h-7 text-xs"
                      : "text-white/60 hover:bg-white/10 h-7 text-xs"
                  }
                >
                  Failed
                </Button>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownload}
              className="border-white/20 bg-white/10 text-white hover:bg-white/20 h-7 text-xs"
            >
              <Download className="mr-1 size-3" />
              Export
            </Button>
          </div>

          {/* Login History List */}
          <div className="space-y-2 overflow-y-auto max-h-[calc(85vh-380px)] pr-2">
            {filteredHistory.length > 0 ? (
              filteredHistory.map((attempt, index) => (
                <motion.div
                  key={attempt.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`rounded-lg border p-4 transition-colors ${
                    attempt.success
                      ? "border-white/10 bg-white/5 hover:bg-white/10"
                      : "border-red-500/20 bg-red-500/5 hover:bg-red-500/10"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="mt-1">
                        {getDeviceIcon(attempt.device)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-medium text-white">
                            {attempt.device}
                          </p>
                          <Badge
                            className={
                              attempt.success
                                ? "bg-green-500/20 text-green-400 text-xs"
                                : "bg-red-500/20 text-red-400 text-xs"
                            }
                          >
                            {attempt.success ? (
                              <>
                                <CheckCircle2 className="mr-1 size-3" />
                                Success
                              </>
                            ) : (
                              <>
                                <XCircle className="mr-1 size-3" />
                                Failed
                              </>
                            )}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-white/60">
                          <div className="flex items-center gap-2">
                            <MapPin className="size-3" />
                            <span>{attempt.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="size-3" />
                            <span>{attempt.time}</span>
                          </div>
                          <div className="flex items-center gap-2 col-span-2">
                            <Shield className="size-3" />
                            <span className="font-mono text-xs">
                              {attempt.ip}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    {attempt.success ? (
                      <CheckCircle2 className="size-5 text-green-400 ml-2" />
                    ) : (
                      <XCircle className="size-5 text-red-400 ml-2" />
                    )}
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-8 text-center"
              >
                <div className="flex size-16 items-center justify-center rounded-full bg-white/5 mb-3">
                  <Clock className="size-8 text-white/40" />
                </div>
                <p className="text-white/60">No login attempts found</p>
                <p className="text-sm text-white/40 mt-1">
                  Try adjusting your filter
                </p>
              </motion.div>
            )}
          </div>

          {/* Security Alerts */}
          {failedAttempts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Alert
                className={
                  failedAttempts.length >= 3
                    ? "bg-red-500/10 border-red-500/20"
                    : "bg-amber-500/10 border-amber-500/20"
                }
              >
                <AlertTriangle
                  className={`h-4 w-4 ${failedAttempts.length >= 3 ? "text-red-400" : "text-amber-400"}`}
                />
                <AlertDescription
                  className={`text-sm ${failedAttempts.length >= 3 ? "text-red-200" : "text-amber-200"}`}
                >
                  {failedAttempts.length >= 3 ? (
                    <>
                      <strong>Security Alert:</strong> We detected{" "}
                      {failedAttempts.length} failed login attempts. If this
                      wasn't you, please change your password immediately and
                      enable two-factor authentication.
                    </>
                  ) : (
                    <>
                      <strong>Notice:</strong> There {failedAttempts.length === 1 ? "was" : "were"}{" "}
                      {failedAttempts.length} failed login attempt{failedAttempts.length > 1 ? "s" : ""}.
                      Review the details above to ensure it was you.
                    </>
                  )}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {failedAttempts.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Alert className="bg-green-500/10 border-green-500/20">
                <CheckCircle2 className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-200 text-sm">
                  All login attempts were successful. Your account security
                  looks good!
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={onClose}
            className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
