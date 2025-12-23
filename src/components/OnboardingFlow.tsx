import { useState } from "react";
import { UserORM } from "@/components/data/orm/orm_user";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Mail,
  Phone,
  MapPin,
  Shield,
  Camera,
  Upload,
  CreditCard,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

import type { PrimaryAccountType } from "@/lib/kyc-storage";

export interface OnboardingData {
  // Step 1: Account Type Selection
  primaryAccountType: PrimaryAccountType;

  // Step 2: Identity & Contact
  fullName: string;
  dateOfBirth: string;
  ssn: string;
  phoneNumber: string;
  email: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  phoneOtp?: string;

  // Step 3: Address
  streetAddress: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  residencyYears: string;

  // Step 4: Security
  username: string;
  password: string;
  confirmPassword: string;
  securityQuestion1: string;
  securityAnswer1: string;
  securityQuestion2: string;
  securityAnswer2: string;
  securityQuestion3: string;
  securityAnswer3: string;

  // Step 5: KYC
  idDocumentType: string;
  idDocumentFront?: File;
  idDocumentBack?: File;
  videoSelfie?: File;
  livenessCheckComplete: boolean;

  // Step 6: Initial Funding
  accountTypes: string[];
  initialDepositMethod: string;
  initialDepositAmount: string;
  externalBankName?: string;
  externalAccountNumber?: string;
  externalRoutingNumber?: string;
  sponsorEmail?: string;
  sponsorVerified?: boolean;
}

interface OnboardingFlowProps {
  onComplete: (data: OnboardingData) => Promise<void>;
  onCancel?: () => void;
}

const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "What city were you born in?",
  "What is your mother's maiden name?",
  "What was the name of your first school?",
  "What is your favorite book?",
  "What was the model of your first car?",
  "What street did you grow up on?",
  "What is your favorite food?",
];

const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

