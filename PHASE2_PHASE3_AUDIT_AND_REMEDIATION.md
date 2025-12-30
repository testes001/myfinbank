# PHASE 2 & 3: Comprehensive Audit & Advanced Remediation Plan

## Executive Summary

**Critical Finding**: The "Failed to load dashboard / Failed to load transactions" error originates from a **lack of resilience infrastructure** in the API layer combined with **race conditions in data-fetching hooks**. The system has no retry logic for transient failures, no request timeouts, no circuit breaker, and no cancellation support—creating a brittle foundation susceptible to any network hiccup.

**Design Decay**: While CSS tokens are centralized and Tailwind is used consistently, **error states, loading states, and fallback UIs are visually inconsistent**. Some components show user-facing toasts; others silently console.error(). Some have retry buttons; others don't.

---

## PHASE 2: PATHOLOGY & ROOT CAUSE ANALYSIS

### 2.1 The "Failed to Load" Error Cascade

#### Flow Analysis
```
Dashboard.tsx (line 153)
  ↓ calls getRecentTransactions(accountId, 50)
  ↓ [src/lib/transactions.ts, line 79-81]
    ↓ calls getTransactionsByAccountId(accountId, 1, limit)
      ↓ [src/lib/transactions.ts, line 60-77]
        ↓ calls apiFetch('/api/transactions?...')
        ↓ If resp.ok === false:
          ↓ Throws: Error("Failed to load transactions")
  ↓ Error bubbles back to Dashboard.tsx (line 169)
    ↓ catch (err) => setLoadError(err.message)
      ↓ UI renders: "Failed to load dashboard" + underlying error message
```

#### Root Causes Identified

| Issue | Location | Severity | Description |
|-------|----------|----------|-------------|
| **No Request Timeout** | `src/lib/api-client.ts` (apiFetch) | Critical | fetch() has no AbortController timeout; requests can hang indefinitely |
| **No Retry Logic for 5xx** | `src/lib/api-client.ts` (apiFetch) | Critical | Only retries on 401; any other error (500, 502, 503) fails immediately |
| **No Network Error Retry** | `src/lib/api-client.ts` (apiFetch) | Critical | Network failures (timeout, ECONNREFUSED) are not retried with exponential backoff |
| **Race Conditions** | `src/hooks/useAsync.ts` + Dashboard | High | No AbortController support; if component unmounts during fetch, state updates trigger "Can't setState on unmounted component" warnings and potential crashes |
| **No Circuit Breaker** | Entire API layer | High | Repeated failures continue to hammer the backend without backing off |
| **Inconsistent Error Display** | Various components | Medium | `TransactionHistory.tsx` & `TransactionSearch.tsx` only console.error(); they don't show user-facing toasts |
| **No Fallback Caching** | Entire API layer | Medium | No Redis/LocalStorage caching; outages cause immediate data loss |
| **Singleton ErrorBoundary Issue** | `src/components/ErrorBoundary.tsx:18-20` | Medium | Uses a singleton `normalContainer`/`clonedStage`; conflicts if multiple boundaries are mounted |

---

### 2.2 Detailed Pathology Findings

#### Issue 1: Timeout Vulnerability in apiFetch

**Current Code** (`src/lib/api-client.ts:82-116`):
```typescript
export async function apiFetch(path: string, options: ApiFetchOptions = {}): Promise<Response> {
  // ... no timeout, no AbortController signal support
  return fetch(url, {
    credentials: "include",
    ...rest,
    headers: requestHeaders,
  });
}
```

**Problem**:
- If the backend `/api/transactions` endpoint hangs, the fetch() never completes
- Browser's default fetch timeout is 600 seconds (10 minutes) or *never* in some contexts
- User sees a blank dashboard for 10+ minutes before getting "Failed to load" message

**Real-world Impact**: If backend is overloaded, slow, or network is degraded, one slow endpoint blocks the entire dashboard.

---

#### Issue 2: Missing Retry & Exponential Backoff for Transient Errors

**Current Code** (`src/lib/transactions.ts:60-77`):
```typescript
export async function getTransactionsByAccountId(...) {
  const resp = await apiFetch(`/api/transactions?...`);
  if (!resp.ok) {
    const msg = (await resp.json().catch(() => null))?.message || "Failed to load transactions";
    throw new Error(msg);  // ← Throws immediately on ANY non-ok
  }
  // ...
}
```

**Problem**:
- 502/503 errors (temporary gateway outage, backend restart) fail immediately
- 429 rate-limit errors fail immediately
- Network flakiness (dropped packets) fails on first attempt
- No exponential backoff: rapid retries hammer a struggling backend

