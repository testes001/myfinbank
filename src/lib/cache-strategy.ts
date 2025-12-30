/**
 * Hybrid Cache Strategy: LocalStorage + Optional Redis
 *
 * Serves "last known" data during API outages:
 * 1. Successful API responses are cached to LocalStorage
 * 2. If API fails and cache exists, serve cached data
 * 3. User is notified data is stale ("cached 5 minutes ago")
 * 4. Manual clear button allows removing cached data
 *
 * Cache keys follow pattern: `finbank:cache:{namespace}:{id}`
 * Default TTL: 5 minutes for transactions, 1 hour for account data
 */

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiryMs: number;
}

/**
 * Safe cache wrapper for LocalStorage
 * Gracefully degrades if LocalStorage is unavailable (e.g., private browsing)
 */
class HybridCache<T> {
  private localKey: string;
  private expiryMs: number;
  private isAvailable = true;

  /**
   * @param namespace Cache key namespace (e.g., "transactions", "accounts")
   * @param id Entity identifier (e.g., accountId)
   * @param expiryMs Time-to-live in milliseconds (default: 5 min)
   */
  constructor(namespace: string, id: string, expiryMs: number = 5 * 60 * 1000) {
    this.localKey = `finbank:cache:${namespace}:${id}`;
    this.expiryMs = expiryMs;

    // Test if LocalStorage is available
    try {
      const test = "__test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
    } catch (err) {
      console.warn("LocalStorage not available (e.g., private browsing). Cache disabled.", err);
      this.isAvailable = false;
    }
  }

  /**
   * Retrieve cached data if it exists and hasn't expired
   * @returns Cached data or null if not found or expired
   */
  async get(): Promise<T | null> {
    if (!this.isAvailable) return null;

    try {
      const stored = localStorage.getItem(this.localKey);
      if (!stored) return null;

      const entry: CacheEntry<T> = JSON.parse(stored);

      // Check if cache has expired
      const ageMs = Date.now() - entry.timestamp;
      if (ageMs > entry.expiryMs) {
        localStorage.removeItem(this.localKey);
        return null;
      }

      return entry.data;
    } catch (err) {
      console.error(`Failed to retrieve cache for ${this.localKey}:`, err);
      return null;
    }
  }

  /**
   * Store data in cache with timestamp and TTL
   * @param data Data to cache
   */
  async set(data: T): Promise<void> {
    if (!this.isAvailable) return;

    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiryMs: this.expiryMs,
      };
      localStorage.setItem(this.localKey, JSON.stringify(entry));
    } catch (err) {
      // Could fail if LocalStorage is full
      console.error(`Failed to cache data for ${this.localKey}:`, err);
    }
  }

  /**
   * Remove cached data
   */
  async clear(): Promise<void> {
    if (!this.isAvailable) return;

    try {
      localStorage.removeItem(this.localKey);
    } catch (err) {
      console.error(`Failed to clear cache for ${this.localKey}:`, err);
    }
  }

  /**
   * Get the age of cached data (in milliseconds)
   * @returns Age in ms, or null if not cached
   */
  async getAge(): Promise<number | null> {
    if (!this.isAvailable) return null;

    try {
      const stored = localStorage.getItem(this.localKey);
      if (!stored) return null;

      const entry: CacheEntry<T> = JSON.parse(stored);
      return Date.now() - entry.timestamp;
    } catch (err) {
      return null;
    }
  }

  /**
   * Check if cache exists and is still valid
   */
  async isValid(): Promise<boolean> {
    if (!this.isAvailable) return false;

    try {
      const stored = localStorage.getItem(this.localKey);
      if (!stored) return false;

      const entry: CacheEntry<T> = JSON.parse(stored);
      const ageMs = Date.now() - entry.timestamp;
      return ageMs <= entry.expiryMs;
    } catch (err) {
      return false;
    }
  }
}

/**
 * Factory function to create a cache instance
 *
 * @example
 * const txCache = createCache<TransactionModel[]>("transactions", accountId, 5 * 60 * 1000);
 * const txs = await txCache.get();
 * if (txs) renderTransactions(txs);
 *
 * // After successful API fetch:
 * await txCache.set(apiTransactions);
 */
export function createCache<T>(
  namespace: string,
  id: string,
  expiryMs?: number
): HybridCache<T> {
  return new HybridCache<T>(namespace, id, expiryMs);
}

/**
 * Predefined cache instances for common data types
 */
export const cacheInstances = {
  /**
   * Transactions cache (5-minute TTL)
   */
  transactions: (accountId: string) =>
    createCache(`transactions`, accountId, 5 * 60 * 1000),

  /**
   * Account info cache (15-minute TTL)
   */
  accounts: (userId: string) =>
    createCache(`accounts`, userId, 15 * 60 * 1000),

  /**
   * User profile cache (30-minute TTL)
   */
  profile: (userId: string) =>
    createCache(`profile`, userId, 30 * 60 * 1000),

  /**
   * Virtual cards cache (5-minute TTL)
   */
  virtualCards: (userId: string) =>
    createCache(`virtualCards`, userId, 5 * 60 * 1000),

  /**
   * Recurring transfers cache (5-minute TTL)
   */
  recurringTransfers: (userId: string) =>
    createCache(`recurringTransfers`, userId, 5 * 60 * 1000),
};

/**
 * Format relative time for display ("5 minutes ago", "2 hours ago")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;

  if (diffMs < 60_000) return "just now";
  if (diffMs < 60 * 60 * 1000) return `${Math.floor(diffMs / 60_000)} minutes ago`;
  if (diffMs < 24 * 60 * 60 * 1000) return `${Math.floor(diffMs / (60 * 60 * 1000))} hours ago`;

  return `${Math.floor(diffMs / (24 * 60 * 60 * 1000))} days ago`;
}

/**
 * Clear all finbank caches
 */
export function clearAllCaches(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith("finbank:cache:")) {
        localStorage.removeItem(key);
      }
    });
  } catch (err) {
    console.error("Failed to clear all caches:", err);
  }
}
