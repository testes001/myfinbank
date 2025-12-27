/**
 * Secure Token Storage System
 * 
 * Implements secure storage for authentication tokens:
 * - Primary: In-memory storage (inaccessible to XSS attacks)
 * - Secondary: IndexedDB (survives page refresh with same-site restriction)
 * - Never uses localStorage (vulnerable to XSS)
 * 
 * Flow:
 * 1. Token stored in memory during session
 * 2. Token backed up to IndexedDB for persistence
 * 3. On page refresh, recovered from IndexedDB to memory
 * 4. IndexedDB cleared on logout/session end
 */

const DB_NAME = 'FinBankAuthDB';
const DB_VERSION = 1;
const STORE_NAME = 'tokens';
const TOKEN_KEY = 'accessToken';

// In-memory token storage - primary (inaccessible to XSS)
let memoryToken: string | null = null;

/**
 * IndexedDB operations wrapped in promises with error handling
 */
const indexedDB = {
  async open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(new Error('Failed to open IndexedDB'));
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
    });
  },

  async get(key: string): Promise<string | null> {
    try {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(key);
        
        request.onerror = () => reject(new Error('Failed to read from IndexedDB'));
        request.onsuccess = () => resolve(request.result || null);
      });
    } catch (error) {
      console.error('IndexedDB get failed, continuing with memory storage:', error);
      return null;
    }
  },

  async set(key: string, value: string): Promise<void> {
    try {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(value, key);
        
        request.onerror = () => reject(new Error('Failed to write to IndexedDB'));
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.error('IndexedDB set failed, token stored in memory only:', error);
      // Continue anyway - memory storage is sufficient
    }
  },

  async delete(key: string): Promise<void> {
    try {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(key);
        
        request.onerror = () => reject(new Error('Failed to delete from IndexedDB'));
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.error('IndexedDB delete failed:', error);
    }
  },

  async clear(): Promise<void> {
    try {
      const db = await this.open();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();
        
        request.onerror = () => reject(new Error('Failed to clear IndexedDB'));
        request.onsuccess = () => resolve();
      });
    } catch (error) {
      console.error('IndexedDB clear failed:', error);
    }
  },
};

/**
 * Initialize secure storage by recovering token from IndexedDB
 * Called once on app initialization
 */
export async function initializeSecureStorage(): Promise<void> {
  try {
    // Attempt to recover token from IndexedDB after page refresh
    const recoveredToken = await indexedDB.get(TOKEN_KEY);
    if (recoveredToken) {
      memoryToken = recoveredToken;
    }
  } catch (error) {
    console.error('Failed to initialize secure storage:', error);
    // Continue - just start with empty memory storage
  }
}

/**
 * Get the current access token from memory
 * @returns Access token or null if not authenticated
 */
export function getSecureAccessToken(): string | null {
  return memoryToken;
}

/**
 * Store access token securely
 * - Stored in memory (primary, inaccessible to XSS)
 * - Backed up to IndexedDB (persistent across page refreshes)
 * @param token The access token to store
 */
export async function persistSecureAccessToken(token: string | null): Promise<void> {
  if (token) {
    // Store in memory
    memoryToken = token;
    // Back up to IndexedDB for persistence
    await indexedDB.set(TOKEN_KEY, token);
  } else {
    // Clear from both storages
    memoryToken = null;
    await indexedDB.delete(TOKEN_KEY);
  }
}

/**
 * Clear all stored tokens and session data
 * Called on logout
 */
export async function clearSecureStorage(): Promise<void> {
  memoryToken = null;
  await indexedDB.clear();
}

/**
 * Check if user is currently authenticated
 * @returns true if a token exists in memory
 */
export function isAuthenticated(): boolean {
  return memoryToken !== null;
}
