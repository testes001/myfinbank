/**
 * DataLoadingState: Unified component for loading, error, and cached states
 *
 * Replaces scattered error cards across components
 *
 * Features:
 * - Consistent error styling (red border, white bg, good contrast)
 * - Loading skeleton
 * - Cached data indicator ("Last updated 5 minutes ago")
 * - Retry button
 * - Clear cache button
 * - Accessibility-compliant
 *
 * @example
 * <DataLoadingState
 *   isLoading={isLoading}
 *   error={error}
 *   isCached={isCached}
 *   cacheAge={cacheAge}
 *   onRetry={() => retry()}
 *   onClearCache={() => clearCache()}
 * >
 *   <TransactionsList transactions={data} />
 * </DataLoadingState>
 */

import { TransactionSkeleton } from "@/components/LoadingSkeleton";
import { AlertTriangle, RefreshCw, Trash2 } from "lucide-react";

export interface DataLoadingStateProps {
  /**
   * Whether data is currently loading
   */
  isLoading: boolean;

  /**
   * Error object (if any)
   */
  error: Error | null;

  /**
   * Whether data is from cache
   */
  isCached?: boolean;

  /**
   * Age of cached data in milliseconds (null if not cached)
   */
  cacheAge?: number | null;

  /**
   * Callback when user clicks retry
   */
  onRetry: () => void;

  /**
   * Callback when user clicks clear cache
   */
  onClearCache?: () => void;

  /**
   * Custom loading component (defaults to TransactionSkeleton)
   */
  loadingComponent?: React.ReactNode;

  /**
   * Custom error message (overrides error.message)
   */
  errorMessage?: string;

  /**
   * Child content (shown when not loading/error)
   */
  children: React.ReactNode;
}

/**
 * Format milliseconds to human-readable time
 */
function formatTimeAgo(ageMs: number | null | undefined): string {
  if (ageMs === null || ageMs === undefined) return "unknown time";
  if (ageMs < 60_000) return "just now";
  if (ageMs < 60 * 60 * 1000) return `${Math.floor(ageMs / 60_000)} minutes ago`;
  if (ageMs < 24 * 60 * 60 * 1000) return `${Math.floor(ageMs / (60 * 60 * 1000))} hours ago`;
  return `${Math.floor(ageMs / (24 * 60 * 60 * 1000))} days ago`;
}

export function DataLoadingState({
  isLoading,
  error,
  isCached = false,
  cacheAge,
  onRetry,
  onClearCache,
  loadingComponent,
  errorMessage,
  children,
}: DataLoadingStateProps) {
  // Show loading skeleton
  if (isLoading && !isCached) {
    return loadingComponent || <TransactionSkeleton />;
  }

  // Show error state (with optional cached data fallback)
  if (error && !isCached) {
    return (
      <div
        className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 space-y-4"
        role="alert"
        aria-live="polite"
      >
        <div className="flex items-start gap-3">
          <AlertTriangle
            className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-red-600">Failed to load data</h3>
            <p className="text-sm text-red-500 mt-1 break-words">{errorMessage || error.message}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={onRetry}
            className="inline-flex items-center justify-center rounded-md bg-red-600 px-4 py-2 text-white text-sm font-medium hover:bg-red-700 active:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Retry loading data"
          >
            <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show error with cached data fallback
  if (error && isCached) {
    return (
      <>
        <div
          className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 mb-4 space-y-3"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle
              className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-yellow-600 text-sm">Using cached data</h3>
              <p className="text-xs text-yellow-600 mt-1">
                Data last updated {formatTimeAgo(cacheAge)}. Unable to load fresh data:{" "}
                <span className="font-medium">{errorMessage || error.message}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={onRetry}
              className="inline-flex items-center justify-center rounded-md bg-yellow-600 px-3 py-1.5 text-white text-xs font-medium hover:bg-yellow-700 active:bg-yellow-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Retry loading fresh data"
            >
              <RefreshCw className="w-3 h-3 mr-1.5" aria-hidden="true" />
              Try again
            </button>

            {onClearCache && (
              <button
                onClick={onClearCache}
                className="inline-flex items-center justify-center rounded-md bg-transparent px-3 py-1.5 text-yellow-600 text-xs font-medium border border-yellow-600/30 hover:bg-yellow-600/5 active:bg-yellow-600/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Clear cached data"
              >
                <Trash2 className="w-3 h-3 mr-1.5" aria-hidden="true" />
                Clear cache
              </button>
            )}
          </div>
        </div>

        {/* Render children (cached data) below the warning */}
        <div className="opacity-75">{children}</div>
      </>
    );
  }

  // Show loading skeleton while displaying cached data
  if (isLoading && isCached) {
    return (
      <div className="space-y-4">
        <div
          className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-4"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <RefreshCw
              className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5 animate-spin"
              aria-hidden="true"
            />
            <div className="flex-1">
              <h3 className="font-medium text-blue-600 text-sm">Refreshing data</h3>
              <p className="text-xs text-blue-500 mt-1">
                Showing cached data from {formatTimeAgo(cacheAge)}...
              </p>
            </div>
          </div>
        </div>
        {children}
      </div>
    );
  }

  // Normal state: render children
  return <>{children}</>;
}

export default DataLoadingState;
