import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Shield,
  Smartphone,
  Fingerprint,
  Key,
  Monitor,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

interface SecurityTabProps {
  twoFactorEnabled: boolean;
  twoFactorMethod: "sms" | "authenticator" | "push";
  biometricEnabled: boolean;
  biometricType: "fingerprint" | "face" | "none";
  activeSessions: Array<{
    id: string;
    device: string;
    location: string;
    ip: string;
    lastActive: string;
    current: boolean;
  }>;
  loginHistory: Array<{
    id: string;
    device: string;
    location: string;
    ip: string;
    time: string;
    success: boolean;
  }>;
  onEnable2FA: () => void;
  onEnableBiometric: () => void;
  onOpenTwoFactorSetupModal: () => void;
  onOpenBiometricSetupModal: () => void;
  onOpenSessionsModal: () => void;
  onOpenLoginHistoryModal: () => void;
  onChangePassword: () => void;
}

export function SecurityTab({
  twoFactorEnabled,
  twoFactorMethod,
  biometricEnabled,
  biometricType,
  activeSessions,
  loginHistory,
  onEnable2FA,
  onEnableBiometric,
  onOpenTwoFactorSetupModal,
  onOpenBiometricSetupModal,
  onOpenSessionsModal,
  onOpenLoginHistoryModal,
  onChangePassword,
}: SecurityTabProps) {
  const handlePasswordReset = () => {
    toast.info("Password reset email sent");
  };

  const getTwoFactorMethodLabel = () => {
    switch (twoFactorMethod) {
      case "sms":
        return "SMS";
      case "authenticator":
        return "Authenticator App";
      case "push":
        return "Push Notification";
      default:
        return "Not Set";
    }
  };

  const getBiometricTypeLabel = () => {
    switch (biometricType) {
      case "fingerprint":
        return "Fingerprint";
      case "face":
        return "Face ID";
      default:
        return "Not Set";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Security Overview */}
      <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-green-500/20">
            <Shield className="size-6 text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              Security Status
            </h3>
            <p className="text-sm text-white/60">Your account is secure</p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="flex items-center gap-2 rounded-lg bg-white/5 p-3">
            {twoFactorEnabled ? (
              <>
                <CheckCircle2 className="size-5 text-green-400" />
                <span className="text-sm text-white/80">2FA Enabled</span>
              </>
            ) : (
              <>
                <XCircle className="size-5 text-amber-400" />
                <span className="text-sm text-white/80">2FA Disabled</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-white/5 p-3">
            {biometricEnabled ? (
              <>
                <CheckCircle2 className="size-5 text-green-400" />
                <span className="text-sm text-white/80">
                  Biometric Active
                </span>
              </>
            ) : (
              <>
                <XCircle className="size-5 text-amber-400" />
                <span className="text-sm text-white/80">
                  Biometric Disabled
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-white/5 p-3">
            <CheckCircle2 className="size-5 text-green-400" />
            <span className="text-sm text-white/80">
              {activeSessions.length} Active Sessions
            </span>
          </div>
        </div>
      </Card>

      {/* Two-Factor Authentication */}
      <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-blue-500/20">
              <Key className="size-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Two-Factor Authentication
              </h3>
              <p className="text-sm text-white/60">
                Add an extra layer of security to your account
              </p>
            </div>
          </div>
          <Switch checked={twoFactorEnabled} onCheckedChange={onEnable2FA} />
        </div>

        {twoFactorEnabled ? (
          <div className="space-y-3">
            <Alert className="bg-green-500/10 border-green-500/20">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-200">
                Two-factor authentication is enabled using{" "}
                {getTwoFactorMethodLabel()}
              </AlertDescription>
            </Alert>
            <div className="flex items-center justify-between rounded-lg bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <Smartphone className="size-5 text-white/60" />
                <div>
                  <p className="text-sm font-medium text-white">
                    Current Method
                  </p>
                  <p className="text-xs text-white/60">
                    {getTwoFactorMethodLabel()}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={onOpenTwoFactorSetupModal}
                className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                <Settings className="mr-2 size-3" />
                Configure
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Alert className="bg-amber-500/10 border-amber-500/20">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <AlertDescription className="text-amber-200">
                Your account is not protected by two-factor authentication.
                Enable it now for better security.
              </AlertDescription>
            </Alert>
            <Button
              onClick={onOpenTwoFactorSetupModal}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Key className="mr-2 size-4" />
              Set Up Two-Factor Authentication
            </Button>
          </div>
        )}
      </Card>

      {/* Biometric Login */}
      <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-purple-500/20">
              <Fingerprint className="size-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Biometric Login
              </h3>
              <p className="text-sm text-white/60">
                Use fingerprint or face recognition to log in
              </p>
            </div>
          </div>
          <Switch
            checked={biometricEnabled}
            onCheckedChange={onEnableBiometric}
          />
        </div>

        {biometricEnabled ? (
          <div className="space-y-3">
            <Alert className="bg-green-500/10 border-green-500/20">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-200">
                Biometric login is enabled using {getBiometricTypeLabel()}
              </AlertDescription>
            </Alert>
            <div className="flex items-center justify-between rounded-lg bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <Fingerprint className="size-5 text-white/60" />
                <div>
                  <p className="text-sm font-medium text-white">
                    Current Method
                  </p>
                  <p className="text-xs text-white/60">
                    {getBiometricTypeLabel()}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={onOpenBiometricSetupModal}
                className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                <Settings className="mr-2 size-3" />
                Configure
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-white/60">
              Enable biometric authentication for quick and secure access to
              your account on supported devices.
            </p>
            <Button
              onClick={onOpenBiometricSetupModal}
              variant="outline"
              className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20"
            >
              <Fingerprint className="mr-2 size-4" />
              Set Up Biometric Login
            </Button>
          </div>
        )}
      </Card>

      {/* Password Management */}
      <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-amber-500/20">
            <Lock className="size-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">
              Password Management
            </h3>
            <p className="text-sm text-white/60">
              Change or reset your account password
            </p>
          </div>
        </div>
        <div className="space-y-2">
          <Button
            onClick={onChangePassword}
            variant="outline"
            className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20"
          >
            <Lock className="mr-2 size-4" />
            Change Password
          </Button>
          <Button
            onClick={handlePasswordReset}
            variant="ghost"
            className="w-full text-white/60 hover:bg-white/10"
          >
            Reset Password via Email
          </Button>
        </div>
      </Card>

      {/* Active Sessions */}
      <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-cyan-500/20">
              <Monitor className="size-5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Active Sessions
              </h3>
              <p className="text-sm text-white/60">
                {activeSessions.length} active{" "}
                {activeSessions.length === 1 ? "session" : "sessions"}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenSessionsModal}
            className="border-white/20 bg-white/10 text-white hover:bg-white/20"
          >
            View All
          </Button>
        </div>
        <div className="space-y-2">
          {activeSessions.slice(0, 2).map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between rounded-lg bg-white/5 p-3"
            >
              <div className="flex items-center gap-3">
                <Monitor className="size-4 text-white/40" />
                <div>
                  <p className="text-sm font-medium text-white">
                    {session.device}
                    {session.current && (
                      <Badge className="ml-2 bg-green-500/20 text-green-400 text-xs">
                        Current
                      </Badge>
                    )}
                  </p>
                  <p className="text-xs text-white/60">
                    {session.location} • {session.lastActive}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Login History */}
      <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-indigo-500/20">
              <Clock className="size-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                Login History
              </h3>
              <p className="text-sm text-white/60">
                Recent login attempts to your account
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={onOpenLoginHistoryModal}
            className="border-white/20 bg-white/10 text-white hover:bg-white/20"
          >
            View All
          </Button>
        </div>
        <div className="space-y-2">
          {loginHistory.slice(0, 3).map((login) => (
            <div
              key={login.id}
              className="flex items-center justify-between rounded-lg bg-white/5 p-3"
            >
              <div className="flex items-center gap-3">
                {login.success ? (
                  <CheckCircle2 className="size-4 text-green-400" />
                ) : (
                  <XCircle className="size-4 text-red-400" />
                )}
                <div>
                  <p className="text-sm font-medium text-white">
                    {login.device}
                  </p>
                  <p className="text-xs text-white/60">
                    {login.location} • {login.time}
                  </p>
                </div>
              </div>
              <Badge
                className={
                  login.success
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }
              >
                {login.success ? "Success" : "Failed"}
              </Badge>
            </div>
          ))}
        </div>
      </Card>

      {/* Security Recommendations */}
      <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="mb-4 flex items-center gap-3">
          <AlertTriangle className="size-5 text-amber-400" />
          <h3 className="text-lg font-semibold text-white">
            Security Recommendations
          </h3>
        </div>
        <ul className="space-y-2 text-sm text-white/60">
          {!twoFactorEnabled && (
            <li className="flex items-start gap-2">
              <span className="mt-1 size-1.5 rounded-full bg-amber-400" />
              <span>Enable two-factor authentication for enhanced security</span>
            </li>
          )}
          {!biometricEnabled && (
            <li className="flex items-start gap-2">
              <span className="mt-1 size-1.5 rounded-full bg-amber-400" />
              <span>Set up biometric login for convenient access</span>
            </li>
          )}
          <li className="flex items-start gap-2">
            <span className="mt-1 size-1.5 rounded-full bg-blue-400" />
            <span>Change your password regularly (every 90 days)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 size-1.5 rounded-full bg-blue-400" />
            <span>Review your active sessions and login history regularly</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 size-1.5 rounded-full bg-blue-400" />
            <span>Never share your password or verification codes</span>
          </li>
        </ul>
      </Card>
    </motion.div>
  );
}
