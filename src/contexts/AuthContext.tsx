import React, { createContext, useContext, useState, useEffect } from "react";
import type { AuthUser } from "@/lib/auth";
import { fetchAccounts, fetchKycStatus, fetchProfile, type KycStatusResponse } from "@/lib/backend";
import { getStoredAccessToken, persistAccessToken } from "@/lib/api-client";

export type UserStatus = "onboarding" | "pending_kyc" | "active" | "suspended";

interface AuthContextType {
  currentUser: AuthUser | null;
  setCurrentUser: (user: AuthUser | null) => void;
  establishSession: (accessToken: string, bootstrapUser?: any) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  userStatus: UserStatus | null;
  refreshUserStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);

  const deriveStatusFromKyc = (kyc: KycStatusResponse | null): UserStatus | null => {
    if (!kyc) return "onboarding";

    if (kyc.kycStatus === "APPROVED" || kyc.verification?.status === "APPROVED") {
      return "active";
    }

    if (kyc.verification === null) {
      return "onboarding";
    }

    if (kyc.kycStatus === "REJECTED") {
      return "suspended";
    }

    return "pending_kyc";
  };

  const refreshUserStatus = async () => {
    if (!currentUser?.accessToken) {
      setUserStatus(null);
      return;
    }
    try {
      const status = await fetchKycStatus(currentUser.accessToken);
      setUserStatus(deriveStatusFromKyc(status));
    } catch (err) {
      console.error("Failed to refresh KYC status", err);
    }
  };

  const establishSession = async (accessToken: string, bootstrapUser?: any) => {
    setIsLoading(true);
    try {
      const [profile, accounts, kyc] = await Promise.all([
        fetchProfile(accessToken),
        fetchAccounts(accessToken).catch(() => []),
        fetchKycStatus(accessToken).catch(() => null),
      ]);

      const primaryAccount = accounts[0] || { id: "", user_id: profile.id };
      const nextUser: AuthUser = {
        user: bootstrapUser || profile,
        account: primaryAccount,
        accounts,
        accessToken,
      };

      setCurrentUser(nextUser);
      persistAccessToken(accessToken);
      setUserStatus(deriveStatusFromKyc(kyc));
      localStorage.setItem("bankingUser", JSON.stringify(nextUser));
    } catch (err) {
      console.error("Failed to establish session", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const token = getStoredAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    establishSession(token).catch((err) => {
      console.error("Session bootstrap failed", err);
      persistAccessToken(null);
      setCurrentUser(null);
      setUserStatus(null);
    }).finally(() => setIsLoading(false));
  }, []);

  const handleSetCurrentUser = (user: AuthUser | null) => {
    setCurrentUser(user);
    if (user?.accessToken) {
      persistAccessToken(user.accessToken);
      localStorage.setItem("bankingUser", JSON.stringify(user));
    } else {
      persistAccessToken(null);
      localStorage.removeItem("bankingUser");
    }
  };

  const logout = () => {
    handleSetCurrentUser(null);
    setUserStatus(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        setCurrentUser: handleSetCurrentUser,
        establishSession,
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
