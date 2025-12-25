/**
 * Lightweight client-side throttle for auth attempts.
 * Persists in localStorage to avoid infinite retries on refresh.
 */

const STORAGE_KEY = "finbank_auth_throttle";
const LOCK_THRESHOLD = 5;
const LOCK_WINDOW_MS = 30_000;

interface ThrottleState {
  attempts: number;
  lockUntil: number | null;
  updatedAt: number;
}

function loadState(): ThrottleState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { attempts: 0, lockUntil: null, updatedAt: Date.now() };
  try {
    const parsed = JSON.parse(raw) as ThrottleState;
    // Expire stale state after 1 hour
    if (Date.now() - parsed.updatedAt > 60 * 60 * 1000) {
      return { attempts: 0, lockUntil: null, updatedAt: Date.now() };
    }
    return parsed;
  } catch {
    return { attempts: 0, lockUntil: null, updatedAt: Date.now() };
  }
}

function saveState(state: ThrottleState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function getAuthThrottle(): ThrottleState {
  return loadState();
}

export function recordAuthAttempt(): ThrottleState {
  const state = loadState();
  const now = Date.now();

  let attempts = state.attempts + 1;
  let lockUntil = state.lockUntil;

  if (attempts >= LOCK_THRESHOLD) {
    lockUntil = now + LOCK_WINDOW_MS;
  }

  const next: ThrottleState = { attempts, lockUntil, updatedAt: now };
  saveState(next);
  return next;
}

export function resetAuthThrottle() {
  saveState({ attempts: 0, lockUntil: null, updatedAt: Date.now() });
}
