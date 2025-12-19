/**
 * IP Geolocation and Device Fingerprinting
 * Tracks login locations and detects suspicious activity
 */

export interface IPGeolocationData {
  ip: string;
  country: string;
  countryCode: string;
  city: string;
  region: string;
  timezone: string;
  latitude: number;
  longitude: number;
  isp: string;
  timestamp: string;
}

export interface DeviceFingerprint {
  deviceId: string;
  userAgent: string;
  browser: string;
  os: string;
  deviceType: "mobile" | "tablet" | "desktop";
  timestamp: string;
}

export interface KnownDevice {
  id: string;
  userId: string;
  deviceId: string;
  ipAddress: string;
  country: string;
  city: string;
  deviceName: string;
  lastUsed: string;
  verified: boolean;
}

export interface SecurityEvent {
  id: string;
  userId: string;
  eventType: "login" | "password_reset" | "transfer" | "unknown_device";
  ipAddress: string;
  deviceId: string;
  country: string;
  city: string;
  timestamp: string;
  riskLevel: "low" | "medium" | "high";
  details?: string;
}

const STORAGE_KEY_KNOWN_DEVICES = "fin_bank_known_devices";
const STORAGE_KEY_SECURITY_EVENTS = "fin_bank_security_events";
const STORAGE_KEY_FUND_RESTRICTIONS = "fin_bank_fund_restrictions";

/**
 * Fetch IP geolocation data from a free API
 * Uses ipapi.co (no API key required for reasonable rate limits)
 */
