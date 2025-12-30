import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  User,
  Building,
  Download,
  Lock,
  Mail,
  Phone,
  MapPin,
  Edit,
  Camera,
  CheckCircle2,
  Upload,
  AlertCircle,
  Copy,
  Eye,
  EyeOff,
} from "lucide-react";
import { FINBANK_ROUTING_NUMBER } from "@/lib/seed";
import {
  maskAccountNumber,
  formatRoutingNumber,
} from "@/lib/banking-utils";
import { toast } from "sonner";

interface AccountTabProps {
  currentUser: any;
  profilePhotoUploaded: boolean;
  profilePhotoUrl: string;
  isUploadingPhoto: boolean;
  kycData: any;
  profileData: any;
  secondaryEmail: string;
  secondaryPhone: string;
  pendingAddressChange: any;
  showAccountNumber: boolean;
  setShowAccountNumber: (show: boolean) => void;
  onOpenProfilePictureModal: () => void;
  onOpenSecondaryContactModal: () => void;
  onOpenAddressChangeModal: () => void;
  onOpenDirectDepositModal: () => void;
}

export function AccountTab({
  currentUser,
  profilePhotoUploaded,
  profilePhotoUrl,
  kycData,
  profileData,
  secondaryEmail,
  secondaryPhone,
  pendingAddressChange,
  showAccountNumber,
  setShowAccountNumber,
  onOpenProfilePictureModal,
  onOpenSecondaryContactModal,
  onOpenAddressChangeModal,
  onOpenDirectDepositModal,
}: AccountTabProps) {
  if (!currentUser) return null;

  const accountNumber = currentUser.account.id;
  const accountType =
    kycData?.primaryAccountType ||
    currentUser?.accounts?.[0]?.accountType?.toLowerCase?.() ||
    "checking";

  const handleCopyAccountNumber = () => {
    navigator.clipboard.writeText(accountNumber);
    toast.success("Account number copied to clipboard");
  };

  const handleCopyRoutingNumber = () => {
    navigator.clipboard.writeText(FINBANK_ROUTING_NUMBER);
    toast.success("Routing number copied to clipboard");
  };

  const handleDownloadStatement = () => {
    toast.success("Statement download started");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      {/* Profile Picture - One-time upload only */}
      <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <div className="relative">
            {profilePhotoUrl ? (
              <img
                src={profilePhotoUrl}
                alt="Profile"
                loading="lazy"
                className="size-24 rounded-full object-cover border-2 border-white/20"
              />
            ) : (
              <div className="flex size-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-3xl font-bold text-white">
                {currentUser.user.full_name.charAt(0)}
              </div>
            )}
            {!profilePhotoUploaded && (
              <Button
                size="sm"
                onClick={onOpenProfilePictureModal}
                aria-label="Upload profile photo"
                className="absolute -bottom-1 -right-1 size-8 rounded-full bg-white/20 p-0 hover:bg-white/30"
              >
                <Camera className="size-4" />
              </Button>
            )}
            {profilePhotoUploaded && (
              <div className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-green-500">
                <CheckCircle2 className="size-4 text-white" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white">
              {currentUser.user.full_name}
            </h3>
            <p className="text-sm text-white/60">Member since January 2024</p>
            <Badge className="mt-1 bg-blue-500/20 text-blue-400">
              {accountType === "checking"
                ? "Personal Checking"
                : accountType === "joint"
                  ? "Joint Account"
                  : "Business Elite"}
            </Badge>
            {profilePhotoUploaded ? (
              <p className="mt-2 text-xs text-white/40 flex items-center">
                <Lock className="size-3 mr-1" />
                Profile photo is permanently set
              </p>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenProfilePictureModal}
                className="mt-2 border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                <Upload className="mr-2 size-3" />
                Upload Photo (One-time only)
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Personal Information - Primary info is immutable */}
      <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center text-lg font-semibold text-white">
            <User className="mr-2 size-5" />
            Personal Information
          </h3>
          <Badge
            variant="outline"
            className="border-amber-500/30 text-amber-400"
          >
            <Lock className="size-3 mr-1" />
            Verified
          </Badge>
        </div>
        <div className="space-y-4">
          {/* Immutable Fields */}
          <div>
            <div className="flex items-center gap-2">
              <Label className="text-white/60">Full Name</Label>
              <Badge
                variant="outline"
                className="text-xs border-white/20 text-white/40"
              >
                Cannot be changed
              </Badge>
            </div>
            <div className="mt-1 text-lg text-white flex items-center">
              {currentUser.user.full_name}
              <Lock className="ml-2 size-3 text-white/30" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Label className="text-white/60">Primary Email</Label>
              <Badge
                variant="outline"
                className="text-xs border-white/20 text-white/40"
              >
                Cannot be changed
              </Badge>
            </div>
            <div className="mt-1 flex items-center text-lg text-white">
              <Mail className="mr-2 size-4 text-white/40" />
              {currentUser.user.email}
              <Lock className="ml-2 size-3 text-white/30" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Label className="text-white/60">Primary Phone</Label>
              <Badge
                variant="outline"
                className="text-xs border-white/20 text-white/40"
              >
                Cannot be changed
              </Badge>
            </div>
            <div className="mt-1 flex items-center text-lg text-white">
              <Phone className="mr-2 size-4 text-white/40" />
              {kycData?.phoneNumber || profileData.phone}
              <Lock className="ml-2 size-3 text-white/30" />
            </div>
          </div>

          {/* Secondary Contact - Editable */}
          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-white/80">
                Secondary Contact Information
              </h4>
              <Button
                size="sm"
                variant="ghost"
                onClick={onOpenSecondaryContactModal}
                className="text-blue-400 hover:bg-blue-500/20 h-7"
              >
                <Edit className="mr-1 size-3" />
                Edit
              </Button>
            </div>
            {secondaryEmail || secondaryPhone ? (
              <div className="space-y-2">
                {secondaryEmail && (
                  <div className="flex items-center text-white/80">
                    <Mail className="mr-2 size-4 text-white/40" />
                    {secondaryEmail}
                    <Badge className="ml-2 text-xs bg-green-500/20 text-green-400">
                      Secondary
                    </Badge>
                  </div>
                )}
                {secondaryPhone && (
                  <div className="flex items-center text-white/80">
                    <Phone className="mr-2 size-4 text-white/40" />
                    {secondaryPhone}
                    <Badge className="ml-2 text-xs bg-green-500/20 text-green-400">
                      Secondary
                    </Badge>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-white/40">
                No secondary contact information added
              </p>
            )}
          </div>

          {/* Address - Requires verification to change */}
          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Label className="text-white/60">Address</Label>
                <Badge
                  variant="outline"
                  className="text-xs border-white/20 text-white/40"
                >
                  Requires verification
                </Badge>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={onOpenAddressChangeModal}
                className="text-blue-400 hover:bg-blue-500/20 h-7"
                disabled={!!pendingAddressChange}
              >
                <MapPin className="mr-1 size-3" />
                Change
              </Button>
            </div>
            <div className="flex items-center text-lg text-white">
              <MapPin className="mr-2 size-4 text-white/40" />
              {kycData
                ? `${kycData.streetAddress}, ${kycData.city}, ${kycData.state} ${kycData.zipCode}`
                : profileData.address}
            </div>
            {pendingAddressChange && (
              <Alert className="mt-3 bg-amber-500/10 border-amber-500/20">
                <AlertCircle className="h-4 w-4 text-amber-400" />
                <AlertDescription className="text-amber-200">
                  Address change request pending review. New address:{" "}
                  {pendingAddressChange.streetAddress},{" "}
                  {pendingAddressChange.city}, {pendingAddressChange.state}{" "}
                  {pendingAddressChange.zipCode}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </Card>

      {/* Account Details */}
      <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <h3 className="mb-4 flex items-center text-lg font-semibold text-white">
          <Building className="mr-2 size-5" />
          Account Details
        </h3>
        <div className="space-y-4">
          <div>
            <Label className="text-white/60">Account Type</Label>
            <div className="mt-1 text-lg capitalize text-white">
              {currentUser.account.account_type}
            </div>
          </div>
          <div>
            <Label className="text-white/60">Routing Number</Label>
            <div className="mt-1 flex items-center justify-between">
              <span className="font-mono text-lg text-white">
                {formatRoutingNumber(FINBANK_ROUTING_NUMBER)}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopyRoutingNumber}
                className="text-blue-400 hover:bg-blue-500/20"
              >
                <Copy className="size-4" />
              </Button>
            </div>
          </div>
          <div>
            <Label className="text-white/60">Account Number</Label>
            <div className="mt-1 flex items-center justify-between">
              <span className="font-mono text-lg text-white">
                {showAccountNumber
                  ? accountNumber
                  : maskAccountNumber(accountNumber)}
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowAccountNumber(!showAccountNumber)}
                  className="text-white/60 hover:bg-white/10"
                >
                  {showAccountNumber ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopyAccountNumber}
                  className="text-blue-400 hover:bg-blue-500/20"
                >
                  <Copy className="size-4" />
                </Button>
              </div>
            </div>
          </div>
          <div>
            <Button
              onClick={handleDownloadStatement}
              variant="outline"
              className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20"
            >
              <Download className="mr-2 size-4" />
              Download Statement
            </Button>
          </div>
        </div>
      </Card>

      {/* Direct Deposit */}
      <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <h3 className="mb-4 flex items-center text-lg font-semibold text-white">
          <Download className="mr-2 size-5" />
          Direct Deposit Information
        </h3>
        <p className="mb-4 text-sm text-white/60">
          Set up direct deposit with your employer for faster access to your
          funds
        </p>
        <Button
          variant="outline"
          onClick={onOpenDirectDepositModal}
          className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20"
        >
          View Direct Deposit Form
        </Button>
      </Card>
    </motion.div>
  );
}
