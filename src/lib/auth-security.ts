/**
 * Enhanced Authentication Security
 * IP detection, device tracking, and fund access restrictions
 */

import {
  fetchIPGeolocation,
  generateDeviceFingerprint,
  registerKnownDevice,
  isKnownDevice,
  logSecurityEvent,
  applyFundRestriction,
  assessLoginRisk,
} from "./ip-geolocation";
import type { AuthUser } from "./auth";

export interface LoginSecurityContext {
  ipData: any;
  deviceFingerprint: any;
  riskLevel: "low" | "medium" | "high";
  isNewDevice: boolean;
  fundAccessRestricted: boolean;
  restrictionReason?: string;
}

/**
 * Perform security checks during login
 * Returns context about the login and whether fund access should be restricted
 */
export async function performLoginSecurityCheck(
  user: AuthUser,
): Promise<LoginSecurityContext> {
  try {
    // Fetch IP geolocation
    const ipData = await fetchIPGeolocation();
    if (!ipData) {
      console.warn("Could not fetch IP geolocation data");
    }

    // Generate device fingerprint
    const deviceFingerprint = generateDeviceFingerprint();

    // Assess login risk
    const riskLevel = assessLoginRisk(
      user.user.id,
      deviceFingerprint.deviceId,
      ipData?.ip || "unknown",
      ipData?.country || "unknown",
    );

    // Check if this is a new device
    const isNew =
      !isKnownDevice(
        user.user.id,
        deviceFingerprint.deviceId,
        ipData?.ip || "unknown",
      );

    // Log security event
    logSecurityEvent({
      userId: user.user.id,
      eventType: "login",
      ipAddress: ipData?.ip || "unknown",
      deviceId: deviceFingerprint.deviceId,
      country: ipData?.country || "unknown",
      city: ipData?.city || "unknown",
      timestamp: new Date().toISOString(),
      riskLevel,
      details: isNew ? "New device detected" : undefined,
    });

    // Register device if new
    if (isNew && ipData) {
      registerKnownDevice(user.user.id, ipData, deviceFingerprint);
    }

    // Determine if fund access should be restricted
    let fundAccessRestricted = false;
    let restrictionReason: string | undefined;

    // Restrict funds on high-risk logins from new devices
    if (riskLevel === "high" && isNew) {
      applyFundRestriction(user.user.id, "suspicious_activity", 24);
      fundAccessRestricted = true;
      restrictionReason = "suspicious_activity";
    }

    // Restrict funds on medium-risk logins from very new devices (first 24 hours)
    if (riskLevel === "medium" && isNew) {
      const createdAt = new Date(user.user.created_at).getTime();
      const now = Date.now();
      const hoursSinceCreation = (now - createdAt) / (1000 * 60 * 60);

      if (hoursSinceCreation < 24) {
        applyFundRestriction(user.user.id, "new_device", 24);
        fundAccessRestricted = true;
        restrictionReason = "new_device";
      }
    }

    return {
      ipData,
      deviceFingerprint,
      riskLevel,
      isNewDevice: isNew,
      fundAccessRestricted,
      restrictionReason,
    };
  } catch (error) {
    console.error("Error performing login security check:", error);
    // Fail open - allow login but with restrictions
    return {
      ipData: null,
      deviceFingerprint: generateDeviceFingerprint(),
      riskLevel: "medium",
      isNewDevice: true,
      fundAccessRestricted: true,
      restrictionReason: "security_check_failed",
    };
  }
}

/**
 * Perform security checks during password reset
 * Triggers fund restrictions if reset is from unknown device
 */