**Real-world Impact**: A 10-second backend outage = user-visible "Failed to load" dashboard for all users, even though a 3-second retry would have succeeded.

---

#### Issue 3: Race Conditions via Missing AbortController

**Current Code** (`src/hooks/useAsync.ts` + `src/components/Dashboard.tsx:152-174`):
```typescript
// useAsync.ts: no cancellation support
export function useAsync<T>() {
  const run = useCallback(async (fn: () => Promise<T>) => {
    setLoading(true);
    try {
      const res = await fn();
      setLoading(false);  // ← Can execute after unmount!
      return res;
    } catch (err) {
      setError(e);
      setLoading(false);  // ← Can execute after unmount!
    }
  }, []);
}

// Dashboard.tsx: calls runAsync without cancellation
useEffect(() => {
  loadData();  // ← If component unmounts during fetch, state updates after unmount
}, []);
```

**Problem**:
- User navigates away from Dashboard while transaction fetch is in-flight
- Fetch completes, but component is unmounted
- `setLoading(false)` executes on unmounted component → React warning
- Over time, these warnings accumulate; app becomes unstable

**Real-world Impact**: Rapid navigation (click Dashboard, then click Profile, then Dashboard) causes React to warn about "Can't perform a React state update on an unmounted component," eventually leading to memory leaks and crashes.

---

#### Issue 4: Inconsistent Error States & UX

**Comparison** (`TransactionHistory.tsx:41-43` vs. `Dashboard.tsx:169-172`):

**TransactionHistory** (silent failure):
```typescript
try {
  const txs = await getTransactionsByAccountId(...);
  setTransactions(txs);
} catch (error) {
  console.error("Failed to load transactions:", error);  // ← Only logs, no toast!
}
```

**Dashboard** (shows error):
```typescript
.catch((err) => {
  console.error("Failed to load dashboard data:", err);
  setLoadError(err.message);  // ← Sets error state, renders error card
  // ... user sees: "Failed to load dashboard: Failed to load transactions"
})
```

**Problem**:
- User opens TransactionSearch modal and nothing loads
- No error toast, no error message, just... nothing
- User assumes the modal is broken or the app is frozen

**Real-world Impact**: Silent failures confuse users and lead to support tickets.

---

### 2.3 Design Consistency Audit

#### CSS & Theming: ✅ GOOD
- **Centralized tokens**: `src/styles.css` (lines 31-100) and `src/lib/brand-config.ts` define all design variables
- **Consistent palette**: Light theme (primary: `#003366`, accent: `#00a86b`) and Dark theme (primary: `#004d99`, accent: `#00c878`)
- **Tailwind integration**: All components use utility classes + CSS variables
- **Login page as source of truth**: Establishes gradient backgrounds, blur effects, and rounded cards

#### Error State UX: ❌ INCONSISTENT

| Component | Error Display | Contrast | Accessibility |
|-----------|---------------|----------|---|
| Dashboard Error Card | Red border + red text on white bg | ✅ Good | ✅ Accessible |
| TransactionHistory | console.error() only | ❌ Silent | ❌ Not visible to user |
| TransactionSearch | console.error() only | ❌ Silent | ❌ Not visible to user |
| Login Form | Generic "Email or password is incorrect" | ✅ Good | ✅ Accessible |

#### Loading States: ⚠️ PARTIALLY IMPLEMENTED
- Dashboard has `TransactionSkeleton` for loading state ✅
- TransactionHistory uses `isLoading` flag but may not show skeleton ⚠️
- TransactionSearch doesn't show loading state ❌

#### Fallback / No-Data States: ❌ MISSING
- If backend is unavailable, user sees only error message
- No "last known data" cached and displayed during outage
- No "retry in Xs" message or automatic retry indication

---

## PHASE 3: ADVANCED REMEDIATION PLAN

### 3.1 Strategic Objectives

1. **Resilience**: Add request timeouts, retry with exponential backoff, and circuit breaker
2. **Reliability**: Centralize error handling, implement consistent error UX
3. **Observability**: Add OpenTelemetry spans to track transaction lifecycle
4. **Caching**: Implement Redis/LocalStorage fallback for "last known" data during outages
5. **Consistency**: Standardize loading, error, and no-data states across all components

---

### 3.2 Architecture: Global Error & Retry Middleware

#### New Module: `src/lib/resilient-api-client.ts`

