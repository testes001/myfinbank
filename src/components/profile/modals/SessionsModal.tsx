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
  Monitor,
  Smartphone,
  Tablet,
  MapPin,
  Clock,
  Shield,
  AlertTriangle,
  X,
} from "lucide-react";
import { toast } from "sonner";

interface Session {
  id: string;
  device: string;
  location: string;
  ip: string;
  lastActive: string;
  current: boolean;
}

interface SessionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: Session[];
  onTerminateSession?: (sessionId: string) => void;
  onTerminateAllOther?: () => void;
}

export default function SessionsModal({
  isOpen,
  onClose,
  sessions,
  onTerminateSession,
  onTerminateAllOther,
}: SessionsModalProps) {
  const [terminatingId, setTerminatingId] = useState<string | null>(null);

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

  const handleTerminateSession = (sessionId: string) => {
    setTerminatingId(sessionId);

    // Simulate termination
    setTimeout(() => {
      if (onTerminateSession) {
        onTerminateSession(sessionId);
      }
      toast.success("Session terminated successfully");
      setTerminatingId(null);
    }, 500);
  };

  const handleTerminateAllOther = () => {
    if (onTerminateAllOther) {
      onTerminateAllOther();
    }
    toast.success("All other sessions terminated");
  };

  const currentSession = sessions.find((s) => s.current);
  const otherSessions = sessions.filter((s) => !s.current);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-white/10 bg-gradient-to-br from-slate-900 via-cyan-900/20 to-slate-900 backdrop-blur-xl sm:max-w-[600px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <div className="flex size-10 items-center justify-center rounded-full bg-cyan-500/20">
              <Monitor className="size-5 text-cyan-400" />
            </div>
            Active Sessions
          </DialogTitle>
          <DialogDescription className="text-white/60">
            Manage devices and locations where you're currently logged in
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto max-h-[calc(80vh-200px)] pr-2">
          {/* Current Session */}
          {currentSession && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <h4 className="text-sm font-medium text-white/80">
                Current Session
              </h4>
              <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {getDeviceIcon(currentSession.device)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-white">
                          {currentSession.device}
                        </p>
                        <Badge className="bg-green-500/20 text-green-400 text-xs">
                          Current
                        </Badge>
                      </div>
                      <div className="mt-2 space-y-1 text-sm text-white/60">
                        <div className="flex items-center gap-2">
                          <MapPin className="size-3" />
                          <span>{currentSession.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="size-3" />
                          <span className="font-mono text-xs">
                            {currentSession.ip}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="size-3" />
                          <span>{currentSession.lastActive}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Other Sessions */}
          {otherSessions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-white/80">
                  Other Sessions ({otherSessions.length})
                </h4>
                {otherSessions.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleTerminateAllOther}
                    className="text-red-400 hover:bg-red-500/10 hover:text-red-300 h-7"
                  >
                    Terminate All
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {otherSessions.map((session, index) => (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className="rounded-lg border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getDeviceIcon(session.device)}
                        <div className="flex-1">
                          <p className="font-medium text-white">
                            {session.device}
                          </p>
                          <div className="mt-2 space-y-1 text-sm text-white/60">
                            <div className="flex items-center gap-2">
                              <MapPin className="size-3" />
                              <span>{session.location}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Shield className="size-3" />
                              <span className="font-mono text-xs">
                                {session.ip}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="size-3" />
                              <span>{session.lastActive}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleTerminateSession(session.id)}
                        disabled={terminatingId === session.id}
                        className="text-red-400 hover:bg-red-500/10 hover:text-red-300 ml-2"
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {otherSessions.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Alert className="bg-blue-500/10 border-blue-500/20">
                <Shield className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-blue-200 text-sm">
                  You don't have any other active sessions. You're only logged
                  in on this device.
                </AlertDescription>
              </Alert>
            </motion.div>
          )}

          {/* Security Info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Alert className="bg-amber-500/10 border-amber-500/20">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <AlertDescription className="text-amber-200 text-sm">
                <strong>Security tip:</strong> If you see a session you don't
                recognize, terminate it immediately and change your password.
                This could indicate unauthorized access to your account.
              </AlertDescription>
            </Alert>
          </motion.div>
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