export async function performPasswordResetSecurityCheck(userId: string): Promise<{
  ipData: any;
  deviceFingerprint: any;
  riskLevel: "low" | "medium" | "high";
  isNewDevice: boolean;
}> {
  try {
    const ipData = await fetchIPGeolocation();
    const deviceFingerprint = generateDeviceFingerprint();

    const riskLevel = assessLoginRisk(
      userId,
      deviceFingerprint.deviceId,
      ipData?.ip || "unknown",
      ipData?.country || "unknown",
    );

    const isNew = !isKnownDevice(
      userId,
      deviceFingerprint.deviceId,
      ipData?.ip || "unknown",
    );

    // Log security event
    logSecurityEvent({
      userId,
      eventType: "password_reset",
      ipAddress: ipData?.ip || "unknown",
      deviceId: deviceFingerprint.deviceId,
      country: ipData?.country || "unknown",
      city: ipData?.city || "unknown",
      timestamp: new Date().toISOString(),
      riskLevel,
      details: isNew ? "Password reset from unknown device" : undefined,
    });

    // Apply fund restriction if reset is from unknown device
    if (isNew) {
      applyFundRestriction(userId, "password_reset_unknown_device", 24);
    }

    return {
      ipData,
      deviceFingerprint,
      riskLevel,
      isNewDevice: isNew,
    };
  } catch (error) {
    console.error("Error performing password reset security check:", error);
    return {
      ipData: null,
      deviceFingerprint: generateDeviceFingerprint(),
      riskLevel: "medium",
      isNewDevice: true,
    };
  }
}

/**
 * Check if a user's fund access is currently restricted
 * and format the restriction message
 */
export function getFundRestrictionStatus(userId: string): {
  restricted: boolean;
  hoursRemaining: number;
  message: string;
} {
  try {
    const stored = localStorage.getItem(`fin_bank_fund_restrictions_${userId}`);
    if (!stored) {
      return {
        restricted: false,
        hoursRemaining: 0,
        message: "",
      };
    }

    const restrictions = JSON.parse(stored);
    const now = Date.now();

    const activeRestrictions = restrictions.filter((r: any) => {
      const expiresAt = new Date(r.expiresAt).getTime();
      return now < expiresAt;
    });

    if (activeRestrictions.length === 0) {
      return {
        restricted: false,
        hoursRemaining: 0,
        message: "",
      };
    }

    const restriction = activeRestrictions[0];
    const expiresAt = new Date(restriction.expiresAt).getTime();
    const hoursRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60));

    let message = "";
    switch (restriction.reason) {
      case "password_reset_unknown_device":
        message = `For your security, fund transfers are restricted for ${hoursRemaining} more hour${hoursRemaining !== 1 ? "s" : ""} after a password reset from a new device.`;
        break;
      case "suspicious_activity":
        message = `For your security, fund access is temporarily restricted due to unusual activity. ${hoursRemaining} hour${hoursRemaining !== 1 ? "s" : ""} remaining.`;
        break;
      case "new_device":
        message = `Fund transfers are restricted for ${hoursRemaining} more hour${hoursRemaining !== 1 ? "s" : ""} when using a new device for the first time.`;
        break;
      default:
        message = `Fund access is temporarily restricted. ${hoursRemaining} hour${hoursRemaining !== 1 ? "s" : ""} remaining.`;
    }

    return {
      restricted: true,
      hoursRemaining,
      message,
    };
  } catch (error) {
    console.error("Error checking fund restriction status:", error);
    return {
      restricted: false,
      hoursRemaining: 0,
      message: "",
    };
  }
}

/**
 * Format device info for email notifications
 */
export function formatDeviceInfoForEmail(
  ipData: any,
  deviceFingerprint: any,
): string {
  const lines = [];

  if (deviceFingerprint) {
    lines.push(`Device: ${deviceFingerprint.browser} on ${deviceFingerprint.os}`);
    lines.push(`Device Type: ${deviceFingerprint.deviceType}`);
  }

  if (ipData) {
    lines.push(`Location: ${ipData.city}, ${ipData.country}`);
    lines.push(`IP Address: ${ipData.ip}`);
    lines.push(`ISP: ${ipData.isp}`);
  }

  lines.push(`Time: ${new Date().toLocaleString()}`);

  return lines.join("\n");
}
