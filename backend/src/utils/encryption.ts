/**
 * Encryption Utilities
 * AES-256-GCM encryption for sensitive data
 */

import crypto from 'crypto';
import { config } from '@/config';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits for GCM
const TAG_LENGTH = 16; // 128 bits
const KEY_LENGTH = 32; // 256 bits

// Derive key from config
function getEncryptionKey(): Buffer {
  const key = config.encryptionKey;
  if (key.length < KEY_LENGTH) {
    throw new Error(`Encryption key must be at least ${KEY_LENGTH} bytes`);
  }
  return Buffer.from(key.slice(0, KEY_LENGTH * 2), 'hex');
}

/**
 * Encrypt data using AES-256-GCM
 */
export function encrypt(plaintext: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    // Combine IV + encrypted + tag
    return `${iv.toString('hex')}:${encrypted}:${tag.toString('hex')}`;
  } catch (error) {
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt data using AES-256-GCM
 */
export function decrypt(ciphertext: string): string {
  try {
    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid ciphertext format');
    }

    const [ivHex, encryptedHex, tagHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encrypted, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    throw new Error('Decryption failed - data may be corrupted or tampered with');
  }
}

/**
 * Hash data using SHA-256
 */
export function hash(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate secure random token
 */
export function generateToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Constant-time string comparison
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
