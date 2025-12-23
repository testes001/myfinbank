import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { fetchIPGeolocation } from "@/lib/ip-geolocation";

interface SessionSecurityOptions {
  inactivityTimeout?: number; // in milliseconds, default 15 minutes
  enableIpMonitoring?: boolean;
}

export function useSessionSecurity(options: SessionSecurityOptions = {}) {
  const { inactivityTimeout = 15 * 60 * 1000, enableIpMonitoring = true } = options;
  const { logout, currentUser } = useAuth();
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const ipAddressRef = useRef<string>("");

  // Reset inactivity timer
  const resetInactivityTimer = () => {
    lastActivityRef.current = Date.now();

    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setTimeout(() => {
      if (currentUser) {
        toast.error("Session expired due to inactivity");
        logout();
      }
    }, inactivityTimeout);
  };

  // Monitor IP address changes (real lookup with graceful fallback)
  const checkIpAddress = async () => {
    if (!enableIpMonitoring) return;

    try {
      const geo = await fetchIPGeolocation();
      if (!geo) return;

      if (ipAddressRef.current && ipAddressRef.current !== geo.ip) {
        toast.warning("Login from new location detected", {
          description: `${geo.city || "Unknown city"}, ${geo.country || "Unknown country"}`,
        });
      }

      ipAddressRef.current = geo.ip;
      // expose for signup guard reuse
      (window as any).__finbankCountryCode = geo.countryCode;
    } catch (error) {
      console.error("Failed to check IP address:", error);
    }
  };

  useEffect(() => {
    if (!currentUser) return;

    // Initialize IP monitoring
    checkIpAddress();

    // Set up activity listeners
    const activityEvents = ["mousedown", "keydown", "scroll", "touchstart"];

    const handleActivity = () => {
      resetInactivityTimer();
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // Start the initial timer
    resetInactivityTimer();

    // Show session info toast
    const timeoutMinutes = Math.floor(inactivityTimeout / 60000);
    toast.info(`Session Security Active`, {
      description: `Auto-logout after ${timeoutMinutes} minutes of inactivity`,
    });

    // Cleanup
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [currentUser, inactivityTimeout, enableIpMonitoring]);

  return {
    lastActivity: lastActivityRef.current,
    resetSession: resetInactivityTimer,
    currentIp: ipAddressRef.current,
  };
}
