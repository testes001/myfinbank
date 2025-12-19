/**
 * Fund Access Restriction Banner
 * Displays when user has 24-hour fund access delay after password reset from unknown device
 */

import { useState, useEffect } from "react";
import { AlertCircle, Clock } from "lucide-react";
import { isFundAccessRestricted, getFundRestrictionTimeRemaining } from "@/lib/ip-geolocation";
import { motion, AnimatePresence } from "framer-motion";

interface FundAccessRestrictionBannerProps {
  userId: string;
}

export function FundAccessRestrictionBanner({ userId }: FundAccessRestrictionBannerProps) {
  const [isRestricted, setIsRestricted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [displayTime, setDisplayTime] = useState("");

  useEffect(() => {
    const checkRestriction = () => {
      const restricted = isFundAccessRestricted(userId);
      setIsRestricted(restricted);

      if (restricted) {
        const remaining = getFundRestrictionTimeRemaining(userId);
        setTimeRemaining(remaining);

        // Format remaining time
        const hours = Math.floor(remaining / (1000 * 60 * 60));
        const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
        setDisplayTime(`${hours}h ${minutes}m`);
      }
    };

    checkRestriction();

    // Update every minute
    const interval = setInterval(checkRestriction, 60000);
    return () => clearInterval(interval);
  }, [userId]);

  // Countdown for remaining time
  useEffect(() => {
    if (!isRestricted) return;

    const updateCountdown = () => {
      const remaining = getFundRestrictionTimeRemaining(userId);

      if (remaining <= 0) {
        setIsRestricted(false);
        return;
      }

      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      setDisplayTime(`${hours}h ${minutes}m`);
    };

    const interval = setInterval(updateCountdown, 60000);
    return () => clearInterval(interval);
  }, [isRestricted, userId]);

  return (
    <AnimatePresence>
      {isRestricted && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded-lg p-4 mb-4"
        >
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                Security Delay Active
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                For your security, fund transfers are temporarily disabled after a password reset from a new device.
              </p>
              <div className="flex items-center gap-2 text-sm font-medium text-amber-700 dark:text-amber-300">
                <Clock className="w-4 h-4" />
                <span>Access restored in {displayTime}</span>
              </div>
            </div>
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