export async function fetchIPGeolocation(): Promise<IPGeolocationData | null> {
  try {
    // Using ipapi.co - free tier, no authentication needed
    const response = await fetch("https://ipapi.co/json/", {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      console.error("Failed to fetch IP geolocation");
      return null;
    }

    const data = await response.json();

    return {
      ip: data.ip,
      country: data.country_name,
      countryCode: data.country_code,
      city: data.city,
      region: data.region,
      timezone: data.timezone,
      latitude: data.latitude,
      longitude: data.longitude,
      isp: data.org,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error fetching IP geolocation:", error);
    return null;
  }
}

/**
 * Generate device fingerprint based on browser and device info
 */
export function generateDeviceFingerprint(): DeviceFingerprint {
  const ua = navigator.userAgent;
  let browser = "Unknown";
  let os = "Unknown";
  let deviceType: "mobile" | "tablet" | "desktop" = "desktop";

  // Detect browser
  if (ua.indexOf("Firefox") > -1) browser = "Firefox";
  else if (ua.indexOf("Chrome") > -1) browser = "Chrome";
  else if (ua.indexOf("Safari") > -1) browser = "Safari";
  else if (ua.indexOf("Edge") > -1) browser = "Edge";

  // Detect OS
  if (ua.indexOf("Win") > -1) os = "Windows";
  else if (ua.indexOf("Mac") > -1) os = "macOS";
  else if (ua.indexOf("Linux") > -1) os = "Linux";
  else if (ua.indexOf("Android") > -1) os = "Android";
  else if (ua.indexOf("iOS") > -1 || ua.indexOf("iPhone") > -1) os = "iOS";

  // Detect device type
  if (/mobile|android|iphone|ipad/i.test(ua.toLowerCase())) {
    deviceType = /ipad|android(?!.*mobile)/i.test(ua.toLowerCase()) ? "tablet" : "mobile";
  }

  // Simple device ID hash (combining screen resolution, language, timezone)
  const deviceIdData =
    `${screen.width}${screen.height}${navigator.language}${new Date().getTimezoneOffset()}`;
  const deviceId = btoa(deviceIdData); // Simple base64 encoding

  return {
    deviceId,
    userAgent: ua,
    browser,
    os,
    deviceType,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Register a known device for a user
 */
export function registerKnownDevice(
  userId: string,
  ipData: IPGeolocationData,
  deviceFingerprint: DeviceFingerprint,
  deviceName?: string,
): KnownDevice {
  const device: KnownDevice = {
    id: `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId,
    deviceId: deviceFingerprint.deviceId,
    ipAddress: ipData.ip,
    country: ipData.country,
    city: ipData.city,
    deviceName: deviceName || `${deviceFingerprint.os} - ${deviceFingerprint.browser}`,
    lastUsed: new Date().toISOString(),
    verified: false,
  };

  const knownDevices = getKnownDevices(userId);
  knownDevices.push(device);
  localStorage.setItem(`${STORAGE_KEY_KNOWN_DEVICES}_${userId}`, JSON.stringify(knownDevices));

  return device;
}

/**
 * Get all known devices for a user
 */
export function getKnownDevices(userId: string): KnownDevice[] {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_KNOWN_DEVICES}_${userId}`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Check if a device/IP combination is known
 */
export function isKnownDevice(
  userId: string,
  deviceId: string,
  ipAddress: string,
): boolean {
  const knownDevices = getKnownDevices(userId);
  return knownDevices.some(
    (device) => device.deviceId === deviceId && device.ipAddress === ipAddress,
  );
}

/**
 * Log a security event (login, password reset, transfer, etc.)
 */
export function logSecurityEvent(event: Omit<SecurityEvent, "id">): SecurityEvent {
  const securityEvent: SecurityEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...event,
  };

  const events = getSecurityEvents(event.userId);
  events.push(securityEvent);

  // Keep only last 100 events per user
  const recentEvents = events.slice(-100);
  localStorage.setItem(
    `${STORAGE_KEY_SECURITY_EVENTS}_${event.userId}`,
    JSON.stringify(recentEvents),
  );

  return securityEvent;
}

/**
 * Get security events for a user
 */
export function getSecurityEvents(userId: string): SecurityEvent[] {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_SECURITY_EVENTS}_${userId}`);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Check if fund access is restricted for a user
 * (e.g., 24-hour delay after password reset from unknown device)
 */
export function isFundAccessRestricted(userId: string): boolean {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_FUND_RESTRICTIONS}_${userId}`);
    if (!stored) return false;

    const restrictions = JSON.parse(stored);
    const now = Date.now();

    // Check if any restriction is still active
    return restrictions.some((restriction: any) => {
      const expiresAt = new Date(restriction.expiresAt).getTime();
      return now < expiresAt;
    });
  } catch {
    return false;
  }
}

/**
 * Get remaining fund restriction time in milliseconds
 */
export function getFundRestrictionTimeRemaining(userId: string): number {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_FUND_RESTRICTIONS}_${userId}`);
    if (!stored) return 0;

    const restrictions = JSON.parse(stored);
    const now = Date.now();

    const remaining = restrictions
      .map((restriction: any) => {
        const expiresAt = new Date(restriction.expiresAt).getTime();
        return Math.max(0, expiresAt - now);
      })
      .filter((time: number) => time > 0);

    return remaining.length > 0 ? Math.max(...remaining) : 0;
  } catch {
    return 0;
  }
}

/**
 * Apply 24-hour fund restriction (called after password reset from unknown device)
 */
export function applyFundRestriction(
  userId: string,
  reason: "password_reset_unknown_device" | "suspicious_activity" | "new_device",
  hoursDelay: number = 24,
): void {
  try {
    const restrictions = JSON.parse(
      localStorage.getItem(`${STORAGE_KEY_FUND_RESTRICTIONS}_${userId}`) || "[]",
    );

    const expiresAt = new Date(Date.now() + hoursDelay * 60 * 60 * 1000).toISOString();

    restrictions.push({
      id: `restriction_${Date.now()}`,
      reason,
      appliedAt: new Date().toISOString(),
      expiresAt,
      hoursDelay,
    });

    localStorage.setItem(
      `${STORAGE_KEY_FUND_RESTRICTIONS}_${userId}`,
      JSON.stringify(restrictions),
    );
  } catch (error) {
    console.error("Error applying fund restriction:", error);
  }
}

/**
 * Clear fund restrictions for a user
 */
export function clearFundRestrictions(userId: string): void {
  localStorage.removeItem(`${STORAGE_KEY_FUND_RESTRICTIONS}_${userId}`);
}

/**
 * Detect if login is from new/unknown device and return risk level
 */
export function assessLoginRisk(
  userId: string,
  deviceId: string,
  ipAddress: string,
  country: string,
): "low" | "medium" | "high" {
  const knownDevices = getKnownDevices(userId);
  const isKnown = knownDevices.some(
    (device) => device.deviceId === deviceId && device.ipAddress === ipAddress,
  );

  if (isKnown) return "low";

  // Check for impossible travel (very rapid location changes)
  const recentEvents = getSecurityEvents(userId).slice(-5);
  if (recentEvents.length > 0) {
    const lastEvent = recentEvents[recentEvents.length - 1];
    const timeDiff =
      (new Date().getTime() - new Date(lastEvent.timestamp).getTime()) / (1000 * 60); // minutes

    // If logged in from different country in less than 30 minutes, it's suspicious
    if (lastEvent.country !== country && timeDiff < 30) {
      return "high";
    }
  }

  return "medium";
}

/**
 * Get EU eligible countries
 */
export const EU_ELIGIBLE_COUNTRIES = ["ES", "DE", "FR", "IT", "PT"];

/**
 * Check if a country code is eligible for Fin-Bank
 */
export function isEligibleCountry(countryCode: string): boolean {
  return EU_ELIGIBLE_COUNTRIES.includes(countryCode.toUpperCase());
}
