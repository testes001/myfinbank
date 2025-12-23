import React, { createContext, useContext, useState, useEffect } from "react";
import type { AuthUser } from "@/lib/auth";
import { getKYCData, hasCompletedKYC, isPendingKYC, saveKYCData } from "@/lib/kyc-storage";

// Demo user emails that should bypass KYC
const DEMO_USER_EMAILS = [
  "alice@demo.com",
  "bob@demo.com",
  "charlie@demo.com",
  "diana@demo.com",
  "evan@demo.com",
];

// Ensure demo user has approved KYC data
function ensureDemoUserKYC(userId: string, email: string) {
  if (!DEMO_USER_EMAILS.includes(email)) return;

  const existingKYC = getKYCData(userId);
  if (!existingKYC || existingKYC.kycStatus !== "approved") {
    const now = new Date().toISOString();
    saveKYCData(userId, {
      userId,
      primaryAccountType: "checking",
      dateOfBirth: "1990-01-15",
      ssn: "X1234567", // EU ID placeholder
      phoneNumber: "+34 900 123 456",
      phoneVerified: true,
      emailVerified: true,
      streetAddress: "Calle de Alcalá 45",
      city: "Madrid",
      state: "Madrid",
      zipCode: "28014",
      country: "ES",
      residencyYears: "5+",
      securityQuestions: [
        { question: "What is your mother's maiden name?", answer: "Demo" },
        { question: "What city were you born in?", answer: "Demo" },
        { question: "What is your favorite movie?", answer: "Demo" },
      ],
      idDocumentType: "dni",
      idDocumentFrontUrl: "https://secure-storage.example.com/demo-id-front.jpg",
      idDocumentBackUrl: "https://secure-storage.example.com/demo-id-back.jpg",
      livenessCheckComplete: true,
      livenessCheckTimestamp: now,
      accountTypes: ["checking"],
      initialDepositMethod: "external_ach",
      initialDepositAmount: "1000.00",
      kycStatus: "approved",
      kycSubmittedAt: now,
      kycReviewedAt: now,
      createdAt: now,
      updatedAt: now,
    });
  }
}

export type UserStatus = "onboarding" | "pending_kyc" | "active" | "suspended";

interface AuthContextType {
  currentUser: AuthUser | null;
  setCurrentUser: (user: AuthUser | null) => void;
  logout: () => void;
  isLoading: boolean;
  userStatus: UserStatus | null;
  refreshUserStatus: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);

  const calculateUserStatus = (user: AuthUser | null): UserStatus | null => {
    if (!user) return null;

    const kycData = getKYCData(user.user.id);

    // User hasn't started onboarding
    if (!kycData) {
      return "onboarding";
    }

    // User has completed onboarding but KYC is pending
    if (isPendingKYC(user.user.id)) {
      return "pending_kyc";
    }

    // User is fully approved
    if (hasCompletedKYC(user.user.id)) {
      return "active";
    }

    // Default to pending
    return "pending_kyc";
  };

  const refreshUserStatus = () => {
    setUserStatus(calculateUserStatus(currentUser));
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("bankingUser");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser) as AuthUser;
        // Ensure demo users have approved KYC data
        ensureDemoUserKYC(user.user.id, user.user.email);
        setCurrentUser(user);
        setUserStatus(calculateUserStatus(user));
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("bankingUser");
      }
    }
    setIsLoading(false);
  }, []);

  const handleSetCurrentUser = (user: AuthUser | null) => {
    setCurrentUser(user);
    setUserStatus(calculateUserStatus(user));
    if (user) {
      localStorage.setItem("bankingUser", JSON.stringify(user));
    } else {
      localStorage.removeItem("bankingUser");
    }
  };

  const logout = () => {
    handleSetCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser: handleSetCurrentUser,
        logout,
        isLoading,
        userStatus,
        refreshUserStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
