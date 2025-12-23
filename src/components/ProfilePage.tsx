import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DirectDepositModal } from "@/components/DirectDepositModal";
import { CardManagementModal } from "@/components/CardManagementModal";
import { getKYCData, saveKYCData, uploadDocument, type PrimaryAccountType } from "@/lib/kyc-storage";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  User,
  Shield,
  Bell,
  Download,
  CreditCard,
  Building,
  Lock,
  Smartphone,
  AlertCircle,
  CheckCircle2,
  FileText,
  HelpCircle,
  LogOut,
  Copy,
  Eye,
  EyeOff,
  Mail,
  Phone,
  MapPin,
  Upload,
  Link2,
  UserPlus,
  Settings,
  TrendingUp,
  DollarSign,
  Zap,
  Monitor,
  Globe,
  Calendar,
  Edit,
  Camera,
  Trash2,
  PieChart,
  BarChart3,
  Target,
  Wallet,
  Send,
  Clock,
  Plane,
} from "lucide-react";
import { FINBANK_ROUTING_NUMBER } from "@/lib/seed";
import { maskAccountNumber, formatRoutingNumber, generateMockCreditScore } from "@/lib/banking-utils";
import { Textarea } from "@/components/ui/textarea";

export function ProfilePage() {
  const { currentUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("account");
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [showCreditScore, setShowCreditScore] = useState(false);
  const [creditScore] = useState(generateMockCreditScore());

  // Profile editing
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    phone: "+1-555-0101",
    address: "123 Main St, New York, NY 10001",
    email: currentUser?.user.email || "",
  });
  const [showProfilePictureModal, setShowProfilePictureModal] = useState(false);

  // Profile restrictions state
  const [kycData, setKycData] = useState(() => currentUser ? getKYCData(currentUser.user.id) : null);
  const [secondaryEmail, setSecondaryEmail] = useState(kycData?.secondaryEmail || "");
  const [secondaryPhone, setSecondaryPhone] = useState(kycData?.secondaryPhone || "");
  const [showSecondaryContactModal, setShowSecondaryContactModal] = useState(false);

  // Profile photo upload (one-time only)
  const [profilePhotoUploaded, setProfilePhotoUploaded] = useState(kycData?.profilePhotoUploaded || false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(kycData?.profilePhotoUrl || "");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Address change verification
  const [showAddressChangeModal, setShowAddressChangeModal] = useState(false);
  const [newAddressData, setNewAddressData] = useState({
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
  });
  const [addressVerificationDoc, setAddressVerificationDoc] = useState<File | null>(null);
  const [pendingAddressChange, setPendingAddressChange] = useState(kycData?.pendingAddressChange || null);

  // Biometric and 2FA enhancements
  const [twoFactorMethod, setTwoFactorMethod] = useState<"sms" | "authenticator" | "push">("sms");
  const [showBiometricSetupModal, setShowBiometricSetupModal] = useState(false);
  const [show2FASetupModal, setShow2FASetupModal] = useState(false);
  const [biometricType, setBiometricType] = useState<"fingerprint" | "face" | "none">("none");

  // Reload KYC data
  useEffect(() => {
    if (currentUser) {
      const data = getKYCData(currentUser.user.id);
      setKycData(data);
      setProfilePhotoUploaded(data?.profilePhotoUploaded || false);
      setProfilePhotoUrl(data?.profilePhotoUrl || "");
      setSecondaryEmail(data?.secondaryEmail || "");
      setSecondaryPhone(data?.secondaryPhone || "");
      setPendingAddressChange(data?.pendingAddressChange || null);
    }
  }, [currentUser]);

  const accountType: PrimaryAccountType = kycData?.primaryAccountType || "checking";

  // Security - Session Management
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [activeSessions] = useState([
    { id: "1", device: "iPhone 14 Pro", location: "New York, NY", ip: "192.168.1.100", lastActive: "Just now", current: true },
    { id: "2", device: "Chrome on Windows", location: "New York, NY", ip: "192.168.1.101", lastActive: "2 hours ago", current: false },
    { id: "3", device: "Safari on MacBook", location: "New York, NY", ip: "192.168.1.102", lastActive: "1 day ago", current: false },
  ]);

  // Security - Login History
  const [showLoginHistoryModal, setShowLoginHistoryModal] = useState(false);
  const [loginHistory] = useState([
    { id: "1", device: "iPhone 14 Pro", location: "New York, NY", ip: "192.168.1.100", time: "2024-01-15 10:30 AM", success: true },
    { id: "2", device: "Chrome on Windows", location: "New York, NY", ip: "192.168.1.101", time: "2024-01-14 3:45 PM", success: true },
    { id: "3", device: "Unknown Device", location: "Los Angeles, CA", ip: "203.0.113.42", time: "2024-01-13 11:20 PM", success: false },
    { id: "4", device: "Safari on MacBook", location: "New York, NY", ip: "192.168.1.102", time: "2024-01-13 9:15 AM", success: true },
  ]);

  // Overdraft Protection
  const [overdraftEnabled, setOverdraftEnabled] = useState(false);
  const [linkedSavingsForOverdraft, setLinkedSavingsForOverdraft] = useState("");

  // External Accounts
  const [showLinkAccountModal, setShowLinkAccountModal] = useState(false);
  const [externalAccounts, setExternalAccounts] = useState<Array<{
    id: string;
    bankName: string;
    accountType: string;
    lastFour: string;
    status: "active" | "pending" | "verification";
  }>>([]);

  // Limit Upgrade
  const [showLimitUpgradeModal, setShowLimitUpgradeModal] = useState(false);
  const [idDocument, setIdDocument] = useState<File | null>(null);

  // Direct Deposit
  const [showDirectDepositModal, setShowDirectDepositModal] = useState(false);

  // Card Management
  const [showCardManagementModal, setShowCardManagementModal] = useState(false);

  // Account Nickname
  const [showAccountNicknameModal, setShowAccountNicknameModal] = useState(false);
  const [accountNickname, setAccountNickname] = useState("Primary Checking");

  // Travel Notification
  const [showTravelNotificationModal, setShowTravelNotificationModal] = useState(false);
  const [travelNotifications] = useState([
    { id: "1", destination: "Paris, France", startDate: "2024-02-01", endDate: "2024-02-10", status: "active" },
  ]);

  // Wire Transfer Setup
  const [showWireTransferModal, setShowWireTransferModal] = useState(false);

  // Notification Preferences (detailed)
  const [notificationPreferences, setNotificationPreferences] = useState({
    transactions: { email: true, push: true, sms: false },
    security: { email: true, push: true, sms: true },
    billPay: { email: true, push: false, sms: false },
    deposits: { email: true, push: true, sms: false },
    marketing: { email: false, push: false, sms: false },
  });

  // Spending Analytics
  const [showSpendingAnalyticsModal, setShowSpendingAnalyticsModal] = useState(false);
  const [spendingData] = useState([
    { category: "Groceries", amount: 450, percentage: 25 },
    { category: "Dining", amount: 320, percentage: 18 },
    { category: "Transportation", amount: 280, percentage: 16 },
    { category: "Utilities", amount: 240, percentage: 13 },
    { category: "Entertainment", amount: 200, percentage: 11 },
    { category: "Shopping", amount: 180, percentage: 10 },
    { category: "Other", amount: 130, percentage: 7 },
  ]);

  // Budgeting
  const [showBudgetingModal, setShowBudgetingModal] = useState(false);
  const [budgets] = useState([
    { category: "Groceries", limit: 500, spent: 450, percentage: 90 },
    { category: "Dining", limit: 300, spent: 320, percentage: 107 },
    { category: "Transportation", limit: 250, spent: 280, percentage: 112 },
  ]);

  if (!currentUser) return null;

  const accountNumber = currentUser.account.id;

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
    // In a real app, this would download a PDF
  };

  const handleEnable2FA = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
    toast.success(twoFactorEnabled ? "2FA disabled" : "2FA enabled");
  };

  const handleEnableBiometric = () => {
    setBiometricEnabled(!biometricEnabled);
    toast.success(biometricEnabled ? "Biometric login disabled" : "Biometric login enabled");
  };

  // Handle profile photo upload (one-time only)
  const handleProfilePhotoUpload = async (file: File) => {
    if (profilePhotoUploaded) {
      toast.error("Profile photo can only be uploaded once");
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const photoUrl = await uploadDocument(file);
      saveKYCData(currentUser!.user.id, {
        profilePhotoUploaded: true,
        profilePhotoUrl: photoUrl,
        profilePhotoUploadedAt: new Date().toISOString(),
      });
      setProfilePhotoUploaded(true);
      setProfilePhotoUrl(photoUrl);
      setShowProfilePictureModal(false);
      toast.success("Profile photo uploaded successfully. This cannot be changed.");
    } catch (error) {
      toast.error("Failed to upload profile photo");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Handle secondary contact info save
  const handleSaveSecondaryContact = () => {
    if (!currentUser) return;
    saveKYCData(currentUser.user.id, {
      secondaryEmail,
      secondaryPhone,
    });
    setShowSecondaryContactModal(false);
    toast.success("Secondary contact information saved");
  };

  // Handle address change request
  const handleSubmitAddressChange = async () => {
    if (!currentUser) return;

    if (!newAddressData.streetAddress || !newAddressData.city || !newAddressData.state || !newAddressData.zipCode) {
      toast.error("Please fill in all address fields");
      return;
    }

    if (!addressVerificationDoc) {
      toast.error("Please upload a verification document (utility bill, ID, etc.)");
      return;
    }

    try {
      const docUrl = await uploadDocument(addressVerificationDoc);
      const pendingChange = {
        ...newAddressData,
        verificationDocumentUrl: docUrl,
        requestedAt: new Date().toISOString(),
        status: "pending" as const,
      };

      saveKYCData(currentUser.user.id, {
        pendingAddressChange: pendingChange,
      });

      setPendingAddressChange(pendingChange);
      setShowAddressChangeModal(false);
      setNewAddressData({
        streetAddress: "",
        city: "",
        state: "",
        zipCode: "",
        country: "United States",
      });
      setAddressVerificationDoc(null);
      toast.success("Address change request submitted for review");
    } catch (error) {
      toast.error("Failed to submit address change request");
    }
  };

  // Handle 2FA setup with method selection
  const handleSetup2FA = () => {
    setTwoFactorEnabled(true);
    setShow2FASetupModal(false);
    toast.success(`Two-factor authentication enabled via ${twoFactorMethod.toUpperCase()}`);
  };

  // Handle biometric setup
  const handleSetupBiometric = () => {
    setBiometricEnabled(true);
    setShowBiometricSetupModal(false);
    toast.success(`Biometric login enabled using ${biometricType === "face" ? "Face ID" : "Fingerprint"}`);
  };

  return (
    <div className="min-h-screen p-4 pt-6">
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Profile & Settings</h1>
            <p className="text-white/60">Manage your account and preferences</p>
          </div>
          <Button
            onClick={logout}
            variant="outline"
            className="border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20"
          >
            <LogOut className="mr-2 size-4" />
            Logout
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="overflow-x-auto">
            <TabsList className="inline-flex w-full min-w-max bg-white/5">
              <TabsTrigger value="account" className="data-[state=active]:bg-white/20">
                <User className="mr-2 size-4" />
                Account
              </TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:bg-white/20">
                <Shield className="mr-2 size-4" />
                Security
              </TabsTrigger>
              <TabsTrigger value="services" className="data-[state=active]:bg-white/20">
                <Settings className="mr-2 size-4" />
                Services
              </TabsTrigger>
              <TabsTrigger value="notifications" className="data-[state=active]:bg-white/20">
                <Bell className="mr-2 size-4" />
                Alerts
              </TabsTrigger>
              <TabsTrigger value="tools" className="data-[state=active]:bg-white/20">
                <FileText className="mr-2 size-4" />
                Tools
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Account Tab */}
          <TabsContent value="account" className="space-y-4">
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
                        onClick={() => setShowProfilePictureModal(true)}
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
                    <h3 className="text-xl font-bold text-white">{currentUser.user.full_name}</h3>
                    <p className="text-sm text-white/60">Member since January 2024</p>
                    <Badge className="mt-1 bg-blue-500/20 text-blue-400">
                      {accountType === "checking" ? "Personal Checking" : accountType === "joint" ? "Joint Account" : "Business Elite"}
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
                        onClick={() => setShowProfilePictureModal(true)}
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
                  <Badge variant="outline" className="border-amber-500/30 text-amber-400">
                    <Lock className="size-3 mr-1" />
                    Verified
                  </Badge>
                </div>
                <div className="space-y-4">
                  {/* Immutable Fields */}
                  <div>
                    <div className="flex items-center gap-2">
                      <Label className="text-white/60">Full Name</Label>
                      <Badge variant="outline" className="text-xs border-white/20 text-white/40">Cannot be changed</Badge>
                    </div>
                    <div className="mt-1 text-lg text-white flex items-center">
                      {currentUser.user.full_name}
                      <Lock className="ml-2 size-3 text-white/30" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Label className="text-white/60">Primary Email</Label>
                      <Badge variant="outline" className="text-xs border-white/20 text-white/40">Cannot be changed</Badge>
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
                      <Badge variant="outline" className="text-xs border-white/20 text-white/40">Cannot be changed</Badge>
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
                      <h4 className="text-sm font-medium text-white/80">Secondary Contact Information</h4>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowSecondaryContactModal(true)}
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
                            <Badge className="ml-2 text-xs bg-green-500/20 text-green-400">Secondary</Badge>
                          </div>
                        )}
                        {secondaryPhone && (
                          <div className="flex items-center text-white/80">
                            <Phone className="mr-2 size-4 text-white/40" />
                            {secondaryPhone}
                            <Badge className="ml-2 text-xs bg-green-500/20 text-green-400">Secondary</Badge>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-white/40">No secondary contact information added</p>
                    )}
                  </div>

                  {/* Address - Requires verification to change */}
                  <div className="pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Label className="text-white/60">Address</Label>
                        <Badge variant="outline" className="text-xs border-white/20 text-white/40">Requires verification</Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setShowAddressChangeModal(true)}
                        className="text-blue-400 hover:bg-blue-500/20 h-7"
                        disabled={!!pendingAddressChange}
                      >
                        <MapPin className="mr-1 size-3" />
                        Change
                      </Button>
                    </div>
                    <div className="flex items-center text-lg text-white">
                      <MapPin className="mr-2 size-4 text-white/40" />
                      {kycData ? `${kycData.streetAddress}, ${kycData.city}, ${kycData.state} ${kycData.zipCode}` : profileData.address}
                    </div>
                    {pendingAddressChange && (
                      <Alert className="mt-3 bg-amber-500/10 border-amber-500/20">
                        <AlertCircle className="h-4 w-4 text-amber-400" />
                        <AlertDescription className="text-amber-200">
                          Address change request pending review. New address: {pendingAddressChange.streetAddress}, {pendingAddressChange.city}, {pendingAddressChange.state} {pendingAddressChange.zipCode}
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
                        {showAccountNumber ? accountNumber : maskAccountNumber(accountNumber)}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowAccountNumber(!showAccountNumber)}
                          className="text-white/60 hover:bg-white/10"
                        >
                          {showAccountNumber ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
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
                </div>
              </Card>

              {/* Direct Deposit */}
              <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <h3 className="mb-4 flex items-center text-lg font-semibold text-white">
                  <Download className="mr-2 size-5" />
                  Direct Deposit
                </h3>
                <p className="mb-4 text-sm text-white/60">
                  Set up direct deposit with your employer
                </p>
                <Button
                  variant="outline"
                  onClick={() => setShowDirectDepositModal(true)}
                  className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20"
                >
                  Setup Direct Deposit
                </Button>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Two-Factor Authentication */}
              <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="mb-2 flex items-center text-lg font-semibold text-white">
                      <Shield className="mr-2 size-5" />
                      Two-Factor Authentication
                    </h3>
                    <p className="text-sm text-white/60">
                      Add an extra layer of security to your account
                    </p>
                    {twoFactorEnabled && (
                      <Badge className="mt-2 bg-blue-500/20 text-blue-400">
                        {twoFactorMethod === "sms" ? "SMS" : twoFactorMethod === "authenticator" ? "Authenticator App" : "Push Notifications"}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!twoFactorEnabled && (
                      <Button
                        size="sm"
                        onClick={() => setShow2FASetupModal(true)}
                        className="bg-gradient-to-r from-blue-500 to-purple-500"
                      >
                        Set Up
                      </Button>
                    )}
                    <Switch
                      checked={twoFactorEnabled}
                      onCheckedChange={(checked) => {
                        if (checked && !twoFactorEnabled) {
                          setShow2FASetupModal(true);
                        } else {
                          setTwoFactorEnabled(false);
                          toast.success("2FA disabled");
                        }
                      }}
                    />
                  </div>
                </div>
                {twoFactorEnabled && (
                  <div className="mt-4 rounded-lg bg-green-500/10 p-3">
                    <p className="flex items-center text-sm text-green-400">
                      <CheckCircle2 className="mr-2 size-4" />
                      2FA is enabled via {twoFactorMethod === "sms" ? "SMS" : twoFactorMethod === "authenticator" ? "Authenticator App" : "Push Notifications"}
                    </p>
                  </div>
                )}
              </Card>

              {/* Biometric Login */}
              <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="mb-2 flex items-center text-lg font-semibold text-white">
                      <Smartphone className="mr-2 size-5" />
                      Biometric Login
                    </h3>
                    <p className="text-sm text-white/60">
                      Use your device's native biometric capabilities (Face ID, fingerprint)
                    </p>
                    {biometricEnabled && (
                      <Badge className="mt-2 bg-green-500/20 text-green-400">
                        {biometricType === "face" ? "Face ID" : "Fingerprint"}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!biometricEnabled && (
                      <Button
                        size="sm"
                        onClick={() => setShowBiometricSetupModal(true)}
                        className="bg-gradient-to-r from-blue-500 to-purple-500"
                      >
                        Set Up
                      </Button>
                    )}
                    <Switch
                      checked={biometricEnabled}
                      onCheckedChange={(checked) => {
                        if (checked && !biometricEnabled) {
                          setShowBiometricSetupModal(true);
                        } else {
                          setBiometricEnabled(false);
                          setBiometricType("none");
                          toast.success("Biometric login disabled");
                        }
                      }}
                    />
                  </div>
                </div>
                {biometricEnabled && (
                  <div className="mt-4 rounded-lg bg-green-500/10 p-3">
                    <p className="flex items-center text-sm text-green-400">
                      <CheckCircle2 className="mr-2 size-4" />
                      {biometricType === "face" ? "Face ID" : "Fingerprint"} authentication enabled
                    </p>
                  </div>
                )}
              </Card>

              {/* Change Password */}
              <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <h3 className="mb-4 flex items-center text-lg font-semibold text-white">
                  <Lock className="mr-2 size-5" />
                  Change Password
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label className="text-white/60">Current Password</Label>
                    <Input
                      type="password"
                      placeholder="Enter current password"
                      className="mt-1 border-white/20 bg-white/10 text-white placeholder:text-white/40"
                    />
                  </div>
                  <div>
                    <Label className="text-white/60">New Password</Label>
                    <Input
                      type="password"
                      placeholder="Enter new password"
                      className="mt-1 border-white/20 bg-white/10 text-white placeholder:text-white/40"
                    />
                  </div>
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-500">
                    Update Password
                  </Button>
                </div>
              </Card>

              {/* Active Sessions */}
              <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <h3 className="mb-4 flex items-center text-lg font-semibold text-white">
                  <Monitor className="mr-2 size-5" />
                  Active Sessions
                </h3>
                <p className="mb-4 text-sm text-white/60">
                  {activeSessions.length} active device{activeSessions.length !== 1 ? 's' : ''} logged into your account
                </p>
                <div className="mb-4 space-y-2">
                  {activeSessions.slice(0, 2).map((session) => (
                    <Card key={session.id} className="border-white/10 bg-white/10 p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-white">{session.device}</p>
                            {session.current && (
                              <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">Current</span>
                            )}
                          </div>
                          <p className="text-xs text-white/60">{session.location} • {session.lastActive}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowSessionsModal(true)}
                  className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20"
                >
                  Manage All Sessions
                </Button>
              </Card>

              {/* Login History */}
              <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <h3 className="mb-4 flex items-center text-lg font-semibold text-white">
                  <Clock className="mr-2 size-5" />
                  Login History
                </h3>
                <p className="mb-4 text-sm text-white/60">
                  Review recent login attempts to your account
                </p>
                <div className="mb-4 space-y-2">
                  {loginHistory.slice(0, 2).map((login) => (
                    <Card key={login.id} className="border-white/10 bg-white/10 p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-white">{login.device}</p>
                            {login.success ? (
                              <CheckCircle2 className="size-4 text-green-400" />
                            ) : (
                              <AlertCircle className="size-4 text-red-400" />
                            )}
                          </div>
                          <p className="text-xs text-white/60">{login.location} • {login.time}</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowLoginHistoryModal(true)}
                  className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20"
                >
                  View Full History
                </Button>
              </Card>

              {/* Fraud Alerts */}
              <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <h3 className="mb-4 flex items-center text-lg font-semibold text-white">
                  <AlertCircle className="mr-2 size-5" />
                  Fraud Monitoring
                </h3>
                <div className="rounded-lg bg-green-500/10 p-4">
                  <p className="flex items-center text-sm text-green-400">
                    <CheckCircle2 className="mr-2 size-4" />
                    Your account is actively monitored for suspicious activity
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="mt-4 w-full border-white/20 bg-white/10 text-white hover:bg-white/20"
                >
                  Report Suspicious Activity
                </Button>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Overdraft Protection */}
              <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="mb-2 flex items-center text-lg font-semibold text-white">
                      <Shield className="mr-2 size-5" />
                      Overdraft Protection
                    </h3>
                    <p className="text-sm text-white/60">
                      Automatically transfer funds from savings to cover overdrafts
                    </p>
                  </div>
                  <Switch
                    checked={overdraftEnabled}
                    onCheckedChange={(checked) => {
                      setOverdraftEnabled(checked);
                      toast.success(
                        checked ? "Overdraft protection enabled" : "Overdraft protection disabled"
                      );
                    }}
                    className="ml-4"
                  />
                </div>
                {overdraftEnabled && (
                  <div className="mt-4 space-y-3">
                    <Label className="text-white/80">Link Account for Overdraft</Label>
                    <Select
                      value={linkedSavingsForOverdraft}
                      onValueChange={setLinkedSavingsForOverdraft}
                    >
                      <SelectTrigger className="border-white/20 bg-white/10 text-white">
                        <SelectValue placeholder="Select account to link" />
                      </SelectTrigger>
                      <SelectContent className="border-white/20 bg-slate-900 text-white">
                        <SelectItem value="savings1">Savings Account (...4321)</SelectItem>
                        <SelectItem value="savings2">High-Yield Savings (...8765)</SelectItem>
                      </SelectContent>
                    </Select>
                    {linkedSavingsForOverdraft && (
                      <div className="rounded-lg bg-green-500/10 p-3">
                        <p className="flex items-center text-sm text-green-400">
                          <CheckCircle2 className="mr-2 size-4" />
                          Overdraft protection is active
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Card>

              {/* External Account Linking */}
              <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <h3 className="mb-4 flex items-center text-lg font-semibold text-white">
                  <Link2 className="mr-2 size-5" />
                  External Account Linking
                </h3>
                <p className="mb-4 text-sm text-white/60">
                  Link accounts from other banks for easy transfers and balance viewing
                </p>
                <div className="mb-4 space-y-2">
                  {externalAccounts.length === 0 ? (
                    <div className="rounded-lg bg-white/5 p-4 text-center">
                      <p className="text-sm text-white/60">No external accounts linked</p>
                    </div>
                  ) : (
                    externalAccounts.map((account) => (
                      <Card key={account.id} className="border-white/10 bg-white/10 p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">{account.bankName}</p>
                            <p className="text-sm text-white/60">
                              {account.accountType} ...{account.lastFour}
                            </p>
                          </div>
                          <div className="text-right">
                            {account.status === "active" && (
                              <span className="text-xs text-green-400">✓ Active</span>
                            )}
                            {account.status === "pending" && (
                              <span className="text-xs text-yellow-400">⏳ Pending</span>
                            )}
                            {account.status === "verification" && (
                              <span className="text-xs text-blue-400">🔍 Verify</span>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
                <Button
                  onClick={() => setShowLinkAccountModal(true)}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500"
                >
                  <Link2 className="mr-2 size-4" />
                  Link External Account
                </Button>
              </Card>

              {/* Limit Upgrade Request */}
              <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <h3 className="mb-4 flex items-center text-lg font-semibold text-white">
                  <TrendingUp className="mr-2 size-5" />
                  Limit Upgrade Request
                </h3>
                <p className="mb-4 text-sm text-white/60">
                  Request to increase your transaction and deposit limits
                </p>
                <div className="mb-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Current Daily Transfer Limit:</span>
                    <span className="text-white">$5,000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Current Mobile Deposit Limit:</span>
                    <span className="text-white">$5,000</span>
                  </div>
                </div>
                <Button
                  onClick={() => setShowLimitUpgradeModal(true)}
                  variant="outline"
                  className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20"
                >
                  <Upload className="mr-2 size-4" />
                  Request Limit Increase
                </Button>
              </Card>

              {/* Card Management */}
              <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <h3 className="mb-4 flex items-center text-lg font-semibold text-white">
                  <CreditCard className="mr-2 size-5" />
                  Card Management & Controls
                </h3>
                <p className="mb-4 text-sm text-white/60">
                  Freeze/unfreeze card, set geographic restrictions, and report lost or stolen cards
                </p>
                <Button
                  variant="outline"
                  onClick={() => setShowCardManagementModal(true)}
                  className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20"
                >
                  Manage Card Settings
                </Button>
              </Card>

              {/* Account Nickname */}
              <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <h3 className="mb-4 flex items-center text-lg font-semibold text-white">
                  <Edit className="mr-2 size-5" />
                  Account Nickname
                </h3>
                <p className="mb-4 text-sm text-white/60">
                  Personalize your account with a custom nickname
                </p>
                <div className="mb-3 rounded-lg bg-white/5 p-3">
                  <p className="text-sm text-white/60">Current Nickname:</p>
                  <p className="text-lg font-medium text-white">{accountNickname}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowAccountNicknameModal(true)}
                  className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20"
                >
                  Change Nickname
                </Button>
              </Card>

              {/* Travel Notifications */}
              <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <h3 className="mb-4 flex items-center text-lg font-semibold text-white">
                  <Plane className="mr-2 size-5" />
                  Travel Notifications
                </h3>
                <p className="mb-4 text-sm text-white/60">
                  Notify us about upcoming travel to prevent transaction blocks
                </p>
                {travelNotifications.length > 0 ? (
                  <div className="mb-4 space-y-2">
                    {travelNotifications.map((trip) => (
                      <Card key={trip.id} className="border-white/10 bg-white/10 p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">{trip.destination}</p>
                            <p className="text-xs text-white/60">
                              {trip.startDate} - {trip.endDate}
                            </p>
                          </div>
                          <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">Active</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="mb-4 rounded-lg bg-white/5 p-4 text-center">
                    <p className="text-sm text-white/60">No active travel notifications</p>
                  </div>
                )}
                <Button
                  variant="outline"
                  onClick={() => setShowTravelNotificationModal(true)}
                  className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20"
                >
                  Add Travel Notification
                </Button>
              </Card>

              {/* Wire Transfer Setup */}
              <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <h3 className="mb-4 flex items-center text-lg font-semibold text-white">
                  <Send className="mr-2 size-5" />
                  Wire Transfer Setup
                </h3>
                <p className="mb-4 text-sm text-white/60">
                  Set up saved recipients for domestic and international wire transfers
                </p>
                <div className="mb-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Domestic Wire Fee:</span>
                    <span className="text-white">$25.00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">International Wire Fee:</span>
                    <span className="text-white">$45.00</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowWireTransferModal(true)}
                  className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20"
                >
                  Manage Wire Recipients
                </Button>
              </Card>

              {/* Beneficiary Management */}
              <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <h3 className="mb-4 flex items-center text-lg font-semibold text-white">
                  <UserPlus className="mr-2 size-5" />
                  Beneficiary Management
                </h3>
                <p className="mb-4 text-sm text-white/60">
                  Add or manage beneficiaries for your account
                </p>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20"
                  >
                    Add Beneficiary
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20"
                  >
                    View/Modify Beneficiaries
                  </Button>
                </div>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Transaction Notifications */}
              <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <h3 className="mb-4 flex items-center text-lg font-semibold text-white">
                  <DollarSign className="mr-2 size-5" />
                  Transaction Notifications
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-white">Email Alerts</p>
                      <p className="text-xs text-white/60">Receive transaction notifications via email</p>
                    </div>
                    <Switch
                      checked={notificationPreferences.transactions.email}
                      onCheckedChange={(checked) => {
                        setNotificationPreferences({
                          ...notificationPreferences,
                          transactions: { ...notificationPreferences.transactions, email: checked }
                        });
                        toast.success(checked ? "Email alerts enabled" : "Email alerts disabled");
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-white">Push Notifications</p>
                      <p className="text-xs text-white/60">Instant alerts on your mobile device</p>
                    </div>
                    <Switch
                      checked={notificationPreferences.transactions.push}
                      onCheckedChange={(checked) => {
                        setNotificationPreferences({
                          ...notificationPreferences,
                          transactions: { ...notificationPreferences.transactions, push: checked }
                        });
                        toast.success(checked ? "Push notifications enabled" : "Push notifications disabled");
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-white">SMS Alerts</p>
                      <p className="text-xs text-white/60">Text message notifications for transactions</p>
                    </div>
                    <Switch
                      checked={notificationPreferences.transactions.sms}
                      onCheckedChange={(checked) => {
                        setNotificationPreferences({
                          ...notificationPreferences,
                          transactions: { ...notificationPreferences.transactions, sms: checked }
                        });
                        toast.success(checked ? "SMS alerts enabled" : "SMS alerts disabled");
                      }}
                    />
                  </div>
                </div>
              </Card>

              {/* Security Notifications */}
              <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <h3 className="mb-4 flex items-center text-lg font-semibold text-white">
                  <Shield className="mr-2 size-5" />
                  Security Notifications
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-white">Email Alerts</p>
                      <p className="text-xs text-white/60">Login attempts and security events</p>
                    </div>
                    <Switch
                      checked={notificationPreferences.security.email}
                      onCheckedChange={(checked) => {
                        setNotificationPreferences({
                          ...notificationPreferences,
                          security: { ...notificationPreferences.security, email: checked }
                        });
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-white">Push Notifications</p>
                      <p className="text-xs text-white/60">Instant security alerts</p>
                    </div>
                    <Switch
                      checked={notificationPreferences.security.push}
                      onCheckedChange={(checked) => {
                        setNotificationPreferences({
                          ...notificationPreferences,
                          security: { ...notificationPreferences.security, push: checked }
                        });
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-white">SMS Alerts</p>
                      <p className="text-xs text-white/60">Critical security notifications via SMS</p>
                    </div>
                    <Switch
                      checked={notificationPreferences.security.sms}
                      onCheckedChange={(checked) => {
                        setNotificationPreferences({
                          ...notificationPreferences,
                          security: { ...notificationPreferences.security, sms: checked }
                        });
                      }}
                    />
                  </div>
                </div>
              </Card>

              {/* Bill Pay & Deposits */}
              <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <h3 className="mb-4 flex items-center text-lg font-semibold text-white">
                  <Wallet className="mr-2 size-5" />
                  Bill Pay & Deposit Notifications
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-white">Bill Pay Reminders</p>
                      <p className="text-xs text-white/60">Email notifications for upcoming bills</p>
                    </div>
                    <Switch
                      checked={notificationPreferences.billPay.email}
                      onCheckedChange={(checked) => {
                        setNotificationPreferences({
                          ...notificationPreferences,
                          billPay: { ...notificationPreferences.billPay, email: checked }
                        });
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-white">Deposit Confirmations</p>
                      <p className="text-xs text-white/60">Mobile check and direct deposit alerts</p>
                    </div>
                    <Switch
                      checked={notificationPreferences.deposits.email}
                      onCheckedChange={(checked) => {
                        setNotificationPreferences({
                          ...notificationPreferences,
                          deposits: { ...notificationPreferences.deposits, email: checked }
                        });
                      }}
                    />
                  </div>
                </div>
              </Card>

              {/* Alert Thresholds */}
              <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <h3 className="mb-4 flex items-center text-lg font-semibold text-white">
                  <Bell className="mr-2 size-5" />
                  Alert Thresholds
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label className="text-white/80">Large Transaction Alert ($)</Label>
                    <Input
                      type="number"
                      defaultValue="500"
                      className="mt-2 border-white/20 bg-white/10 text-white"
                    />
                    <p className="mt-1 text-xs text-white/60">Alert for transactions exceeding this amount</p>
                  </div>
                  <div>
                    <Label className="text-white/80">Low Balance Alert ($)</Label>
                    <Input
                      type="number"
                      defaultValue="100"
                      className="mt-2 border-white/20 bg-white/10 text-white"
                    />
                    <p className="mt-1 text-xs text-white/60">Alert when balance falls below this amount</p>
                  </div>
                  <Button
                    onClick={() => toast.success("Alert thresholds updated")}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-500"
                  >
                    Save Threshold Settings
                  </Button>
                </div>
              </Card>

              {/* Marketing Preferences */}
              <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <h3 className="mb-4 flex items-center text-lg font-semibold text-white">
                  <Mail className="mr-2 size-5" />
                  Marketing Communications
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-white">Promotional Emails</p>
                      <p className="text-xs text-white/60">Special offers and product updates</p>
                    </div>
                    <Switch
                      checked={notificationPreferences.marketing.email}
                      onCheckedChange={(checked) => {
                        setNotificationPreferences({
                          ...notificationPreferences,
                          marketing: { ...notificationPreferences.marketing, email: checked }
                        });
                        toast.success(checked ? "Marketing emails enabled" : "Marketing emails disabled");
                      }}
                    />
                  </div>
                </div>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Tools Tab */}
          <TabsContent value="tools" className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Spending Analytics */}
              <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <h3 className="mb-4 flex items-center text-lg font-semibold text-white">
                  <PieChart className="mr-2 size-5" />
                  Spending Analytics
                </h3>
                <p className="mb-4 text-sm text-white/60">
                  View detailed breakdown of your spending by category
                </p>
                <div className="mb-4 space-y-2">
                  {spendingData.slice(0, 3).map((item) => (
                    <div key={item.category} className="flex items-center justify-between">
                      <span className="text-sm text-white/80">{item.category}</span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-20 overflow-hidden rounded-full bg-white/10">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-white">${item.amount}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowSpendingAnalyticsModal(true)}
                  className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20"
                >
                  <BarChart3 className="mr-2 size-4" />
                  View Full Analytics
                </Button>
              </Card>

              {/* Budget Manager */}
              <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <h3 className="mb-4 flex items-center text-lg font-semibold text-white">
                  <Target className="mr-2 size-5" />
                  Budget Manager
                </h3>
                <p className="mb-4 text-sm text-white/60">
                  Set spending limits and track your budget goals
                </p>
                <div className="mb-4 space-y-3">
                  {budgets.map((budget) => (
                    <div key={budget.category} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/80">{budget.category}</span>
                        <span className={`font-medium ${
                          budget.percentage > 100 ? 'text-red-400' :
                          budget.percentage > 80 ? 'text-yellow-400' :
                          'text-green-400'
                        }`}>
                          ${budget.spent} / ${budget.limit}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className={`h-full ${
                            budget.percentage > 100 ? 'bg-red-500' :
                            budget.percentage > 80 ? 'bg-yellow-500' :
                            'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowBudgetingModal(true)}
                  className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20"
                >
                  Manage Budgets
                </Button>
              </Card>

              {/* Statements */}
              <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <h3 className="mb-4 flex items-center text-lg font-semibold text-white">
                  <FileText className="mr-2 size-5" />
                  Statements & Documents
                </h3>
                <div className="space-y-3">
                  <Button
                    onClick={handleDownloadStatement}
                    variant="outline"
                    className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20"
                  >
                    <Download className="mr-2 size-4" />
                    Download Monthly Statement
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20"
                  >
                    <FileText className="mr-2 size-4" />
                    Tax Documents (1099-INT)
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20"
                  >
                    <Calendar className="mr-2 size-4" />
                    Year-End Summary
                  </Button>
                </div>
              </Card>

              {/* Credit Score */}
              <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <h3 className="mb-4 flex items-center text-lg font-semibold text-white">
                  <TrendingUp className="mr-2 size-5" />
                  Credit Score Monitoring
                </h3>
                <p className="mb-4 text-sm text-white/60">
                  Check your credit score and get tips to improve it
                </p>
                <div className="mb-4 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-4">
                  <div className="text-3xl font-bold text-white">{creditScore.score}</div>
                  <div className={`text-sm font-medium ${
                    creditScore.category === 'Excellent' ? 'text-green-400' :
                    creditScore.category === 'Very Good' ? 'text-blue-400' :
                    'text-yellow-400'
                  }`}>
                    {creditScore.category}
                  </div>
                </div>
                <Button
                  onClick={() => setShowCreditScore(true)}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-500"
                >
                  View Detailed Report
                </Button>
              </Card>

              {/* Support */}
              <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                <h3 className="mb-4 flex items-center text-lg font-semibold text-white">
                  <HelpCircle className="mr-2 size-5" />
                  Support & Help
                </h3>
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20"
                  >
                    <Phone className="mr-2 size-4" />
                    Contact Support
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20"
                  >
                    <Mail className="mr-2 size-4" />
                    FAQs & Knowledge Base
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20"
                  >
                    <Globe className="mr-2 size-4" />
                    Find Nearby Branch
                  </Button>
                </div>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Credit Score Modal */}
      <Dialog open={showCreditScore} onOpenChange={setShowCreditScore}>
        <DialogContent className="border-white/20 bg-slate-900/95 text-white backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-xl text-white">Your Credit Score</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="text-center">
              <div className="mb-2 text-6xl font-bold text-white">{creditScore.score}</div>
              <div className={`text-lg font-semibold ${
                creditScore.category === 'Excellent' ? 'text-green-400' :
                creditScore.category === 'Very Good' ? 'text-blue-400' :
                creditScore.category === 'Good' ? 'text-yellow-400' :
                creditScore.category === 'Fair' ? 'text-orange-400' :
                'text-red-400'
              }`}>
                {creditScore.category}
              </div>
            </div>
            <div>
              <h4 className="mb-2 font-semibold text-white">Factors Affecting Your Score:</h4>
              <ul className="space-y-1 text-sm text-white/60">
                {creditScore.factors.map((factor, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Button
              onClick={() => setShowCreditScore(false)}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Link External Account Modal */}
      <Dialog open={showLinkAccountModal} onOpenChange={setShowLinkAccountModal}>
        <DialogContent className="border-white/20 bg-slate-900/95 text-white backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl text-white">
              <Link2 className="mr-2 size-5" />
              Link External Account
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Card className="border-blue-500/20 bg-blue-500/10 p-4">
              <p className="text-sm text-blue-400">
                🔒 Secure connection powered by industry-standard encryption. Your credentials are never stored.
              </p>
            </Card>
            <div className="space-y-3">
              <div>
                <Label className="text-white/80">Bank Name</Label>
                <Input
                  placeholder="Enter your bank name"
                  className="mt-1 border-white/20 bg-white/10 text-white placeholder:text-white/40"
                />
              </div>
              <div>
                <Label className="text-white/80">Routing Number</Label>
                <Input
                  placeholder="9-digit routing number"
                  maxLength={9}
                  className="mt-1 border-white/20 bg-white/10 text-white placeholder:text-white/40"
                />
              </div>
              <div>
                <Label className="text-white/80">Account Number</Label>
                <Input
                  placeholder="Your account number"
                  className="mt-1 border-white/20 bg-white/10 text-white placeholder:text-white/40"
                />
              </div>
              <div>
                <Label className="text-white/80">Account Type</Label>
                <Select>
                  <SelectTrigger className="border-white/20 bg-white/10 text-white">
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent className="border-white/20 bg-slate-900 text-white">
                    <SelectItem value="checking">Checking</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Card className="border-yellow-500/20 bg-yellow-500/10 p-3">
              <p className="text-sm text-yellow-400">
                ℹ️ We'll send 2 small deposits (under $1) to verify your account. This may take 1-3 business days.
              </p>
            </Card>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowLinkAccountModal(false)}
                className="flex-1 border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setExternalAccounts([
                    ...externalAccounts,
                    {
                      id: `ext${Date.now()}`,
                      bankName: "Chase Bank",
                      accountType: "Checking",
                      lastFour: "4321",
                      status: "verification",
                    },
                  ]);
                  toast.success("Micro-deposits initiated. Check your account in 1-3 days.");
                  setShowLinkAccountModal(false);
                }}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500"
              >
                Link Account
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Limit Upgrade Request Modal */}
      <Dialog open={showLimitUpgradeModal} onOpenChange={setShowLimitUpgradeModal}>
        <DialogContent className="border-white/20 bg-slate-900/95 text-white backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl text-white">
              <TrendingUp className="mr-2 size-5" />
              Request Limit Increase
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Card className="border-blue-500/20 bg-blue-500/10 p-4">
              <h4 className="mb-2 text-sm font-semibold text-blue-400">Verification Required</h4>
              <p className="text-xs text-blue-400/80">
                To increase your limits, we need to verify your identity. Please upload a government-issued ID.
              </p>
            </Card>
            <div className="space-y-3">
              <div>
                <Label className="text-white/80">Requested Transfer Limit</Label>
                <Select>
                  <SelectTrigger className="border-white/20 bg-white/10 text-white">
                    <SelectValue placeholder="Select new limit" />
                  </SelectTrigger>
                  <SelectContent className="border-white/20 bg-slate-900 text-white">
                    <SelectItem value="10000">$10,000 / day</SelectItem>
                    <SelectItem value="25000">$25,000 / day</SelectItem>
                    <SelectItem value="50000">$50,000 / day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white/80">Requested Mobile Deposit Limit</Label>
                <Select>
                  <SelectTrigger className="border-white/20 bg-white/10 text-white">
                    <SelectValue placeholder="Select new limit" />
                  </SelectTrigger>
                  <SelectContent className="border-white/20 bg-slate-900 text-white">
                    <SelectItem value="10000">$10,000 / day</SelectItem>
                    <SelectItem value="25000">$25,000 / day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white/80">Upload Government ID</Label>
                <Input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setIdDocument(e.target.files?.[0] || null)}
                  className="mt-1 border-white/20 bg-white/10 text-white file:text-white"
                />
                {idDocument && (
                  <p className="mt-1 text-xs text-green-400">✓ {idDocument.name} uploaded</p>
                )}
              </div>
              <div>
                <Label className="text-white/80">Reason for Increase (Optional)</Label>
                <Input
                  placeholder="Business expenses, frequent transfers, etc."
                  className="mt-1 border-white/20 bg-white/10 text-white placeholder:text-white/40"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowLimitUpgradeModal(false);
                  setIdDocument(null);
                }}
                className="flex-1 border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  toast.success("Limit increase request submitted for review");
                  setShowLimitUpgradeModal(false);
                  setIdDocument(null);
                }}
                disabled={!idDocument}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500"
              >
                Submit Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Direct Deposit Modal */}
      <DirectDepositModal
        open={showDirectDepositModal}
        onOpenChange={setShowDirectDepositModal}
      />

      {/* Card Management Modal */}
      <CardManagementModal
        open={showCardManagementModal}
        onOpenChange={setShowCardManagementModal}
      />

      {/* Profile Picture Modal - One-time upload */}
      <Dialog open={showProfilePictureModal} onOpenChange={setShowProfilePictureModal}>
        <DialogContent className="border-white/20 bg-slate-900/95 text-white backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl text-white">
              <Camera className="mr-2 size-5" />
              Upload Profile Picture
            </DialogTitle>
            <DialogDescription className="text-amber-400 flex items-center gap-1">
              <AlertCircle className="size-4" />
              This is a one-time upload. Once set, your profile photo cannot be changed.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <div className="flex size-32 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-5xl font-bold text-white">
                {currentUser.user.full_name.charAt(0)}
              </div>
            </div>
            <div>
              <Label className="text-white/80">Choose Photo</Label>
              <Input
                type="file"
                accept="image/*"
                className="mt-2 border-white/20 bg-white/10 text-white file:text-white"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleProfilePhotoUpload(file);
                  }
                }}
                disabled={isUploadingPhoto}
              />
            </div>
            <Alert className="bg-amber-500/10 border-amber-500/20">
              <AlertCircle className="h-4 w-4 text-amber-400" />
              <AlertDescription className="text-amber-200 text-sm">
                By uploading a photo, you acknowledge that it will be permanently associated with your account and cannot be changed or removed.
              </AlertDescription>
            </Alert>
            <Button
              variant="outline"
              onClick={() => setShowProfilePictureModal(false)}
              className="w-full border-white/20 bg-white/10 text-white hover:bg-white/20"
              disabled={isUploadingPhoto}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Secondary Contact Modal */}
      <Dialog open={showSecondaryContactModal} onOpenChange={setShowSecondaryContactModal}>
        <DialogContent className="border-white/20 bg-slate-900/95 text-white backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl text-white">
              <UserPlus className="mr-2 size-5" />
              Secondary Contact Information
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Add additional contact methods for account notifications
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-white/80">Secondary Email</Label>
              <Input
                type="email"
                value={secondaryEmail}
                onChange={(e) => setSecondaryEmail(e.target.value)}
                placeholder="backup@example.com"
                className="mt-2 border-white/20 bg-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <div>
              <Label className="text-white/80">Secondary Phone</Label>
              <Input
                type="tel"
                value={secondaryPhone}
                onChange={(e) => setSecondaryPhone(e.target.value)}
                placeholder="+1-555-0102"
                className="mt-2 border-white/20 bg-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowSecondaryContactModal(false)}
                className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveSecondaryContact}
                className="bg-gradient-to-r from-blue-500 to-purple-500"
              >
                Save
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Address Change Modal */}
      <Dialog open={showAddressChangeModal} onOpenChange={setShowAddressChangeModal}>
        <DialogContent className="border-white/20 bg-slate-900/95 text-white backdrop-blur-xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl text-white">
              <MapPin className="mr-2 size-5" />
              Request Address Change
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Address changes require verification. Please upload a supporting document.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-white/80">Street Address *</Label>
              <Input
                value={newAddressData.streetAddress}
                onChange={(e) => setNewAddressData({ ...newAddressData, streetAddress: e.target.value })}
                placeholder="123 Main Street, Apt 4B"
                className="mt-2 border-white/20 bg-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-white/80">City *</Label>
                <Input
                  value={newAddressData.city}
                  onChange={(e) => setNewAddressData({ ...newAddressData, city: e.target.value })}
                  placeholder="New York"
                  className="mt-2 border-white/20 bg-white/10 text-white placeholder:text-white/40"
                />
              </div>
              <div>
                <Label className="text-white/80">State *</Label>
                <Input
                  value={newAddressData.state}
                  onChange={(e) => setNewAddressData({ ...newAddressData, state: e.target.value })}
                  placeholder="NY"
                  className="mt-2 border-white/20 bg-white/10 text-white placeholder:text-white/40"
                />
              </div>
            </div>
            <div>
              <Label className="text-white/80">ZIP Code *</Label>
              <Input
                value={newAddressData.zipCode}
                onChange={(e) => setNewAddressData({ ...newAddressData, zipCode: e.target.value })}
                placeholder="10001"
                className="mt-2 border-white/20 bg-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <div>
              <Label className="text-white/80">Verification Document *</Label>
              <p className="text-xs text-white/40 mt-1 mb-2">Upload a utility bill, government ID, or bank statement showing your new address</p>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setAddressVerificationDoc(e.target.files?.[0] || null)}
                className="border-white/20 bg-white/10 text-white file:text-white"
              />
              {addressVerificationDoc && (
                <p className="mt-2 text-sm text-green-400 flex items-center">
                  <CheckCircle2 className="size-4 mr-1" />
                  {addressVerificationDoc.name}
                </p>
              )}
            </div>
            <Alert className="bg-blue-500/10 border-blue-500/20">
              <AlertCircle className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-200 text-sm">
                Address changes are reviewed within 1-2 business days. You'll receive a notification once approved.
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowAddressChangeModal(false)}
                className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitAddressChange}
                className="bg-gradient-to-r from-blue-500 to-purple-500"
              >
                Submit Request
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2FA Setup Modal */}
      <Dialog open={show2FASetupModal} onOpenChange={setShow2FASetupModal}>
        <DialogContent className="border-white/20 bg-slate-900/95 text-white backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl text-white">
              <Shield className="mr-2 size-5" />
              Set Up Two-Factor Authentication
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Choose your preferred method for receiving verification codes
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <label
                className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  twoFactorMethod === "sms"
                    ? "border-blue-500 bg-blue-500/20"
                    : "border-white/20 bg-white/5 hover:bg-white/10"
                }`}
              >
                <input
                  type="radio"
                  name="2faMethod"
                  value="sms"
                  checked={twoFactorMethod === "sms"}
                  onChange={() => setTwoFactorMethod("sms")}
                  className="sr-only"
                />
                <Smartphone className="size-5 text-blue-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-white">SMS Text Message</h4>
                  <p className="text-sm text-white/60">Receive codes via text message to your phone</p>
                </div>
              </label>

              <label
                className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  twoFactorMethod === "authenticator"
                    ? "border-blue-500 bg-blue-500/20"
                    : "border-white/20 bg-white/5 hover:bg-white/10"
                }`}
              >
                <input
                  type="radio"
                  name="2faMethod"
                  value="authenticator"
                  checked={twoFactorMethod === "authenticator"}
                  onChange={() => setTwoFactorMethod("authenticator")}
                  className="sr-only"
                />
                <Lock className="size-5 text-green-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-white">Authenticator App</h4>
                  <p className="text-sm text-white/60">Use Google Authenticator, Authy, or similar apps</p>
                </div>
              </label>

              <label
                className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  twoFactorMethod === "push"
                    ? "border-blue-500 bg-blue-500/20"
                    : "border-white/20 bg-white/5 hover:bg-white/10"
                }`}
              >
                <input
                  type="radio"
                  name="2faMethod"
                  value="push"
                  checked={twoFactorMethod === "push"}
                  onChange={() => setTwoFactorMethod("push")}
                  className="sr-only"
                />
                <Bell className="size-5 text-purple-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-white">Push Notifications</h4>
                  <p className="text-sm text-white/60">Approve logins with a tap on your mobile device</p>
                </div>
              </label>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShow2FASetupModal(false)}
                className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSetup2FA}
                className="bg-gradient-to-r from-blue-500 to-purple-500"
              >
                Enable 2FA
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Biometric Setup Modal */}
      <Dialog open={showBiometricSetupModal} onOpenChange={setShowBiometricSetupModal}>
        <DialogContent className="border-white/20 bg-slate-900/95 text-white backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl text-white">
              <Smartphone className="mr-2 size-5" />
              Set Up Biometric Login
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Use your device's native biometric capabilities for secure, quick login
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <label
                className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  biometricType === "face"
                    ? "border-blue-500 bg-blue-500/20"
                    : "border-white/20 bg-white/5 hover:bg-white/10"
                }`}
              >
                <input
                  type="radio"
                  name="biometricType"
                  value="face"
                  checked={biometricType === "face"}
                  onChange={() => setBiometricType("face")}
                  className="sr-only"
                />
                <User className="size-5 text-blue-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-white">Face ID / Face Recognition</h4>
                  <p className="text-sm text-white/60">Use your face to securely log in</p>
                </div>
              </label>

              <label
                className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  biometricType === "fingerprint"
                    ? "border-blue-500 bg-blue-500/20"
                    : "border-white/20 bg-white/5 hover:bg-white/10"
                }`}
              >
                <input
                  type="radio"
                  name="biometricType"
                  value="fingerprint"
                  checked={biometricType === "fingerprint"}
                  onChange={() => setBiometricType("fingerprint")}
                  className="sr-only"
                />
                <Smartphone className="size-5 text-green-400 mt-0.5" />
                <div>
                  <h4 className="font-medium text-white">Fingerprint / Touch ID</h4>
                  <p className="text-sm text-white/60">Use your fingerprint to securely log in</p>
                </div>
              </label>
            </div>
            <Alert className="bg-green-500/10 border-green-500/20">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-200 text-sm">
                Biometric data never leaves your device. Authentication is performed locally for maximum security.
              </AlertDescription>
            </Alert>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowBiometricSetupModal(false)}
                className="border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSetupBiometric}
                disabled={biometricType === "none"}
                className="bg-gradient-to-r from-blue-500 to-purple-500"
              >
                Enable Biometric Login
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sessions Modal */}
      <Dialog open={showSessionsModal} onOpenChange={setShowSessionsModal}>
        <DialogContent className="max-w-2xl border-white/20 bg-slate-900/95 text-white backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl text-white">
              <Monitor className="mr-2 size-5" />
              Active Sessions
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Manage devices that are currently logged into your account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {activeSessions.map((session) => (
              <Card key={session.id} className="border-white/10 bg-white/10 p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Monitor className="size-4 text-white/60" />
                      <p className="font-medium text-white">{session.device}</p>
                      {session.current && (
                        <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400">
                          Current Session
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-white/60">
                      <MapPin className="mr-1 inline size-3" />
                      {session.location}
                    </p>
                    <p className="text-sm text-white/60">IP: {session.ip}</p>
                    <p className="text-xs text-white/40">Last active: {session.lastActive}</p>
                  </div>
                  {!session.current && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toast.success(`Session on ${session.device} terminated`)}
                      className="border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
            <Button
              variant="outline"
              onClick={() => {
                toast.success("All other sessions terminated");
                setShowSessionsModal(false);
              }}
              className="w-full border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20"
            >
              Terminate All Other Sessions
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Login History Modal */}
      <Dialog open={showLoginHistoryModal} onOpenChange={setShowLoginHistoryModal}>
        <DialogContent className="max-w-2xl border-white/20 bg-slate-900/95 text-white backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl text-white">
              <Clock className="mr-2 size-5" />
              Login History
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Review recent login attempts to your account
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 space-y-3 overflow-y-auto py-4">
            {loginHistory.map((login) => (
              <Card key={login.id} className={`border-white/10 p-4 ${
                login.success ? 'bg-white/5' : 'bg-red-500/10 border-red-500/20'
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {login.success ? (
                        <CheckCircle2 className="size-4 text-green-400" />
                      ) : (
                        <AlertCircle className="size-4 text-red-400" />
                      )}
                      <p className={`font-medium ${login.success ? 'text-white' : 'text-red-400'}`}>
                        {login.success ? 'Successful Login' : 'Failed Login Attempt'}
                      </p>
                    </div>
                    <p className="mt-1 text-sm text-white/60">{login.device}</p>
                    <p className="text-sm text-white/60">
                      <MapPin className="mr-1 inline size-3" />
                      {login.location}
                    </p>
                    <p className="text-sm text-white/60">IP: {login.ip}</p>
                    <p className="text-xs text-white/40">{login.time}</p>
                  </div>
                  {!login.success && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20"
                    >
                      Report
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Account Nickname Modal */}
      <Dialog open={showAccountNicknameModal} onOpenChange={setShowAccountNicknameModal}>
        <DialogContent className="border-white/20 bg-slate-900/95 text-white backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl text-white">
              <Edit className="mr-2 size-5" />
              Change Account Nickname
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-white/80">Account Nickname</Label>
              <Input
                value={accountNickname}
                onChange={(e) => setAccountNickname(e.target.value)}
                placeholder="e.g., Primary Checking, Savings Account"
                className="mt-2 border-white/20 bg-white/10 text-white"
              />
              <p className="mt-1 text-xs text-white/60">
                Choose a name that helps you identify this account easily
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowAccountNicknameModal(false)}
                className="flex-1 border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  toast.success("Account nickname updated");
                  setShowAccountNicknameModal(false);
                }}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500"
              >
                Save Nickname
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Travel Notification Modal */}
      <Dialog open={showTravelNotificationModal} onOpenChange={setShowTravelNotificationModal}>
        <DialogContent className="border-white/20 bg-slate-900/95 text-white backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl text-white">
              <Plane className="mr-2 size-5" />
              Add Travel Notification
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Let us know about your travel plans to avoid transaction blocks
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-white/80">Destination</Label>
              <Input
                placeholder="e.g., Paris, France"
                className="mt-2 border-white/20 bg-white/10 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-white/80">Start Date</Label>
                <Input
                  type="date"
                  className="mt-2 border-white/20 bg-white/10 text-white"
                />
              </div>
              <div>
                <Label className="text-white/80">End Date</Label>
                <Input
                  type="date"
                  className="mt-2 border-white/20 bg-white/10 text-white"
                />
              </div>
            </div>
            <Card className="border-blue-500/20 bg-blue-500/10 p-3">
              <p className="text-sm text-blue-400">
                ℹ️ We'll monitor your account for transactions in this location during your trip
              </p>
            </Card>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowTravelNotificationModal(false)}
                className="flex-1 border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  toast.success("Travel notification added");
                  setShowTravelNotificationModal(false);
                }}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500"
              >
                Add Notification
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Wire Transfer Modal */}
      <Dialog open={showWireTransferModal} onOpenChange={setShowWireTransferModal}>
        <DialogContent className="border-white/20 bg-slate-900/95 text-white backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl text-white">
              <Send className="mr-2 size-5" />
              Wire Transfer Recipients
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Card className="border-white/10 bg-white/5 p-4 text-center">
              <p className="text-sm text-white/60">No saved wire transfer recipients</p>
            </Card>
            <div>
              <Label className="text-white/80">Recipient Name</Label>
              <Input
                placeholder="Full name"
                className="mt-2 border-white/20 bg-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-white/80">Bank Name</Label>
              <Input
                placeholder="Recipient's bank name"
                className="mt-2 border-white/20 bg-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-white/80">Account Number</Label>
              <Input
                placeholder="Recipient's account number"
                className="mt-2 border-white/20 bg-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-white/80">Routing Number</Label>
              <Input
                placeholder="9-digit routing number"
                maxLength={9}
                className="mt-2 border-white/20 bg-white/10 text-white"
              />
            </div>
            <div>
              <Label className="text-white/80">Transfer Type</Label>
              <Select>
                <SelectTrigger className="border-white/20 bg-white/10 text-white">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="border-white/20 bg-slate-900 text-white">
                  <SelectItem value="domestic">Domestic Wire ($25 fee)</SelectItem>
                  <SelectItem value="international">International Wire ($45 fee)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowWireTransferModal(false)}
                className="flex-1 border-white/20 bg-white/10 text-white hover:bg-white/20"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  toast.success("Wire transfer recipient saved");
                  setShowWireTransferModal(false);
                }}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-500"
              >
                Save Recipient
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Spending Analytics Modal */}
      <Dialog open={showSpendingAnalyticsModal} onOpenChange={setShowSpendingAnalyticsModal}>
        <DialogContent className="max-w-3xl border-white/20 bg-slate-900/95 text-white backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl text-white">
              <PieChart className="mr-2 size-5" />
              Spending Analytics
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Detailed breakdown of your spending by category
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Card className="border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/60">Total Spending</p>
                <p className="text-2xl font-bold text-white">
                  ${spendingData.reduce((acc, item) => acc + item.amount, 0).toFixed(2)}
                </p>
              </Card>
              <Card className="border-white/10 bg-white/5 p-4">
                <p className="text-sm text-white/60">Top Category</p>
                <p className="text-2xl font-bold text-white">{spendingData[0].category}</p>
              </Card>
            </div>
            <div className="space-y-3">
              {spendingData.map((item) => (
                <div key={item.category} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/80">{item.category}</span>
                    <span className="font-medium text-white">
                      ${item.amount} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Budgeting Modal */}
      <Dialog open={showBudgetingModal} onOpenChange={setShowBudgetingModal}>
        <DialogContent className="max-w-2xl border-white/20 bg-slate-900/95 text-white backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center text-xl text-white">
              <Target className="mr-2 size-5" />
              Budget Manager
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Set and manage your monthly spending budgets
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {budgets.map((budget) => (
              <Card key={budget.category} className="border-white/10 bg-white/5 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-medium text-white">{budget.category}</h4>
                  <Button size="sm" variant="ghost" className="text-blue-400 hover:bg-blue-500/20">
                    <Edit className="size-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Budget Limit</span>
                    <Input
                      type="number"
                      defaultValue={budget.limit}
                      className="w-24 border-white/20 bg-white/10 text-white"
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-white/60">Spent</span>
                    <span className={`font-medium ${
                      budget.percentage > 100 ? 'text-red-400' :
                      budget.percentage > 80 ? 'text-yellow-400' :
                      'text-green-400'
                    }`}>
                      ${budget.spent}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full ${
                        budget.percentage > 100 ? 'bg-red-500' :
                        budget.percentage > 80 ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                    />
                  </div>
                </div>
              </Card>
            ))}
            <Button
              onClick={() => toast.success("Budget limits updated")}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500"
            >
              Save Budget Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
