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
 * Uses multiple services with fallbacks and timeouts
 * Gracefully returns mock data if all services fail
 */
export async function fetchIPGeolocation(): Promise<IPGeolocationData | null> {
  const timeout = 5000; // 5 second timeout

  // Helper to fetch with timeout
  const fetchWithTimeout = async (url: string): Promise<Response | null> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response.ok ? response : null;
    } catch {
      return null;
    }
  };

  try {
    // Primary: ip-api.com with CORS workaround
    const primaryUrl =
      "https://ip-api.com/json/?fields=status,message,country,countryCode,region,city,timezone,lat,lon,isp,ip";
    const primaryResponse = await fetchWithTimeout(primaryUrl);

    if (primaryResponse) {
      const data = await primaryResponse.json();

      if (data.status === "success") {
        return {
          ip: data.ip,
          country: data.country,
          countryCode: data.countryCode,
          city: data.city,
          region: data.region,
          timezone: data.timezone,
          latitude: data.lat,
          longitude: data.lon,
          isp: data.isp,
          timestamp: new Date().toISOString(),
        };
      }
    } catch (error) {
      console.warn("Primary geolocation service failed:", error);
    }

    // Fallback: ipify-api.com (CORS-friendly) if key provided
    const ipifyKey = (import.meta as any).env?.VITE_IPIFY_API_KEY || (import.meta as any).env?.IPIFY_API_KEY;
    if (ipifyKey) {
      const fallbackUrl = `https://geo.ipify.org/api/v2/country?apiKey=${ipifyKey}`;
      const fallbackResponse = await fetchWithTimeout(fallbackUrl);

      if (fallbackResponse) {
        const data = await fallbackResponse.json();

        if (data.ip) {
          return {
            ip: data.ip,
            country: data.location?.country || "Unknown",
            countryCode: data.location?.country_code || "UN",
            city: data.location?.city || "Unknown",
            region: data.location?.region || "Unknown",
            timezone: data.location?.timezone || "UTC",
            latitude: data.location?.lat || 0,
            longitude: data.location?.lng || 0,
            isp: data.isp?.name || "Unknown",
            timestamp: new Date().toISOString(),
          };
        }
      }
    }

    // Tertiary: abstractapi.com only when env key present
    const abstractApiKey =
      (import.meta as any).env?.VITE_ABSTRACT_API_KEY || (import.meta as any).env?.ABSTRACT_API_KEY;
    if (abstractApiKey) {
      const tertiaryUrl = `https://ipgeolocation.abstractapi.com/v1/?api_key=${abstractApiKey}`;
      const tertiaryResponse = await fetchWithTimeout(tertiaryUrl);

      if (tertiaryResponse) {
        const data = await tertiaryResponse.json();

        if (data.ip_address) {
          return {
            ip: data.ip_address,
            country: data.country || "Unknown",
            countryCode: data.country_code || "UN",
            city: data.city || "Unknown",
            region: data.region || "Unknown",
            timezone: data.timezone?.name || "UTC",
            latitude: parseFloat(data.latitude) || 0,
            longitude: parseFloat(data.longitude) || 0,
            isp: "Unknown",
            timestamp: new Date().toISOString(),
          };
        }
      }
    }

    // Graceful degradation: Return mock data for demo mode (silently)
    // This prevents app breakage when geolocation APIs are unavailable
    return getDefaultGeolocationData();
  } catch {
    // Silently fail and return mock data for demo purposes
    return getDefaultGeolocationData();
  }
}

/**
 * Get default geolocation data for demo/fallback mode
 * Used when external APIs are unavailable
 */
function getDefaultGeolocationData(): IPGeolocationData {
  return {
    ip: "127.0.0.1",
    country: "Spain",
    countryCode: "ES",
    city: "Madrid",
    region: "Community of Madrid",
    timezone: "Europe/Madrid",
    latitude: 40.4168,
    longitude: -3.7038,
    isp: "Fin-Bank Demo Mode",
    timestamp: new Date().toISOString(),
  };
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

  const deviceSink =
    (import.meta as any).env?.VITE_DEVICE_ENDPOINT || (import.meta as any).env?.DEVICE_ENDPOINT;
  if (deviceSink) {
    fetch(deviceSink, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(device),
    }).catch((err) => console.error("Failed to persist device to backend:", err));
  }

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

  // Optional: forward to backend for durable audit storage
  const sink = (import.meta as any).env?.VITE_SECURITY_EVENT_ENDPOINT || (import.meta as any).env?.SECURITY_EVENT_ENDPOINT;
  if (sink) {
    fetch(sink, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(securityEvent),
    }).catch((err) => console.error("Failed to send security event to backend:", err));
  }

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

    // Keep only active restrictions
    const active = restrictions.filter((restriction: any) => {
      const expiresAt = new Date(restriction.expiresAt).getTime();
      return now < expiresAt;
    });

    if (active.length === 0) {
      // Cleanup expired restrictions
      localStorage.removeItem(`${STORAGE_KEY_FUND_RESTRICTIONS}_${userId}`);
      return false;
    }

    // Persist only active restrictions (trim history)
    try {
      localStorage.setItem(`${STORAGE_KEY_FUND_RESTRICTIONS}_${userId}`, JSON.stringify(active));
    } catch {}

    return true;
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

    // Optional: persist to backend for enforcement
    const restrictionSink =
      (import.meta as any).env?.VITE_FUND_RESTRICTION_ENDPOINT ||
      (import.meta as any).env?.FUND_RESTRICTION_ENDPOINT;
    if (restrictionSink) {
      fetch(restrictionSink, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          reason,
          appliedAt: new Date().toISOString(),
          expiresAt,
          hoursDelay,
        }),
      }).catch((err) => console.error("Failed to persist fund restriction to backend:", err));
    }
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
