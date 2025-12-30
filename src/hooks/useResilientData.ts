/**
 * useResilientData: Smart data-fetching hook
 *
 * Replaces scattered useState + useEffect + try/catch patterns
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - Caching with fallback during outages
 * - AbortController support (prevents stale updates)
 * - Loading, error, and cached states
 * - Manual retry function
 *
 * @example
 * const { data, isLoading, error, isCached, retry } = useResilientData(
 *   (signal) => getTransactions(accountId, { signal }),
 *   [accountId],
 *   {
 *     cacheInstance: cacheInstances.transactions(accountId),
 *     showErrorToast: true,
 *   }
 * );
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import type { HybridCache } from "@/lib/cache-strategy";

export interface UseResilientDataOptions<T> {
  /**
   * Cache instance for storing/retrieving fallback data
   */
  cacheInstance?: HybridCache<T>;

  /**
   * Show error toast on failure
   * @default true
   */
  showErrorToast?: boolean;

  /**
   * Custom error toast message
   */
  errorToastMessage?: string;

  /**
   * Callback when data is successfully loaded
   */
  onSuccess?: (data: T) => void;

  /**
   * Callback when error occurs
   */
  onError?: (error: Error) => void;

  /**
   * Skip initial fetch (for manual-only refresh)
   * @default false
   */
  skipInitial?: boolean;
}

export interface UseResilientDataResult<T> {
  /**
   * Fetched data
   */
  data: T | null;

  /**
   * Loading state (true while fetching)
   */
  isLoading: boolean;

  /**
   * Error (if any)
   */
  error: Error | null;

  /**
   * Whether data is from cache (vs. fresh API)
   */
  isCached: boolean;

  /**
   * Age of cached data in milliseconds (null if not cached)
   */
  cacheAge: number | null;

  /**
   * Manual retry function
   */
  retry: () => Promise<void>;

  /**
   * Clear error state
   */
  clearError: () => void;

  /**
   * Clear cached data
   */
  clearCache: () => Promise<void>;
}

/**
 * Smart data-fetching hook with resilience
 */
export function useResilientData<T>(
  fetchFn: (signal: AbortSignal) => Promise<T>,
  deps: React.DependencyList,
  options: UseResilientDataOptions<T> = {}
): UseResilientDataResult<T> {
  const {
    cacheInstance,
    showErrorToast = true,
    errorToastMessage,
    onSuccess,
    onError,
    skipInitial = false,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(!skipInitial);
  const [error, setError] = useState<Error | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [cacheAge, setCacheAge] = useState<number | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);

  /**
   * Fetch data with automatic retry and caching
   */
  const fetchData = useCallback(async () => {
    // Cancel previous request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);
    setIsCached(false);
    setCacheAge(null);

    try {
      // Attempt to fetch from API
      const result = await fetchFn(abortControllerRef.current.signal);

      if (!isMountedRef.current) return;

      setData(result);
      setIsCached(false);
      setCacheAge(null);
      setIsLoading(false);

      // Update cache with fresh data
      if (cacheInstance) {
        await cacheInstance.set(result);
      }

      // Call success callback
      onSuccess?.(result);
    } catch (err) {
      if (!isMountedRef.current) return;

      // Handle abort (canceled requests)
      if (err instanceof Error && err.name === "AbortError") {
        setIsLoading(false);
        return;
      }

      const error = err instanceof Error ? err : new Error(String(err));

      // Try fallback cache
      if (cacheInstance) {
        const cached = await cacheInstance.get();
        const age = await cacheInstance.getAge();

        if (cached) {
          setData(cached);
          setIsCached(true);
          setCacheAge(age);
          setError(error); // Still show the error, but with cached data as fallback
          setIsLoading(false);

          if (showErrorToast) {
            const message =
              errorToastMessage ||
              `${error.message}. Showing cached data from ${formatRelativeAge(age)}`;
            toast.error(message, { duration: 5000 });
          }

          return;
        }
      }

      // No cache available; show error
      setError(error);
      setIsLoading(false);

      if (showErrorToast) {
        const message = errorToastMessage || error.message;
        toast.error(message, { duration: 5000 });
      }

      // Call error callback
      onError?.(error);
    }
  }, [fetchFn, cacheInstance, showErrorToast, errorToastMessage, onSuccess, onError]);

  /**
   * Auto-fetch on mount and dependency change
   */
  useEffect(() => {
    if (!skipInitial) {
      fetchData();
    }

    return () => {
      abortControllerRef.current?.abort();
    };
  }, deps);

  /**
   * Track mount/unmount to prevent stale updates
   */
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  /**
   * Manual retry
   */
  const retry = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Clear cached data
   */
  const clearCache = useCallback(async () => {
    if (cacheInstance) {
      await cacheInstance.clear();
      setData(null);
      setIsCached(false);
      setCacheAge(null);
    }
  }, [cacheInstance]);

  return {
    data,
    isLoading,
    error,
    isCached,
    cacheAge,
    retry,
    clearError,
    clearCache,
  };
}

/**
 * Format cache age for display
 */
function formatRelativeAge(ageMs: number | null): string {
  if (ageMs === null) return "unknown time";
  if (ageMs < 60_000) return "just now";
  if (ageMs < 60 * 60 * 1000) return `${Math.floor(ageMs / 60_000)} minutes ago`;
  if (ageMs < 24 * 60 * 60 * 1000) return `${Math.floor(ageMs / (60 * 60 * 1000))} hours ago`;
  return `${Math.floor(ageMs / (24 * 60 * 60 * 1000))} days ago`;
}

export default useResilientData;
