import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface SessionSecurityOptions {
  inactivityTimeout?: number; // in milliseconds, default 15 minutes
  enableIpMonitoring?: boolean;
}

export function useSessionSecurity(options: SessionSecurityOptions = {}) {
  const { inactivityTimeout = 15 * 60 * 1000, enableIpMonitoring = true } = options;
  const { logout, currentUser } = useAuth();
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
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

  // Monitor IP address changes (simulated)
  const checkIpAddress = async () => {
    if (!enableIpMonitoring) return;

    try {
      // In a real app, you would fetch the actual IP from an API
      // For simulation, we'll generate a mock IP
      const mockIp = `192.168.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

      if (ipAddressRef.current && ipAddressRef.current !== mockIp) {
        toast.warning("Login from new location detected", {
          description: "If this wasn't you, please contact support immediately",
        });
      }

      ipAddressRef.current = mockIp;
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
