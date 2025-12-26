import { useState } from "react";
import { LandingPage } from "@/components/LandingPage";
import { LoginForm } from "@/components/LoginForm";

export type AuthGatewayState = "landing" | "login";

/**
 * Authentication Gateway
 * Displays landing page initially, then switches to login form
 * Provides smooth transition from marketing to authentication
 */
export function AuthenticationGateway() {
  const [state, setAuthState] = useState<AuthGatewayState>("landing");

  const handleSignupClick = () => {
    window.location.href = "/account-type";
  };

  const handleBackToLanding = () => {
    setAuthState("landing");
  };

  if (state === "landing") {
    return <LandingPage onSignupClick={handleSignupClick} />;
  }

  return <LoginForm onShowLanding={handleBackToLanding} />;
}
