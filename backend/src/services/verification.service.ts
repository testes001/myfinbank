import crypto from 'crypto';
import redisClient from '@/config/redis';
import { log } from '@/utils/logger';

interface VerificationRecord {
  codeHash: string;
  expiresAt: number;
  verified: boolean;
}

const IN_MEMORY_STORE = new Map<string, VerificationRecord>();
const IN_MEMORY_RATE = new Map<string, { count: number; resetAt: number }>();
const EXPIRY_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const GLOBAL_IP_LIMIT = 20;

function storeKey(email: string) {
  return `verify:${email.toLowerCase()}`;
}

function hashCode(code: string) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

async function setRecord(email: string, record: VerificationRecord) {
  const key = storeKey(email);
  if (redisClient) {
    await redisClient.set(key, JSON.stringify(record), { PX: EXPIRY_MS });
  } else {
    IN_MEMORY_STORE.set(key, record);
  }
}

async function getRecord(email: string): Promise<VerificationRecord | null> {
  const key = storeKey(email);
  if (redisClient) {
    const raw = await redisClient.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as VerificationRecord;
    } catch {
      return null;
    }
  }
  return IN_MEMORY_STORE.get(key) || null;
}

export async function issueVerificationCode(email: string): Promise<{ code: string; expiresAt: number }> {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + EXPIRY_MS;
  await setRecord(email, { codeHash: hashCode(code), expiresAt, verified: false });
  log.info('Verification code issued', { email });
  return { code, expiresAt };
}

export async function verifyCode(email: string, code: string): Promise<boolean> {
  const record = await getRecord(email);
  if (!record) return false;
  if (record.verified) return true;
  if (record.expiresAt < Date.now()) return false;
  if (record.codeHash !== hashCode(code)) return false;

  await setRecord(email, { ...record, verified: true });
  return true;
}

export async function isVerified(email: string): Promise<boolean> {
  const record = await getRecord(email);
  return record?.verified === true;
}

export async function checkVerificationRateLimit(email: string, ip: string): Promise<void> {
  const key = `verify-rate:${email.toLowerCase()}:${ip}`;
  const ipKey = `verify-ip:${ip}`;

  if (redisClient) {
    const current = await redisClient.incr(key);
    if (current === 1) {
      await redisClient.pExpire(key, RATE_LIMIT_WINDOW_MS);
    }
    if (current > RATE_LIMIT_MAX) {
      throw new Error('Too many verification requests. Please try again later.');
    }

    const ipCount = await redisClient.incr(ipKey);
    if (ipCount === 1) {
      await redisClient.pExpire(ipKey, RATE_LIMIT_WINDOW_MS);
    }
    if (ipCount > GLOBAL_IP_LIMIT) {
      throw new Error('Too many verification requests from this IP. Please try again later.');
    }
    return;
  }

  const now = Date.now();
  const existing = IN_MEMORY_RATE.get(key);
  if (!existing || existing.resetAt < now) {
    IN_MEMORY_RATE.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    // Track IP bucket
    const ipExisting = IN_MEMORY_RATE.get(ipKey);
    if (!ipExisting || ipExisting.resetAt < now) {
      IN_MEMORY_RATE.set(ipKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    } else {
      ipExisting.count += 1;
      IN_MEMORY_RATE.set(ipKey, ipExisting);
      if (ipExisting.count > GLOBAL_IP_LIMIT) {
        throw new Error('Too many verification requests from this IP. Please try again later.');
      }
    }
    return;
  }
  if (existing.count >= RATE_LIMIT_MAX) {
    throw new Error('Too many verification requests. Please try again later.');
  }
  existing.count += 1;
  IN_MEMORY_RATE.set(key, existing);

  const ipExisting = IN_MEMORY_RATE.get(ipKey);
  if (ipExisting) {
    ipExisting.count += 1;
    IN_MEMORY_RATE.set(ipKey, ipExisting);
    if (ipExisting.count > GLOBAL_IP_LIMIT) {
      throw new Error('Too many verification requests from this IP. Please try again later.');
    }
  } else {
    IN_MEMORY_RATE.set(ipKey, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  }
}
