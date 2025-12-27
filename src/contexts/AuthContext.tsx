import React, { createContext, useContext, useState, useEffect } from "react";
import type { AuthUser } from "@/lib/auth";
import { logoutUser } from "@/lib/auth";
import { fetchAccounts, fetchKycStatus, fetchProfile, type KycStatusResponse } from "@/lib/backend";
import { getStoredAccessToken, persistAccessToken, refreshAccessToken } from "@/lib/api-client";
import { clearSecureStorage } from "@/lib/secure-storage";

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
      const nextToken = await refreshAccessToken();
      if (nextToken && currentUser.accessToken !== nextToken) {
        setCurrentUser((prev) => (prev ? { ...prev, accessToken: nextToken } : prev));
      }
      const status = await fetchKycStatus(currentUser.accessToken);
      setUserStatus(deriveStatusFromKyc(status));
    } catch (err) {
      console.error("Failed to refresh KYC status", err);
    }
  };

  const establishSession = async (accessToken: string, bootstrapUser?: any) => {
    setIsLoading(true);
    try {
      const tokenToUse = (await refreshAccessToken()) || accessToken;
      const [profile, accounts, kyc] = await Promise.all([
        fetchProfile(tokenToUse),
        fetchAccounts(tokenToUse).catch(() => []),
        fetchKycStatus(tokenToUse).catch(() => null),
      ]);

      const primaryAccount = accounts[0] || { id: "", user_id: profile.id };
      const nextUser: AuthUser = {
        user: bootstrapUser || profile,
        account: primaryAccount,
        accounts,
        accessToken: tokenToUse,
      };

      setCurrentUser(nextUser);
      persistAccessToken(tokenToUse);
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

  const logout = async () => {
    try {
      // Invalidate session on server
      await logoutUser();
    } catch (error) {
      console.error("Server logout failed:", error);
    } finally {
      // Always clear local state even if server logout fails
      handleSetCurrentUser(null);
      setUserStatus(null);
    }
  };

  // Keep tokens fresh in the background
  useEffect(() => {
    if (!currentUser?.accessToken) return;
    const interval = setInterval(async () => {
      const next = await refreshAccessToken();
      if (next && next !== currentUser.accessToken) {
        setCurrentUser((prev) => (prev ? { ...prev, accessToken: next } : prev));
      }
    }, 10 * 60 * 1000); // every 10 minutes
    return () => clearInterval(interval);
  }, [currentUser?.accessToken]);

  useEffect(() => {
    const onFocus = async () => {
      const next = await refreshAccessToken();
      if (next && next !== currentUser?.accessToken) {
        setCurrentUser((prev) => (prev ? { ...prev, accessToken: next } : prev));
      }
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [currentUser?.accessToken]);

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