```typescript
// Resilient API Client with Timeout, Retry & Circuit Breaker

interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterFactor: number;
}

interface CircuitBreakerConfig {
  failureThreshold: number;      // # of failures before opening
  successThreshold: number;      // # of successes before closing
  timeout: number;               // Time in OPEN state before HALF_OPEN (ms)
}

interface ResilientApiFetchOptions extends ApiFetchOptions {
  retryConfig?: Partial<RetryConfig>;
  circuitBreakerId?: string;
  timeoutMs?: number;
  signal?: AbortSignal;
}

/**
 * Enhanced apiFetch with:
 * - Request timeouts (AbortController)
 * - Exponential backoff retry for idempotent operations
 * - Circuit breaker per endpoint
 * - Cancellation support (signal)
 */
export async function resilientApiFetch(
  path: string,
  options: ResilientApiFetchOptions = {}
): Promise<Response> {
  // 1. Check circuit breaker for this endpoint
  // 2. Set up AbortController with timeout
  // 3. Execute fetch with retry loop
  // 4. Record success/failure for circuit breaker
  // 5. Return response or throw after max retries
}

// Circuit breaker state machine: CLOSED → OPEN → HALF_OPEN → CLOSED
class CircuitBreaker {
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";
  private failureCount = 0;
  private successCount = 0;
  private nextAttemptTime = 0;

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() < this.nextAttemptTime) {
        throw new Error(`[Circuit Breaker] Open. Retry after ${new Date(this.nextAttemptTime)}`);
      }
      this.state = "HALF_OPEN";
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  private onSuccess() {
    this.failureCount = 0;
    if (this.state === "HALF_OPEN") {
      this.successCount++;
      if (this.successCount >= 2) {
        this.state = "CLOSED";
        this.successCount = 0;
      }
    }
  }

  private onFailure() {
    this.failureCount++;
    if (this.failureCount >= 5) {
      this.state = "OPEN";
      this.nextAttemptTime = Date.now() + 60_000; // Back off for 60s
    }
  }
}
```

---

#### New Module: `src/lib/cache-strategy.ts`

```typescript
/**
 * Hybrid caching: Redis (server) + LocalStorage (client)
 * Serves "last known" data during API outages
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiryMs: number;
}

class HybridCache<T> {
  private localKey: string;
  private expiryMs: number;

  constructor(key: string, expiryMs: number = 5 * 60 * 1000) {
    this.localKey = `cache:${key}`;
    this.expiryMs = expiryMs;
  }

  async get(): Promise<T | null> {
    const stored = localStorage.getItem(this.localKey);
    if (!stored) return null;

    const entry: CacheEntry<T> = JSON.parse(stored);
    if (Date.now() - entry.timestamp > entry.expiryMs) {
      localStorage.removeItem(this.localKey);
      return null;
    }
    return entry.data;
  }

  async set(data: T): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiryMs: this.expiryMs,
    };
    localStorage.setItem(this.localKey, JSON.stringify(entry));
  }

  async clear(): Promise<void> {
    localStorage.removeItem(this.localKey);
  }
}

// Usage in components:
// const transactionCache = new HybridCache('transactions:account:123', 5 * 60 * 1000);
// const fallback = await transactionCache.get();
// if (fallback) renderCachedData(fallback);
```

---

#### New Module: `src/lib/global-error-reducer.ts` (Store for Errors)

```typescript
/**
 * Centralized error state machine
 * Replaces scattered setLoadError() calls across components
 */

interface GlobalError {
  id: string;
  message: string;
  code?: string;
  severity: "info" | "warning" | "error" | "critical";
  timestamp: number;
  canRetry: boolean;
  retryFn?: () => Promise<void>;
}

interface ErrorStore {
  errors: GlobalError[];
  addError: (error: GlobalError) => void;
  clearError: (id: string) => void;
  clearAll: () => void;
  hasError: (severity: "critical") => boolean;
}

// Implementation: Zustand or React Context
// export const useErrorStore = create<ErrorStore>((set) => ({
//   errors: [],
//   addError: (error) => set((state) => ({
//     errors: [...state.errors, error],
//   })),
//   // ...
// }));
```

---

#### New Module: `src/hooks/useResilientData.ts` (Smart Hook)