export function OnboardingFlow({ onComplete, onCancel }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [phoneVerificationSent, setPhoneVerificationSent] = useState(false);
  const [recordingVideo, setRecordingVideo] = useState(false);

  const [formData, setFormData] = useState<OnboardingData>({
    primaryAccountType: "" as PrimaryAccountType,
    fullName: "",
    dateOfBirth: "",
    ssn: "",
    phoneNumber: "",
    email: "",
    emailVerified: false,
    phoneVerified: false,
    streetAddress: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
    residencyYears: "",
    username: "",
    password: "",
    confirmPassword: "",
    securityQuestion1: "",
    securityAnswer1: "",
    securityQuestion2: "",
    securityAnswer2: "",
    securityQuestion3: "",
    securityAnswer3: "",
    idDocumentType: "",
    livenessCheckComplete: false,
    accountTypes: [],
    initialDepositMethod: "",
    initialDepositAmount: "",
    sponsorEmail: "",
    sponsorVerified: false,
  });

  const totalSteps = 6;
  const progress = (currentStep / totalSteps) * 100;

  const validateStep0 = (): boolean => {
    if (!formData.primaryAccountType) {
      toast.error("Please select an account type to continue");
      return false;
    }
    return true;
  };

  const updateFormData = (field: keyof OnboardingData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const sponsorRequired = formData.country === "United States" || Boolean((window as any).__finbankRequireSponsor);

  const verifySponsor = async () => {
    if (!formData.sponsorEmail || !formData.sponsorEmail.includes("@")) {
      toast.error("Please enter your sponsor's Fin-Bank email");
      return;
    }

    try {
      const userOrm = UserORM.getInstance();
      const sponsor = await userOrm.getUserByEmail(formData.sponsorEmail.trim().toLowerCase());
      if (!sponsor || sponsor.length === 0) {
        toast.error("Sponsor not found. They must already have a Fin-Bank account.");
        updateFormData("sponsorVerified", false);
        return;
      }
      updateFormData("sponsorVerified", true);
      (window as any).__finbankSponsorOverride = true;
      toast.success("Sponsor verified. You may continue.");
    } catch (err) {
      console.error("Sponsor verification failed", err);
      toast.error("Unable to verify sponsor. Please try again.");
    }
  };

  const validateStep1 = (): boolean => {
    if (!formData.fullName || formData.fullName.length < 3) {
      toast.error("Please enter your full legal name");
      return false;
    }
    if (!formData.dateOfBirth) {
      toast.error("Please enter your date of birth");
      return false;
    }
    if (!formData.ssn || formData.ssn.length !== 11) {
      toast.error("Please enter a valid SSN (XXX-XX-XXXX)");
      return false;
    }
    if (!formData.phoneNumber || formData.phoneNumber.length < 10) {
      toast.error("Please enter a valid phone number");
      return false;
    }
    if (!formData.email || !formData.email.includes("@")) {
      toast.error("Please enter a valid email address");
      return false;
    }
    if (!formData.emailVerified) {
      toast.error("Please verify your email address");
      return false;
    }
    if (!formData.phoneVerified) {
      toast.error("Please verify your phone number");
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    if (!formData.streetAddress || formData.streetAddress.length < 5) {
      toast.error("Please enter your street address");
      return false;
    }
    if (!formData.city || formData.city.length < 2) {
      toast.error("Please enter your city");
      return false;
    }
    if (!formData.state) {
      toast.error("Please select your state");
      return false;
    }
    if (!formData.zipCode || formData.zipCode.length !== 5) {
      toast.error("Please enter a valid 5-digit ZIP code");
      return false;
    }
    if (!formData.residencyYears) {
      toast.error("Please indicate how long you've lived at this address");
      return false;
    }
    if (sponsorRequired) {
      if (!formData.sponsorEmail) {
        toast.error("US citizens must provide a sponsor who is an existing Fin-Bank customer");
        return false;
      }
      if (!formData.sponsorVerified) {
        toast.error("Please verify your sponsor's Fin-Bank account");
        return false;
      }
    }
    return true;
  };

  const validateStep3 = (): boolean => {
    if (!formData.username || formData.username.length < 4) {
      toast.error("Username must be at least 4 characters");
      return false;
    }
    if (!formData.password || formData.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return false;
    }

    // Password complexity check
    const hasUpper = /[A-Z]/.test(formData.password);
    const hasLower = /[a-z]/.test(formData.password);
    const hasNumber = /[0-9]/.test(formData.password);
    const hasSymbol = /[!@#$%^&*]/.test(formData.password);

    if (!(hasUpper && hasLower && hasNumber && hasSymbol)) {
      toast.error("Password must contain uppercase, lowercase, number, and special character (!@#$%^&*)");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return false;
    }

    if (!formData.securityQuestion1 || !formData.securityAnswer1) {
      toast.error("Please answer security question 1");
      return false;
    }
    if (!formData.securityQuestion2 || !formData.securityAnswer2) {
      toast.error("Please answer security question 2");
      return false;
    }
    if (!formData.securityQuestion3 || !formData.securityAnswer3) {
      toast.error("Please answer security question 3");
      return false;
    }

    // Ensure all questions are different
    const questions = [formData.securityQuestion1, formData.securityQuestion2, formData.securityQuestion3];
    if (new Set(questions).size !== 3) {
      toast.error("Please select three different security questions");
      return false;
    }

    return true;
  };

  const validateStep4 = (): boolean => {
    if (!formData.idDocumentType) {
      toast.error("Please select an ID document type");
      return false;
    }
    if (!formData.idDocumentFront) {
      toast.error("Please upload the front of your ID");
      return false;
    }
    if (formData.idDocumentType !== "passport" && !formData.idDocumentBack) {
      toast.error("Please upload the back of your ID");
      return false;
    }
    if (!formData.livenessCheckComplete) {
      toast.error("Please complete the liveness verification");
      return false;
    }
    return true;
  };

  const validateStep5 = (): boolean => {
    if (formData.accountTypes.length === 0) {
      toast.error("Please select at least one account type");
      return false;
    }
    if (!formData.initialDepositMethod) {
      toast.error("Please select an initial deposit method");
      return false;
    }
    if (!formData.initialDepositAmount || parseFloat(formData.initialDepositAmount) < 25) {
      toast.error("Initial deposit must be at least $25");
      return false;
    }
    if (formData.initialDepositMethod === "external_ach") {
      if (!formData.externalBankName || !formData.externalAccountNumber || !formData.externalRoutingNumber) {
        toast.error("Please provide external bank account details");
        return false;
      }
      if (formData.externalRoutingNumber.length !== 9) {
        toast.error("Routing number must be 9 digits");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    let isValid = false;

    switch (currentStep) {
      case 1:
        isValid = validateStep0();
        break;
      case 2:
        isValid = validateStep1();
        break;
      case 3:
        isValid = validateStep2();
        break;
      case 4:
        isValid = validateStep3();
        break;
      case 5:
        isValid = validateStep4();
        break;
      case 6:
        isValid = validateStep5();
        break;
    }

    if (isValid && currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    if (!validateStep5()) return;
    if (sponsorRequired && !formData.sponsorVerified) {
      toast.error("Sponsor verification required to complete signup");
      return;
    }

    setIsSubmitting(true);
    try {
      await onComplete(formData);
      toast.success("Application submitted successfully! Your account is pending review.");
    } catch (error) {
      toast.error("Failed to submit application. Please try again.");
      console.error("Onboarding submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendEmailVerification = () => {
    if (!formData.email || !formData.email.includes("@")) {
      toast.error("Please enter a valid email address first");
      return;
    }

    setEmailVerificationSent(true);
    toast.success(`Verification email sent to ${formData.email}`);

    // Simulate email verification (in production, this would require clicking a link)
    setTimeout(() => {
      updateFormData("emailVerified", true);
      toast.success("Email verified successfully!");
    }, 2000);
  };

  const sendPhoneVerification = () => {
    if (!formData.phoneNumber || formData.phoneNumber.length < 10) {
      toast.error("Please enter a valid phone number first");
      return;
    }

    setPhoneVerificationSent(true);
    toast.success(`Verification code sent to ${formData.phoneNumber}`);
  };

  const verifyPhoneOtp = () => {
    if (!formData.phoneOtp || formData.phoneOtp.length !== 6) {
      toast.error("Please enter the 6-digit verification code");
      return;
    }

    // Simulate OTP verification
    updateFormData("phoneVerified", true);
    toast.success("Phone number verified successfully!");
  };

  const handleFileUpload = (field: keyof OnboardingData, file: File | undefined) => {
    if (file) {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error("File size must be less than 10MB");
        return;
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Only JPG and PNG files are allowed");
        return;
      }

      updateFormData(field, file);
      toast.success(`${file.name} uploaded successfully`);
    }
  };

  const startLivenessCheck = () => {
    setRecordingVideo(true);
    toast.info("Please look at the camera and blink twice");

    // Simulate liveness check
    setTimeout(() => {
      setRecordingVideo(false);
      updateFormData("livenessCheckComplete", true);
      toast.success("Liveness verification successful!");
    }, 3000);
  };

  const formatSSN = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 5) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5, 9)}`;
  };

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-slate-900 to-purple-950 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">Account Opening</h1>
          <p className="text-gray-300">Complete your application to join SecureBank</p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8"
        >
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-white">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm font-medium text-white">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />

          {/* Step indicators */}
          <div className="flex justify-between mt-4">
            {[
              { num: 1, label: "Account", icon: CreditCard },
              { num: 2, label: "Identity", icon: Mail },
              { num: 3, label: "Address", icon: MapPin },
              { num: 4, label: "Security", icon: Shield },
              { num: 5, label: "Verify", icon: Camera },
              { num: 6, label: "Funding", icon: Upload },
            ].map(({ num, label, icon: Icon }) => (
              <div key={num} className="flex flex-col items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center mb-1 transition-all
                  ${currentStep > num
                    ? 'bg-green-500 text-white'
                    : currentStep === num
                    ? 'bg-blue-500 text-white ring-4 ring-blue-500/30'
                    : 'bg-gray-700 text-gray-400'
                  }
                `}>
                  {currentStep > num ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <span className={`text-xs font-medium ${
                  currentStep >= num ? 'text-white' : 'text-gray-500'
                }`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Form Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-white/10 backdrop-blur-xl border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-2xl">
                  {currentStep === 1 && "Choose Your Account Type"}
                  {currentStep === 2 && "Identity & Contact Information"}
                  {currentStep === 3 && "Residential Address"}
                  {currentStep === 4 && "Security Setup"}
                  {currentStep === 5 && "Identity Verification (KYC)"}
                  {currentStep === 6 && "Initial Funding"}
                </CardTitle>
                <CardDescription className="text-gray-300">
                  {currentStep === 1 && "Select the type of account that best fits your needs"}
                  {currentStep === 2 && "Provide your personal information and verify your contact details"}
                  {currentStep === 3 && "Confirm your residential address for compliance purposes"}
                  {currentStep === 4 && "Create secure credentials to protect your account"}
                  {currentStep === 5 && "Upload documents to verify your identity"}
                  {currentStep === 6 && "Choose your funding method and initial deposit amount"}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Step 1: Account Type Selection */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <div className="grid gap-4">
                      {/* Checkings Account */}
                      <label
                        className={`flex items-start gap-4 p-6 rounded-xl border-2 cursor-pointer transition-all ${
                          formData.primaryAccountType === "checking"
                            ? "border-blue-500 bg-blue-500/20"
                            : "border-white/20 bg-white/5 hover:bg-white/10"
                        }`}
                      >
                        <input
                          type="radio"
                          name="primaryAccountType"
                          value="checking"
                          checked={formData.primaryAccountType === "checking"}
                          onChange={() => updateFormData("primaryAccountType", "checking")}
                          className="sr-only"
                        />
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          formData.primaryAccountType === "checking"
                            ? "bg-blue-500"
                            : "bg-white/10"
                        }`}>
                          <CreditCard className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-1">Personal Checking</h3>
                          <p className="text-gray-300 mb-3">Perfect for everyday banking and personal finances</p>
                          <ul className="space-y-1 text-sm text-gray-400">
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                              No monthly maintenance fees
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                              Unlimited transactions
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                              Free debit card included
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                              Mobile deposits up to $5,000/day
                            </li>
                          </ul>
                        </div>
                        {formData.primaryAccountType === "checking" && (
                          <Badge className="bg-blue-500 text-white">Selected</Badge>
                        )}
                      </label>

                      {/* Joint Account */}
                      <label
                        className={`flex items-start gap-4 p-6 rounded-xl border-2 cursor-pointer transition-all ${
                          formData.primaryAccountType === "joint"
                            ? "border-purple-500 bg-purple-500/20"
                            : "border-white/20 bg-white/5 hover:bg-white/10"
                        }`}
                      >
                        <input
                          type="radio"
                          name="primaryAccountType"
                          value="joint"
                          checked={formData.primaryAccountType === "joint"}
                          onChange={() => updateFormData("primaryAccountType", "joint")}
                          className="sr-only"
                        />
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          formData.primaryAccountType === "joint"
                            ? "bg-purple-500"
                            : "bg-white/10"
                        }`}>
                          <Mail className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-1">Joint Account</h3>
                          <p className="text-gray-300 mb-3">Shared account for couples, family, or partners</p>
                          <ul className="space-y-1 text-sm text-gray-400">
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                              Shared balance viewing for all members
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                              Individual login credentials per member
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                              Joint budgeting and expense tracking
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                              Customizable permissions per member
                            </li>
                          </ul>
                        </div>
                        {formData.primaryAccountType === "joint" && (
                          <Badge className="bg-purple-500 text-white">Selected</Badge>
                        )}
                      </label>

                      {/* Business Elite */}
                      <label
                        className={`flex items-start gap-4 p-6 rounded-xl border-2 cursor-pointer transition-all ${
                          formData.primaryAccountType === "business_elite"
                            ? "border-amber-500 bg-amber-500/20"
                            : "border-white/20 bg-white/5 hover:bg-white/10"
                        }`}
                      >
                        <input
                          type="radio"
                          name="primaryAccountType"
                          value="business_elite"
                          checked={formData.primaryAccountType === "business_elite"}
                          onChange={() => updateFormData("primaryAccountType", "business_elite")}
                          className="sr-only"
                        />
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          formData.primaryAccountType === "business_elite"
                            ? "bg-amber-500"
                            : "bg-white/10"
                        }`}>
                          <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-bold text-white">Business Elite</h3>
                            <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/50">Premium</Badge>
                          </div>
                          <p className="text-gray-300 mb-3">Premium business account with advanced tools</p>
                          <ul className="space-y-1 text-sm text-gray-400">
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                              Multi-user access with role-based permissions
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                              Expense categorization and team tracking
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                              Invoicing integration and payment links
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                              Higher transaction limits ($50,000/day)
                            </li>
                            <li className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                              Cash flow forecasting tools
                            </li>
                          </ul>
                        </div>
                        {formData.primaryAccountType === "business_elite" && (
                          <Badge className="bg-amber-500 text-white">Selected</Badge>
                        )}
                      </label>
                    </div>

                    <Alert className="bg-blue-500/10 border-blue-500/20">
                      <AlertCircle className="h-4 w-4 text-blue-400" />
                      <AlertDescription className="text-blue-200">
                        You can upgrade or change your account type later from settings. Choose the one that best fits your current needs.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* Step 2: Identity & Contact */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="fullName" className="text-white">Full Legal Name *</Label>
                      <Input
                        id="fullName"
                        value={formData.fullName}
                        onChange={(e) => updateFormData("fullName", e.target.value)}
                        placeholder="John Michael Doe"
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      />
                    </div>

                    <div>
                      <Label htmlFor="dateOfBirth" className="text-white">Date of Birth *</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => updateFormData("dateOfBirth", e.target.value)}
                        max={new Date(Date.now() - 18 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                        className="bg-white/5 border-white/10 text-white"
                      />
                      <p className="text-xs text-gray-400 mt-1">You must be at least 18 years old</p>
                    </div>

                    <div>
                      <Label htmlFor="ssn" className="text-white">Social Security Number *</Label>
                      <Input
                        id="ssn"
                        value={formData.ssn}
                        onChange={(e) => updateFormData("ssn", formatSSN(e.target.value))}
                        placeholder="XXX-XX-XXXX"
                        maxLength={11}
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      />
                      <p className="text-xs text-gray-400 mt-1">Required for tax and regulatory compliance</p>
                    </div>

                    <Separator className="bg-white/10" />

                    <div>
                      <Label htmlFor="email" className="text-white">Email Address *</Label>
                      <div className="flex gap-2">
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => updateFormData("email", e.target.value)}
                          placeholder="john.doe@example.com"
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 flex-1"
                          disabled={formData.emailVerified}
                        />
                        {!formData.emailVerified && (
                          <Button
                            onClick={sendEmailVerification}
                            disabled={emailVerificationSent}
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10"
                          >
                            {emailVerificationSent ? "Sent" : "Verify"}
                          </Button>
                        )}
                        {formData.emailVerified && (
                          <Badge className="bg-green-500 text-white self-center">
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="phoneNumber" className="text-white">Phone Number *</Label>
                      <div className="flex gap-2">
                        <Input
                          id="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={(e) => updateFormData("phoneNumber", formatPhone(e.target.value))}
                          placeholder="(555) 123-4567"
                          maxLength={14}
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 flex-1"
                          disabled={formData.phoneVerified}
                        />
                        {!formData.phoneVerified && (
                          <Button
                            onClick={sendPhoneVerification}
                            disabled={phoneVerificationSent}
                            variant="outline"
                            className="border-white/20 text-white hover:bg-white/10"
                          >
                            {phoneVerificationSent ? "Sent" : "Verify"}
                          </Button>
                        )}
                        {formData.phoneVerified && (
                          <Badge className="bg-green-500 text-white self-center">
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>

                    {phoneVerificationSent && !formData.phoneVerified && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-2"
                      >
                        <Label className="text-white">Enter 6-digit verification code</Label>
                        <div className="flex gap-2">
                          <InputOTP
                            maxLength={6}
                            value={formData.phoneOtp || ""}
                            onChange={(value) => updateFormData("phoneOtp", value)}
                          >
                            <InputOTPGroup>
                              <InputOTPSlot index={0} className="bg-white/5 border-white/20 text-white" />
                              <InputOTPSlot index={1} className="bg-white/5 border-white/20 text-white" />
                              <InputOTPSlot index={2} className="bg-white/5 border-white/20 text-white" />
                              <InputOTPSlot index={3} className="bg-white/5 border-white/20 text-white" />
                              <InputOTPSlot index={4} className="bg-white/5 border-white/20 text-white" />
                              <InputOTPSlot index={5} className="bg-white/5 border-white/20 text-white" />
                            </InputOTPGroup>
                          </InputOTP>
                          <Button
                            onClick={verifyPhoneOtp}
                            disabled={!formData.phoneOtp || formData.phoneOtp.length !== 6}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Confirm
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    <Alert className="bg-blue-500/10 border-blue-500/20">
                      <AlertCircle className="h-4 w-4 text-blue-400" />
                      <AlertDescription className="text-blue-200">
                        All information must match your government-issued ID exactly.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* Step 3: Address */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="streetAddress" className="text-white">Street Address *</Label>
                      <Input
                        id="streetAddress"
                        value={formData.streetAddress}
                        onChange={(e) => updateFormData("streetAddress", e.target.value)}
                        placeholder="123 Main Street, Apt 4B"
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city" className="text-white">City *</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => updateFormData("city", e.target.value)}
                          placeholder="New York"
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                        />
                      </div>

                      <div>
                        <Label htmlFor="state" className="text-white">State *</Label>
                        <Select
                          value={formData.state}
                          onValueChange={(value) => updateFormData("state", value)}
                        >
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-white/10">
                            {US_STATES.map(state => (
                              <SelectItem key={state} value={state} className="text-white">
                                {state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="zipCode" className="text-white">ZIP Code *</Label>
                        <Input
                          id="zipCode"
                          value={formData.zipCode}
                          onChange={(e) => {
                            const cleaned = e.target.value.replace(/\D/g, '');
                            updateFormData("zipCode", cleaned);
                          }}
                          placeholder="10001"
                          maxLength={5}
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                        />
                      </div>

                      <div>
                        <Label htmlFor="country" className="text-white">Country *</Label>
                        <Input
                          id="country"
                          value={formData.country}
                          disabled
                          className="bg-white/5 border-white/10 text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="residencyYears" className="text-white">Years at Current Address *</Label>
                      <Select
                        value={formData.residencyYears}
                        onValueChange={(value) => updateFormData("residencyYears", value)}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-white/10">
                          <SelectItem value="less-1" className="text-white">Less than 1 year</SelectItem>
                          <SelectItem value="1-2" className="text-white">1-2 years</SelectItem>
                          <SelectItem value="2-5" className="text-white">2-5 years</SelectItem>
                          <SelectItem value="5-10" className="text-white">5-10 years</SelectItem>
                          <SelectItem value="10+" className="text-white">10+ years</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {sponsorRequired && (
                      <div className="space-y-2 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
                        <Label htmlFor="sponsorEmail" className="text-amber-100">
                          Sponsor (required for US citizens) *
                        </Label>
                        <div className="flex gap-2 flex-col sm:flex-row">
                          <Input
                            id="sponsorEmail"
                            type="email"
                            value={formData.sponsorEmail}
                            onChange={(e) => {
                              updateFormData("sponsorEmail", e.target.value);
                              updateFormData("sponsorVerified", false);
                            }}
                            placeholder="existing.customer@finbank.eu"
                            className="bg-amber-50/5 border-amber-500/30 text-white placeholder:text-amber-200/70 flex-1"
                            aria-describedby="sponsor-help"
                            required
                          />
                          <Button
                            type="button"
                            onClick={verifySponsor}
                            disabled={!formData.sponsorEmail}
                            className="bg-amber-500 text-white hover:bg-amber-600"
                          >
                            Verify sponsor
                          </Button>
                        </div>
                        {formData.sponsorVerified && (
                          <Badge className="bg-green-500 text-white w-fit">
                            <CheckCircle2 className="w-4 h-4 mr-1" /> Sponsor verified
                          </Badge>
                        )}
                        <p id="sponsor-help" className="text-xs text-amber-100/80">
                          US citizens may proceed only when referred by an existing Fin-Bank customer (relative/family/friend).
                        </p>
                      </div>
                    )}

                    <Alert className="bg-amber-500/10 border-amber-500/20">
                      <AlertCircle className="h-4 w-4 text-amber-400" />
                      <AlertDescription className="text-amber-200">
                        We will validate this address against postal records. P.O. Boxes are not accepted.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* Step 4: Security */}
                {currentStep === 4 && (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="username" className="text-white">Choose a Username *</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => updateFormData("username", e.target.value)}
                        placeholder="johndoe123"
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                      />
                      <p className="text-xs text-gray-400 mt-1">Must be at least 4 characters</p>
                    </div>

                    <div>
                      <Label htmlFor="password" className="text-white">Create Password *</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={formData.password}
                          onChange={(e) => updateFormData("password", e.target.value)}
                          placeholder="••••••••"
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Must include: uppercase, lowercase, number, special character (!@#$%^&*)
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword" className="text-white">Confirm Password *</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={formData.confirmPassword}
                          onChange={(e) => updateFormData("confirmPassword", e.target.value)}
                          placeholder="••••••••"
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <Separator className="bg-white/10" />

                    <div className="space-y-4">
                      <h3 className="text-white font-semibold">Security Questions</h3>
                      <p className="text-sm text-gray-400">Select three different questions and provide answers</p>

                      {/* Question 1 */}
                      <div className="space-y-2">
                        <Label className="text-white">Question 1 *</Label>
                        <Select
                          value={formData.securityQuestion1}
                          onValueChange={(value) => updateFormData("securityQuestion1", value)}
                        >
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue placeholder="Select a question" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-white/10">
                            {SECURITY_QUESTIONS.map((q, i) => (
                              <SelectItem key={i} value={q} className="text-white">{q}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          value={formData.securityAnswer1}
                          onChange={(e) => updateFormData("securityAnswer1", e.target.value)}
                          placeholder="Your answer"
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                        />
                      </div>

                      {/* Question 2 */}
                      <div className="space-y-2">
                        <Label className="text-white">Question 2 *</Label>
                        <Select
                          value={formData.securityQuestion2}
                          onValueChange={(value) => updateFormData("securityQuestion2", value)}
                        >
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue placeholder="Select a question" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-white/10">
                            {SECURITY_QUESTIONS.map((q, i) => (
                              <SelectItem key={i} value={q} className="text-white">{q}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          value={formData.securityAnswer2}
                          onChange={(e) => updateFormData("securityAnswer2", e.target.value)}
                          placeholder="Your answer"
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                        />
                      </div>

                      {/* Question 3 */}
                      <div className="space-y-2">
                        <Label className="text-white">Question 3 *</Label>
                        <Select
                          value={formData.securityQuestion3}
                          onValueChange={(value) => updateFormData("securityQuestion3", value)}
                        >
                          <SelectTrigger className="bg-white/5 border-white/10 text-white">
                            <SelectValue placeholder="Select a question" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-white/10">
                            {SECURITY_QUESTIONS.map((q, i) => (
                              <SelectItem key={i} value={q} className="text-white">{q}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          value={formData.securityAnswer3}
                          onChange={(e) => updateFormData("securityAnswer3", e.target.value)}
                          placeholder="Your answer"
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 5: KYC Verification */}
                {currentStep === 5 && (
                  <div className="space-y-4">
                    <Alert className="bg-blue-500/10 border-blue-500/20">
                      <Camera className="h-4 w-4 text-blue-400" />
                      <AlertDescription className="text-blue-200">
                        We need to verify your identity to comply with federal regulations. All documents are encrypted and stored securely.
                      </AlertDescription>
                    </Alert>

                    <div>
                      <Label className="text-white">ID Document Type *</Label>
                      <Select
                        value={formData.idDocumentType}
                        onValueChange={(value) => updateFormData("idDocumentType", value)}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Select document type" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-white/10">
                          <SelectItem value="drivers_license" className="text-white">Driver's License</SelectItem>
                          <SelectItem value="state_id" className="text-white">State ID Card</SelectItem>
                          <SelectItem value="passport" className="text-white">Passport</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.idDocumentType && (
                      <>
                        <div>
                          <Label className="text-white">Upload Front of ID *</Label>
                          <div className="mt-2">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-colors">
                              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-8 h-8 mb-2 text-gray-400" />
                                <p className="mb-2 text-sm text-gray-400">
                                  {formData.idDocumentFront ? (
                                    <span className="text-green-400">✓ {formData.idDocumentFront.name}</span>
                                  ) : (
                                    <>
                                      <span className="font-semibold">Click to upload</span> or drag and drop
                                    </>
                                  )}
                                </p>
                                <p className="text-xs text-gray-500">JPG or PNG (MAX. 10MB)</p>
                              </div>
                              <input
                                type="file"
                                className="hidden"
                                accept="image/jpeg,image/png,image/jpg"
                                onChange={(e) => handleFileUpload("idDocumentFront", e.target.files?.[0])}
                              />
                            </label>
                          </div>
                        </div>

                        {formData.idDocumentType !== "passport" && (
                          <div>
                            <Label className="text-white">Upload Back of ID *</Label>
                            <div className="mt-2">
                              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-lg cursor-pointer bg-white/5 hover:bg-white/10 transition-colors">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <Upload className="w-8 h-8 mb-2 text-gray-400" />
                                  <p className="mb-2 text-sm text-gray-400">
                                    {formData.idDocumentBack ? (
                                      <span className="text-green-400">✓ {formData.idDocumentBack.name}</span>
                                    ) : (
                                      <>
                                        <span className="font-semibold">Click to upload</span> or drag and drop
                                      </>
                                    )}
                                  </p>
                                  <p className="text-xs text-gray-500">JPG or PNG (MAX. 10MB)</p>
                                </div>
                                <input
                                  type="file"
                                  className="hidden"
                                  accept="image/jpeg,image/png,image/jpg"
                                  onChange={(e) => handleFileUpload("idDocumentBack", e.target.files?.[0])}
                                />
                              </label>
                            </div>
                          </div>
                        )}

                        <Separator className="bg-white/10" />

                        <div>
                          <Label className="text-white">Liveness Verification *</Label>
                          <p className="text-sm text-gray-400 mb-3">
                            Complete a quick video check to verify your identity matches your ID
                          </p>

                          {!formData.livenessCheckComplete ? (
                            <Button
                              onClick={startLivenessCheck}
                              disabled={recordingVideo}
                              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              {recordingVideo ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Recording... Please blink twice
                                </>
                              ) : (
                                <>
                                  <Camera className="w-4 h-4 mr-2" />
                                  Start Liveness Check
                                </>
                              )}
                            </Button>
                          ) : (
                            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center gap-3">
                              <CheckCircle2 className="w-6 h-6 text-green-400" />
                              <div>
                                <p className="text-white font-medium">Liveness check completed</p>
                                <p className="text-sm text-gray-400">Your identity has been verified</p>
                              </div>
                            </div>
                          )}
                        </div>

                        <Alert className="bg-amber-500/10 border-amber-500/20">
                          <AlertCircle className="h-4 w-4 text-amber-400" />
                          <AlertDescription className="text-amber-200">
                            Your application will be placed under review. This typically takes 1-2 business days.
                          </AlertDescription>
                        </Alert>
                      </>
                    )}
                  </div>
                )}

                {/* Step 6: Initial Funding */}
                {currentStep === 6 && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-white mb-3 block">Select Account Types *</Label>
                      <div className="space-y-3">
                        <label className="flex items-start gap-3 p-4 rounded-lg border border-white/20 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                          <Checkbox
                            checked={formData.accountTypes.includes("checking")}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                updateFormData("accountTypes", [...formData.accountTypes, "checking"]);
                              } else {
                                updateFormData("accountTypes", formData.accountTypes.filter(t => t !== "checking"));
                              }
                            }}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <p className="text-white font-medium">Checking Account</p>
                            <p className="text-sm text-gray-400">No monthly fees, unlimited transactions, debit card included</p>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 p-4 rounded-lg border border-white/20 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                          <Checkbox
                            checked={formData.accountTypes.includes("savings")}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                updateFormData("accountTypes", [...formData.accountTypes, "savings"]);
                              } else {
                                updateFormData("accountTypes", formData.accountTypes.filter(t => t !== "savings"));
                              }
                            }}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <p className="text-white font-medium">Savings Account</p>
                            <p className="text-sm text-gray-400">High-yield savings with 4.5% APY, FDIC insured up to $250,000</p>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 p-4 rounded-lg border border-white/20 bg-white/5 cursor-pointer hover:bg-white/10 transition-colors">
                          <Checkbox
                            checked={formData.accountTypes.includes("credit_card")}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                updateFormData("accountTypes", [...formData.accountTypes, "credit_card"]);
                              } else {
                                updateFormData("accountTypes", formData.accountTypes.filter(t => t !== "credit_card"));
                              }
                            }}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <p className="text-white font-medium">Credit Card Application</p>
                            <p className="text-sm text-gray-400">2% cash back on all purchases, no annual fee, subject to credit approval</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    <Separator className="bg-white/10" />

                    <div>
                      <Label className="text-white">Initial Deposit Method *</Label>
                      <Select
                        value={formData.initialDepositMethod}
                        onValueChange={(value) => updateFormData("initialDepositMethod", value)}
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Select funding method" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-white/10">
                          <SelectItem value="external_ach" className="text-white">Link External Bank (ACH Transfer)</SelectItem>
                          <SelectItem value="check" className="text-white">Mail a Check</SelectItem>
                          <SelectItem value="wire" className="text-white">Wire Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="initialDepositAmount" className="text-white">Initial Deposit Amount *</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                        <Input
                          id="initialDepositAmount"
                          type="number"
                          min="25"
                          step="0.01"
                          value={formData.initialDepositAmount}
                          onChange={(e) => updateFormData("initialDepositAmount", e.target.value)}
                          placeholder="100.00"
                          className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 pl-7"
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Minimum deposit: $25.00</p>
                    </div>

                    {formData.initialDepositMethod === "external_ach" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        className="space-y-4 pt-4"
                      >
                        <h3 className="text-white font-semibold">External Bank Details</h3>

                        <div>
                          <Label htmlFor="externalBankName" className="text-white">Bank Name *</Label>
                          <Input
                            id="externalBankName"
                            value={formData.externalBankName || ""}
                            onChange={(e) => updateFormData("externalBankName", e.target.value)}
                            placeholder="Chase Bank"
                            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                          />
                        </div>

                        <div>
                          <Label htmlFor="externalRoutingNumber" className="text-white">Routing Number (9 digits) *</Label>
                          <Input
                            id="externalRoutingNumber"
                            value={formData.externalRoutingNumber || ""}
                            onChange={(e) => {
                              const cleaned = e.target.value.replace(/\D/g, '');
                              updateFormData("externalRoutingNumber", cleaned);
                            }}
                            placeholder="051000017"
                            maxLength={9}
                            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                          />
                        </div>

                        <div>
                          <Label htmlFor="externalAccountNumber" className="text-white">Account Number (10-12 digits) *</Label>
                          <Input
                            id="externalAccountNumber"
                            value={formData.externalAccountNumber || ""}
                            onChange={(e) => {
                              const cleaned = e.target.value.replace(/\D/g, '');
                              updateFormData("externalAccountNumber", cleaned);
                            }}
                            placeholder="1234567890"
                            maxLength={12}
                            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500"
                          />
                        </div>

                        <Alert className="bg-blue-500/10 border-blue-500/20">
                          <AlertCircle className="h-4 w-4 text-blue-400" />
                          <AlertDescription className="text-blue-200">
                            We'll send two small deposits (less than $1) to verify your account. This process takes 1-2 business days.
                          </AlertDescription>
                        </Alert>
                      </motion.div>
                    )}

                    {formData.initialDepositMethod === "check" && (
                      <Alert className="bg-amber-500/10 border-amber-500/20">
                        <AlertCircle className="h-4 w-4 text-amber-400" />
                        <AlertDescription className="text-amber-200">
                          Mail your check to: SecureBank, PO Box 12345, New York, NY 10001. Include your application reference number.
                        </AlertDescription>
                      </Alert>
                    )}

                    {formData.initialDepositMethod === "wire" && (
                      <Alert className="bg-blue-500/10 border-blue-500/20">
                        <AlertCircle className="h-4 w-4 text-blue-400" />
                        <AlertDescription className="text-blue-200">
                          Wire transfer details will be provided after application approval. Standard wire fees apply ($25 domestic, $45 international).
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-between mt-6 gap-4"
        >
          <Button
            onClick={currentStep === 1 ? onCancel : handlePrevious}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
            disabled={isSubmitting}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            {currentStep === 1 ? "Cancel" : "Previous"}
          </Button>

          {currentStep < totalSteps ? (
            <Button
              onClick={handleNext}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Next Step
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Application
                  <CheckCircle2 className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
