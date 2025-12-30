import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  fetchKycStatus,
  fetchProfile,
  updateProfile,
  uploadKycDocument,
  uploadKycFile,
} from "@/lib/backend";
import { uploadDocument } from "@/lib/kyc-storage";
import { generateMockCreditScore } from "@/lib/banking-utils";

export interface ProfileData {
  phone: string;
  address: string;
  email: string;
}

export interface AddressData {
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface NotificationPreferences {
  transactions: { email: boolean; push: boolean; sms: boolean };
  security: { email: boolean; push: boolean; sms: boolean };
  billPay: { email: boolean; push: boolean; sms: boolean };
  deposits: { email: boolean; push: boolean; sms: boolean };
  marketing: { email: boolean; push: boolean; sms: boolean };
}

export function useProfileData() {
  const { currentUser, logout } = useAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState("account");

  // Account state
  const [showAccountNumber, setShowAccountNumber] = useState(false);
  const [creditScore] = useState(generateMockCreditScore());
  const [showCreditScore, setShowCreditScore] = useState(false);

  // Profile data
  const [profileData, setProfileData] = useState<ProfileData>({
    phone: "",
    address: "",
    email: currentUser?.user.email || "",
  });
  const [kycData, setKycData] = useState<any | null>(null);

  // Secondary contact
  const [secondaryEmail, setSecondaryEmail] = useState("");
  const [secondaryPhone, setSecondaryPhone] = useState("");

  // Profile photo
  const [profilePhotoUploaded, setProfilePhotoUploaded] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Address change
  const [newAddressData, setNewAddressData] = useState<AddressData>({
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
  });
  const [addressVerificationDoc, setAddressVerificationDoc] =
    useState<File | null>(null);
  const [pendingAddressChange, setPendingAddressChange] = useState<any | null>(
    null
  );

  // Security
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState<
    "sms" | "authenticator" | "push"
  >("sms");
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<
    "fingerprint" | "face" | "none"
  >("none");

  // Sessions
  const [activeSessions] = useState([
    {
      id: "1",
      device: "iPhone 14 Pro",
      location: "New York, NY",
      ip: "192.168.1.100",
      lastActive: "Just now",
      current: true,
    },
    {
      id: "2",
      device: "Chrome on Windows",
      location: "New York, NY",
      ip: "192.168.1.101",
      lastActive: "2 hours ago",
      current: false,
    },
    {
      id: "3",
      device: "Safari on MacBook",
      location: "New York, NY",
      ip: "192.168.1.102",
      lastActive: "1 day ago",
      current: false,
    },
  ]);

  const [loginHistory] = useState([
    {
      id: "1",
      device: "iPhone 14 Pro",
      location: "New York, NY",
      ip: "192.168.1.100",
      time: "2024-01-15 10:30 AM",
      success: true,
    },
    {
      id: "2",
      device: "Chrome on Windows",
      location: "New York, NY",
      ip: "192.168.1.101",
      time: "2024-01-14 3:45 PM",
      success: true,
    },
    {
      id: "3",
      device: "Unknown Device",
      location: "Los Angeles, CA",
      ip: "203.0.113.42",
      time: "2024-01-13 11:20 PM",
      success: false,
    },
    {
      id: "4",
      device: "Safari on MacBook",
      location: "New York, NY",
      ip: "192.168.1.102",
      time: "2024-01-13 9:15 AM",
      success: true,
    },
  ]);

  // Services
  const [overdraftEnabled, setOverdraftEnabled] = useState(false);
  const [linkedSavingsForOverdraft, setLinkedSavingsForOverdraft] =
    useState("");
  const [externalAccounts, setExternalAccounts] = useState<
    Array<{
      id: string;
      bankName: string;
      accountType: string;
      lastFour: string;
      status: "active" | "pending" | "verification";
    }>
  >([]);
  const [accountNickname, setAccountNickname] = useState("Primary Checking");
  const [travelNotifications] = useState([
    {
      id: "1",
      destination: "Paris, France",
      startDate: "2024-02-01",
      endDate: "2024-02-10",
      status: "active",
    },
  ]);

  // Notifications
  const [notificationPreferences, setNotificationPreferences] =
    useState<NotificationPreferences>({
      transactions: { email: true, push: true, sms: false },
      security: { email: true, push: true, sms: true },
      billPay: { email: true, push: false, sms: false },
      deposits: { email: true, push: true, sms: false },
      marketing: { email: false, push: false, sms: false },
    });

  // Spending & Budget
  const [spendingData] = useState([
    { category: "Groceries", amount: 450, percentage: 25 },
    { category: "Dining", amount: 320, percentage: 18 },
    { category: "Transportation", amount: 280, percentage: 16 },
    { category: "Utilities", amount: 240, percentage: 13 },
    { category: "Entertainment", amount: 200, percentage: 11 },
    { category: "Shopping", amount: 180, percentage: 10 },
    { category: "Other", amount: 130, percentage: 7 },
  ]);

  const [budgets] = useState([
    { category: "Groceries", limit: 500, spent: 450, percentage: 90 },
    { category: "Dining", limit: 300, spent: 320, percentage: 107 },
    { category: "Transportation", limit: 250, spent: 280, percentage: 112 },
  ]);

  // Load profile data from backend
  useEffect(() => {
    if (!currentUser?.accessToken) return;

    const loadProfileData = async () => {
      try {
        const [status, profile] = await Promise.all([
          fetchKycStatus(currentUser.accessToken),
          fetchProfile(currentUser.accessToken),
        ]);

        setKycData({
          kycStatus: status.kycStatus?.toLowerCase?.() || status.kycStatus,
          verification: status.verification,
          primaryAccountType:
            currentUser?.accounts?.[0]?.accountType?.toLowerCase?.() ||
            "checking",
        });

        setProfilePhotoUploaded(Boolean(status?.verification));
        setProfilePhotoUrl(
          status?.verification?.id ? "KYC verification submitted" : ""
        );

        setProfileData({
          phone: profile.phoneNumber || "",
          address: profile.address || "",
          email: profile.email || currentUser.user.email,
        });
      } catch (error) {
        console.error("Failed to load profile data", error);
        toast.error("Failed to load profile data");
      }
    };

    loadProfileData();
  }, [currentUser?.accessToken, currentUser?.user.email, currentUser?.accounts]);

  // Handlers
  const handleProfilePhotoUpload = async (file: File) => {
    if (profilePhotoUploaded) {
      toast.error("Profile photo can only be uploaded once");
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const photoUrl = currentUser?.accessToken
        ? await uploadKycFile(file, currentUser.accessToken)
        : await uploadDocument(file);

      if (currentUser?.accessToken && photoUrl) {
        await uploadKycDocument("ID_FRONT", photoUrl, currentUser.accessToken);
      }

      setProfilePhotoUploaded(true);
      setProfilePhotoUrl(photoUrl);
      toast.success(
        "Profile photo uploaded successfully. This cannot be changed."
      );
    } catch (error) {
      toast.error("Failed to upload profile photo");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSaveSecondaryContact = async () => {
    if (!currentUser?.accessToken) return;

    try {
      await updateProfile(
        {
          secondaryEmail: secondaryEmail || undefined,
          secondaryPhone: secondaryPhone || undefined,
        },
        currentUser.accessToken
      );

      setKycData((prev: any) => ({
        ...prev,
        secondaryEmail,
        secondaryPhone,
      }));

      toast.success("Secondary contact information saved");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to save secondary contact"
      );
    }
  };

  const handleSubmitAddressChange = async () => {
    if (!currentUser) return;

    if (
      !newAddressData.streetAddress ||
      !newAddressData.city ||
      !newAddressData.state ||
      !newAddressData.zipCode
    ) {
      toast.error("Please fill in all address fields");
      return;
    }

    if (!addressVerificationDoc) {
      toast.error(
        "Please upload a verification document (utility bill, ID, etc.)"
      );
      return;
    }

    try {
      const docUrl = currentUser?.accessToken
        ? await uploadKycFile(addressVerificationDoc, currentUser.accessToken)
        : await uploadDocument(addressVerificationDoc);

      const pendingChange = {
        ...newAddressData,
        verificationDocumentUrl: docUrl,
        requestedAt: new Date().toISOString(),
        status: "pending" as const,
      };

      setPendingAddressChange(pendingChange);

      if (currentUser?.accessToken) {
        await uploadKycDocument(
          "PROOF_OF_ADDRESS",
          docUrl,
          currentUser.accessToken
        );
        await updateProfile(
          {
            address: {
              street: newAddressData.streetAddress,
              city: newAddressData.city,
              state: newAddressData.state,
              zipCode: newAddressData.zipCode,
              country: newAddressData.country,
            },
          },
          currentUser.accessToken
        );
      }

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

  const handleEnable2FA = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
    toast.success(twoFactorEnabled ? "2FA disabled" : "2FA enabled");
  };

  const handleEnableBiometric = () => {
    setBiometricEnabled(!biometricEnabled);
    toast.success(
      biometricEnabled ? "Biometric login disabled" : "Biometric login enabled"
    );
  };

  const handleSetup2FA = () => {
    setTwoFactorEnabled(true);
    toast.success(
      `Two-factor authentication enabled via ${twoFactorMethod.toUpperCase()}`
    );
  };

  const handleSetupBiometric = () => {
    setBiometricEnabled(true);
    toast.success(
      `Biometric login enabled using ${biometricType === "face" ? "Face ID" : "Fingerprint"}`
    );
  };

  return {
    // User data
    currentUser,
    logout,

    // Tab state
    activeTab,
    setActiveTab,

    // Account
    showAccountNumber,
    setShowAccountNumber,
    creditScore,
    showCreditScore,
    setShowCreditScore,

    // Profile
    profileData,
    setProfileData,
    kycData,

    // Secondary contact
    secondaryEmail,
    setSecondaryEmail,
    secondaryPhone,
    setSecondaryPhone,
    handleSaveSecondaryContact,

    // Profile photo
    profilePhotoUploaded,
    profilePhotoUrl,
    isUploadingPhoto,
    handleProfilePhotoUpload,

    // Address
    newAddressData,
    setNewAddressData,
    addressVerificationDoc,
    setAddressVerificationDoc,
    pendingAddressChange,
    handleSubmitAddressChange,

    // Security
    twoFactorEnabled,
    setTwoFactorEnabled,
    twoFactorMethod,
    setTwoFactorMethod,
    biometricEnabled,
    setBiometricEnabled,
    biometricType,
    setBiometricType,
    handleEnable2FA,
    handleEnableBiometric,
    handleSetup2FA,
    handleSetupBiometric,

    // Sessions
    activeSessions,
    loginHistory,

    // Services
    overdraftEnabled,
    setOverdraftEnabled,
    linkedSavingsForOverdraft,
    setLinkedSavingsForOverdraft,
    externalAccounts,
    setExternalAccounts,
    accountNickname,
    setAccountNickname,
    travelNotifications,

    // Notifications
    notificationPreferences,
    setNotificationPreferences,

    // Analytics
    spendingData,
    budgets,
  };
}