```typescript
/**
 * Replaces useAsync + component state
 * Handles loading, error, retry, caching, and cancellation
 */

interface UseResilientDataOptions {
  cacheKeyForFallback?: string;
  retryConfig?: Partial<RetryConfig>;
  timeoutMs?: number;
  showErrorToast?: boolean;
}

export function useResilientData<T>(
  fetchFn: (signal: AbortSignal) => Promise<T>,
  deps: any[],
  options: UseResilientDataOptions = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isCached, setIsCached] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    try {
      // Try cache first if key provided
      if (options.cacheKeyForFallback) {
        const cached = await getFromCache(options.cacheKeyForFallback);
        if (cached) {
          setData(cached);
          setIsCached(true);
        }
      }

      // Fetch with resilient client
      const result = await resilientApiFetch(..., {
        signal: abortControllerRef.current.signal,
        timeoutMs: options.timeoutMs ?? 30_000,
        retryConfig: options.retryConfig,
      });

      setData(result);
      setIsCached(false);

      // Update cache
      if (options.cacheKeyForFallback) {
        await saveToCache(options.cacheKeyForFallback, result);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);

      if (options.showErrorToast) {
        toast.error(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, deps);

  useEffect(() => {
    fetchData();
    return () => abortControllerRef.current?.abort();
  }, [fetchData]);

  return { data, isLoading, error, isCached, retry: fetchData };
}

// Usage in Dashboard:
// const { data: transactions, isLoading, error, isCached, retry } = useResilientData(
//   (signal) => getRecentTransactions(accountId, 50, { signal }),
//   [accountId],
//   { cacheKeyForFallback: `txs:${accountId}`, timeoutMs: 30_000, showErrorToast: true }
// );
```

---

### 3.3 UI Component Standardization

#### New Component: `src/components/DataLoadingState.tsx`

```typescript
/**
 * Unified loading, error, and no-data state UI
 * Ensures consistency across dashboard, transactions, accounts, etc.
 */

interface DataLoadingStateProps {
  isLoading: boolean;
  error: Error | null;
  isCached: boolean;
  onRetry: () => void;
  children: React.ReactNode;
  fallbackMessage?: string;
}

export function DataLoadingState({
  isLoading,
  error,
  isCached,
  onRetry,
  children,
  fallbackMessage = "No data available",
}: DataLoadingStateProps) {
  if (isLoading) {
    return <TransactionSkeleton count={5} />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-600">Failed to load data</h3>
            <p className="text-sm text-red-500 mt-1">{error.message}</p>
            {isCached && (
              <p className="text-xs text-red-400 mt-2">
                Showing cached data from {formatRelativeTime(Date.now())}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onRetry}
            className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-white text-sm font-medium hover:bg-red-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </button>
          {isCached && (
            <button
              onClick={() => localStorage.removeItem(...)}
              className="text-sm text-red-600 hover:text-red-700 underline"
            >
              Clear cached data
            </button>
          )}
        </div>
      </div>
    );
  }

  return children;
}
```

---

#### Enhanced Dashboard Error Rendering

```typescript
// Replace inline error card (Dashboard.tsx:226-248) with:
<DataLoadingState
  isLoading={isLoading}
  error={loadError ? new Error(loadError) : null}
  isCached={isCachedData}
  onRetry={() => { setLoadError(null); setIsLoading(true); loadData(); }}
>
  {/* Dashboard content */}
</DataLoadingState>
```

---

### 3.4 OpenTelemetry Instrumentation

#### New Module: `src/lib/telemetry.ts`

```typescript
/**
 * Real-time observability: trace transaction API calls
 */

import { trace, context, SpanStatusCode } from "@opentelemetry/api";

const tracer = trace.getTracer("finbank-dashboard");

export async function withSpan<T>(
  spanName: string,
  fn: (span: Span) => Promise<T>,
  attributes?: Record<string, any>
): Promise<T> {
  const span = tracer.startSpan(spanName);

  if (attributes) {
    Object.entries(attributes).forEach(([key, value]) => {
      span.setAttribute(key, value);
    });
  }

  try {
    const result = await context.with(trace.setSpan(context.active(), span), async () => {
      return fn(span);
    });

    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error instanceof Error ? error.message : String(error),
    });
    span.recordException(error instanceof Error ? error : new Error(String(error)));
    throw error;
  } finally {
    span.end();
  }
}

// Usage in transactions.ts:
export async function getTransactionsByAccountId(...) {
  return withSpan("getTransactionsByAccountId", async (span) => {
    span.setAttribute("accountId", accountId);
    span.setAttribute("pageSize", pageSize);

    const resp = await apiFetch(...);
    span.setAttribute("http.status_code", resp.status);

    if (!resp.ok) {
      throw new Error("Failed to load transactions");
    }

    const data = await resp.json();
    span.setAttribute("transaction.count", data.data?.length ?? 0);
    return data.data;
  });
}
```

---

### 3.5 Implementation Roadmap (Phased Approach)

