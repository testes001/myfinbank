/**
 * Simple client-side verification store.
 * Stores verification codes in localStorage with expiry to gate login/signup.
 */

interface VerificationRecord {
  code: string;
  expiresAt: number;
  verified: boolean;
}

const STORAGE_KEY_PREFIX = "finbank_verify_";
const EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

function storageKey(email: string) {
  return `${STORAGE_KEY_PREFIX}${email.toLowerCase()}`;
}

export function issueVerificationCode(email: string): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const record: VerificationRecord = {
    code,
    expiresAt: Date.now() + EXPIRY_MS,
    verified: false,
  };
  localStorage.setItem(storageKey(email), JSON.stringify(record));
  return code;
}

export function isEmailVerified(email: string): boolean {
  const stored = localStorage.getItem(storageKey(email));
  if (!stored) return false;
  try {
    const record = JSON.parse(stored) as VerificationRecord;
    if (record.verified) return true;
    if (record.expiresAt < Date.now()) return false;
    return false;
  } catch {
    return false;
  }
}

export function verifyEmailCode(email: string, code: string): boolean {
  const stored = localStorage.getItem(storageKey(email));
  if (!stored) return false;

  try {
    const record = JSON.parse(stored) as VerificationRecord;
    if (record.expiresAt < Date.now()) return false;
    if (record.code !== code.trim()) return false;
    const updated: VerificationRecord = { ...record, verified: true };
    localStorage.setItem(storageKey(email), JSON.stringify(updated));
    return true;
  } catch {
    return false;
  }
}

export function markEmailVerified(email: string) {
  const stored = localStorage.getItem(storageKey(email));
  if (stored) {
    try {
      const record = JSON.parse(stored) as VerificationRecord;
      const updated: VerificationRecord = { ...record, verified: true, expiresAt: Date.now() + EXPIRY_MS };
      localStorage.setItem(storageKey(email), JSON.stringify(updated));
      return;
    } catch {
      // fall through
    }
  }
  const record: VerificationRecord = {
    code: "",
    expiresAt: Date.now() + EXPIRY_MS,
    verified: true,
  };
  localStorage.setItem(storageKey(email), JSON.stringify(record));
}