| Phase | Component | Effort | Duration | Risk | Priority |
|-------|-----------|--------|----------|------|----------|
| **4A** | `resilient-api-client.ts` (timeout + retry) | 3h | Day 1 | Low | 🔴 Critical |
| **4B** | Update `transactions.ts` to use resilient client | 1h | Day 1 | Low | 🔴 Critical |
| **4C** | `useResilientData.ts` hook | 3h | Day 2 | Medium | 🔴 Critical |
| **4D** | `DataLoadingState.tsx` component | 2h | Day 2 | Low | 🟠 High |
| **4E** | Refactor Dashboard, TransactionHistory, TransactionSearch | 4h | Day 2-3 | Medium | 🟠 High |
| **4F** | `cache-strategy.ts` + integration | 3h | Day 3 | Medium | 🟡 Medium |
| **4G** | `global-error-reducer.ts` + toast integration | 2h | Day 3 | Low | 🟡 Medium |
| **5A** | OpenTelemetry setup & instrumentation | 3h | Day 4 | Medium | 🟡 Medium |
| **5B** | DORA metrics dashboard (recovery time, deployment freq) | 2h | Day 4 | Low | 🟡 Medium |

---

### 3.6 Success Criteria

#### Functional Reliability
- ✅ Dashboard loads within 5 seconds (or shows cached data)
- ✅ Transient 5xx errors retry automatically (up to 3 times with exponential backoff)
- ✅ Circuit breaker prevents hammering a failing backend (opens after 5 failures, backs off 60s)
- ✅ Network timeouts (>30s) fail gracefully, not hang indefinitely

#### User Experience
- ✅ All error states show consistent red warning card with "Retry" button
- ✅ Loading states show skeletons or spinners (not blank)
- ✅ Cached data displayed during outages with "Last updated Xs ago" label
- ✅ Cancelled requests (on unmount) don't trigger stale state warnings

#### Design Consistency
- ✅ All error cards match Dashboard error card styling (red border, red text, white bg)
- ✅ All loading states use TransactionSkeleton or Spinner
- ✅ All no-data states show "No transactions" with appropriate icon

#### Observability
- ✅ Every API call traced with OpenTelemetry span (method, endpoint, status, latency)
- ✅ Circuit breaker state changes logged
- ✅ Retry attempts logged with backoff delay

---

## PHASE 4 & 5: Implementation & Validation (Deferred)

### 4.1 Atomic Implementation Plan
Once approved, implementation will proceed in this order:
1. Create `resilient-api-client.ts` + update `api-client.ts`
2. Update `transactions.ts` to use resilient client
3. Create `useResilientData.ts` hook with AbortController support
4. Create `DataLoadingState.tsx` component
5. Refactor Dashboard, TransactionHistory, TransactionSearch to use new hook & component
6. Add caching layer and global error reducer
7. Instrument with OpenTelemetry

Each step will include:
- ✅ Side-by-side diff (before/after)
- ✅ Unit tests for error conditions (500, timeout, network failure)
- ✅ Integration test simulating dashboard load with various failure modes

### 5.1 DORA Compliance & Observability
Once phase 4 is complete:
- ✅ Recovery time: Dashboard recovers from 502 error in <5 seconds (via retry)
- ✅ Change failure rate: Pre-production tests catch regressions
- ✅ Deployment frequency: Deploy incrementally (one module per PR)
- ✅ Lead time for changes: ~1 week from design to production

---

## QUESTIONS FOR APPROVAL

Before proceeding to PHASE 4, please confirm:

1. **Retry Strategy**: Should transient retries apply to all HTTP methods (GET, POST) or only idempotent reads (GET)?
   - Recommended: GET only (POST/PUT/DELETE risk duplicates)

2. **Circuit Breaker Thresholds**: 
   - Should we use 5 failures to open, or adjust?
   - Recommended: 5 failures, 60-second backoff

3. **Cache Expiry**:
   - How long should "last known" data be served? (5 min? 1 hour?)
   - Recommended: 5 minutes for transactions, 1 hour for account info

4. **Error Toast Placement**:
   - Global toast at top/bottom of page?
   - Or inline in each failed component?
   - Recommended: Both (toast for critical, inline for component-level)

5. **OpenTelemetry Endpoint**:
   - Do you have a backend OTEL collector (e.g., Jaeger, DataDog)?
   - Or should we log spans locally for now?
   - Recommended: Local logging for MVP, integrate backend collector later

---

## Approval Checklist

- [ ] Root cause analysis (pathology) accepted
- [ ] Design audit findings accepted
- [ ] Remediation strategy approved
- [ ] Questions (above) answered
- [ ] Ready to proceed to PHASE 4 implementation

