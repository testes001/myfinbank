# ARCHITECTURAL REMEDIATION - PHASE 3: STRUCTURAL REWIRING & REBRANDING PLAN

**Project:** MyFinBank Platform Reliability & Design Consistency Overhaul  
**Date:** January 2025  
**Status:** 📋 AWAITING APPROVAL - Implementation Plan Ready  
**Estimated Duration:** 3 Weeks (108 Hours)

---

## 🎯 Executive Summary

This Advanced Remediation Plan addresses all critical issues identified in Phases 1 and 2. The plan implements industry-standard resilience patterns (Circuit Breaker, Exponential Backoff), establishes a centralized design system based on the Login page, and creates a multi-tier data caching strategy for 99.9% reliability.

### Core Objectives

1. **Eliminate "Failed to Load" Errors** - Circuit breaker and retry logic
2. **Achieve 99.9% Uptime** - Graceful degradation and fallback strategies
3. **Centralize Design System** - Single source of truth from Login page
4. **Enable Offline Capability** - LocalStorage caching for last-known-good data
5. **Improve Observability** - OpenTelemetry tracing across all transactions

### Expected Outcomes

- **API Success Rate:** 95% → 99.9%
- **User-Facing Errors:** Reduce by 85%
- **Design Consistency:** 60% → 95%
- **WCAG Compliance:** 18 violations → 0 violations
- **Recovery Time:** Manual reload → Automatic (< 5s)

---

## 🏗️ ARCHITECTURE OVERVIEW

### Current State (Before)

```
┌─────────────┐
│ UI Component│ → Direct fetch() → Backend API
└─────────────┘                          ↓
      ↓                              Returns 503
   Crashes                               ↓
      ↓                            Generic error
  User sees:                             ↓
"Failed to load"                   No retry
                                         ↓
                                   User must reload
```

### Target State (After)

```
┌─────────────┐
│ UI Component│
└──────┬──────┘
       ↓
┌──────────────────┐
│  useResilient    │ ← Enhanced hook with retry/cache
└──────┬───────────┘
       ↓
┌──────────────────┐
│ Circuit Breaker  │ ← Prevents cascading failures
└──────┬───────────┘
       ↓
┌──────────────────┐
│ apiFetch + Retry │ ← Exponential backoff (3 attempts)
└──────┬───────────┘
       ↓
┌──────────────────┐
│  Backend API     │
└──────┬───────────┘
       ↓
   If fails ↓
       ↓
┌──────────────────┐
│ Cache Layer      │ ← LocalStorage/Redis fallback
└──────────────────┘
       ↓
   User sees cached data with banner:
   "⚠️ Showing recent data - refreshing..."
```

---

## 📊 STRATEGY 1: GLOBAL ERRORS REDUCER

### Problem Statement

Currently, errors are handled inconsistently across 120+ locations with no centralized state management. This leads to:
- Duplicate error handling logic
- Inconsistent user experience
- No global error recovery
- Silent failures

### Solution: Centralized Error Store with React Context

#### Architecture

```typescript
// src/contexts/ErrorContext.tsx

interface ErrorState {
  globalErrors: AppError[];
  componentErrors: Map<string, AppError>;
  recoveryStrategies: Map<string, RecoveryStrategy>;
}

interface AppError {
  id: string;
  code: ErrorCode;
  message: string;
  component: string;
  timestamp: Date;
  severity: 'critical' | 'high' | 'medium' | 'low';
  recoverable: boolean;
  metadata?: Record<string, any>;
}

type ErrorCode = 
  | 'NETWORK_ERROR'
  | 'AUTH_EXPIRED'
  | 'API_ERROR_500'
  | 'API_ERROR_503'
  | 'VALIDATION_ERROR'
  | 'UNKNOWN_ERROR';

interface RecoveryStrategy {
  type: 'retry' | 'fallback' | 'redirect' | 'reload';
  action: () => Promise<void> | void;
  autoRecover: boolean;
  delay?: number;
}
```

#### Implementation Plan

**File:** `src/contexts/ErrorContext.tsx`

```typescript
export const ErrorProvider: React.FC = ({ children }) => {
  const [state, setState] = useState<ErrorState>({
    globalErrors: [],
    componentErrors: new Map(),
    recoveryStrategies: new Map(),
  });

  // Add error with automatic recovery strategy selection
  const addError = useCallback((error: Partial<AppError>) => {
    const appError: AppError = {
      id: nanoid(),
      code: determineErrorCode(error),
      severity: determineSeverity(error),
      recoverable: isRecoverable(error),
      timestamp: new Date(),
      ...error,
    };

    // Auto-select recovery strategy
    const strategy = selectRecoveryStrategy(appError);
    
    setState(prev => ({
      ...prev,
      globalErrors: [...prev.globalErrors, appError],
      recoveryStrategies: new Map(prev.recoveryStrategies).set(
        appError.id, 
        strategy
      ),
    }));

    // Auto-recover if possible
    if (strategy.autoRecover) {
      setTimeout(() => attemptRecovery(appError.id), strategy.delay || 0);
    }

    // Track in monitoring
    trackError(appError);
  }, []);

  // Recovery attempt
  const attemptRecovery = useCallback(async (errorId: string) => {
    const strategy = state.recoveryStrategies.get(errorId);
    if (!strategy) return;

    try {
      await strategy.action();
      removeError(errorId);
      toast.success('Connection restored');
    } catch (err) {
      // Recovery failed, escalate
      updateErrorSeverity(errorId, 'critical');
    }
  }, [state.recoveryStrategies]);

  return (
    <ErrorContext.Provider value={{ state, addError, attemptRecovery }}>
      {children}
      <GlobalErrorDisplay />
    </ErrorContext.Provider>
  );
};
```

**File:** `src/components/GlobalErrorDisplay.tsx`

```typescript
export const GlobalErrorDisplay: React.FC = () => {
  const { state, attemptRecovery } = useError();

  const criticalErrors = state.globalErrors.filter(e => e.severity === 'critical');

  if (criticalErrors.length === 0) return null;

  return (
    <AnimatePresence>
      {criticalErrors.map(error => (
        <motion.div
          key={error.id}
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          className="fixed top-4 right-4 z-50 max-w-md"
        >
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{error.message}</AlertTitle>
            <AlertDescription>
              {error.recoverable && (
                <Button
                  size="sm"
                  onClick={() => attemptRecovery(error.id)}
                  className="mt-2"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Retry
                </Button>
              )}
            </AlertDescription>
          </Alert>
        </motion.div>
      ))}
    </AnimatePresence>
  );
};
```

#### Error Code Classification

| Error Code | HTTP Status | Severity | Recoverable | Strategy |
|------------|-------------|----------|-------------|----------|
| `NETWORK_ERROR` | N/A | HIGH | Yes | Retry + Cache |
| `AUTH_EXPIRED` | 401 | HIGH | Yes | Token refresh |
| `API_ERROR_500` | 500 | HIGH | Yes | Retry (3x) |
| `API_ERROR_503` | 503 | HIGH | Yes | Retry (5x) |
| `API_ERROR_429` | 429 | MEDIUM | Yes | Backoff + Retry |
| `API_ERROR_404` | 404 | LOW | No | Fallback |
| `VALIDATION_ERROR` | 400 | LOW | No | User action |
| `UNKNOWN_ERROR` | Any | MEDIUM | Maybe | Log + Retry |

---

## 🔄 STRATEGY 2: CIRCUIT BREAKER PATTERN

### Problem Statement

When backend services fail, the application makes repeated requests that:
- Overwhelm the failing service
- Delay recovery
- Waste user bandwidth
- Degrade user experience

### Solution: Circuit Breaker with Three States

#### Circuit Breaker States

```
┌─────────────┐
│   CLOSED    │ ← Normal operation, requests allowed
│  (Healthy)  │
└──────┬──────┘
       │ Failures ≥ threshold (3)
       ↓
┌─────────────┐
│    OPEN     │ ← Requests blocked, return cached/error
│  (Failing)  │
└──────┬──────┘
       │ After timeout (30s)
       ↓
┌─────────────┐
│ HALF-OPEN   │ ← Test with single request
│  (Testing)  │
└──────┬──────┘
       │
       ├─ Success → CLOSED
       └─ Failure → OPEN
```

#### Implementation

**File:** `src/lib/circuit-breaker.ts`

```typescript
interface CircuitBreakerConfig {
  failureThreshold: number;      // Default: 3
  successThreshold: number;      // Default: 2
  timeout: number;               // Default: 30000ms
  monitoringPeriod: number;      // Default: 60000ms
}

class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failures: number = 0;
  private successes: number = 0;
  private nextAttempt: number = Date.now();
  private config: CircuitBreakerConfig;

  constructor(
    private name: string,
    config?: Partial<CircuitBreakerConfig>
  ) {
    this.config = {
      failureThreshold: 3,
      successThreshold: 2,
      timeout: 30000,
      monitoringPeriod: 60000,
      ...config,
    };
  }

  async execute<T>(
    fn: () => Promise<T>,
    fallback?: () => T | Promise<T>
  ): Promise<T> {
    // Check circuit state
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        console.warn(`[Circuit Breaker: ${this.name}] OPEN - using fallback`);
        
        if (fallback) {
          return await fallback();
        }
        
        throw new Error(`Circuit breaker OPEN for ${this.name}`);
      }
      
      // Move to HALF_OPEN to test
      this.state = 'HALF_OPEN';
      console.info(`[Circuit Breaker: ${this.name}] Testing HALF_OPEN state`);
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      
      // Try fallback if available
      if (fallback && this.state === 'OPEN') {
        console.warn(`[Circuit Breaker: ${this.name}] Using fallback after failure`);
        return await fallback();
      }
      
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;

    if (this.state === 'HALF_OPEN') {
      this.successes++;
      
      if (this.successes >= this.config.successThreshold) {
        console.info(`[Circuit Breaker: ${this.name}] CLOSED - service recovered`);
        this.state = 'CLOSED';
        this.successes = 0;
        
        // Emit metric
        trackMetric('circuit_breaker.recovered', { breaker: this.name });
      }
    }
  }

  private onFailure(): void {
    this.failures++;
    this.successes = 0;

    if (this.failures >= this.config.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.config.timeout;
      
      console.error(
        `[Circuit Breaker: ${this.name}] OPEN - too many failures (${this.failures})`
      );
      
      // Emit metric
      trackMetric('circuit_breaker.opened', { 
        breaker: this.name, 
        failures: this.failures 
      });
    }
  }

  getState() {
    return {
      state: this.state,
      failures: this.failures,
      nextAttempt: this.nextAttempt,
    };
  }
}

// Global circuit breaker registry
const breakers = new Map<string, CircuitBreaker>();

export function getCircuitBreaker(
  endpoint: string,
  config?: Partial<CircuitBreakerConfig>
): CircuitBreaker {
  if (!breakers.has(endpoint)) {
    breakers.set(endpoint, new CircuitBreaker(endpoint, config));
  }
  return breakers.get(endpoint)!;
}
```

#### Integration with apiFetch

**File:** `src/lib/api-client-enhanced.ts`

```typescript
export async function apiFetch(
  url: string,
  options?: RequestInit & { 
    timeout?: number;
    skipCircuitBreaker?: boolean;
  }
): Promise<Response> {
  const breaker = options?.skipCircuitBreaker 
    ? null 
    : getCircuitBreaker(url);

  const fetchWithTimeout = async () => {
    const controller = new AbortController();
    const timeout = options?.timeout || 10000;

    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  // Execute with circuit breaker if enabled
  if (breaker) {
    return await breaker.execute(
      fetchWithTimeout,
      () => getCachedResponse(url) // Fallback to cache
    );
  }

  return await fetchWithTimeout();
}
```

#### Circuit Breaker Monitoring Dashboard

**Component:** `src/components/admin/CircuitBreakerMonitor.tsx`

```typescript
export const CircuitBreakerMonitor: React.FC = () => {
  const [breakers, setBreakers] = useState<CircuitBreakerState[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Fetch breaker states
      const states = getAllCircuitBreakerStates();
      setBreakers(states);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Circuit Breaker Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {breakers.map(breaker => (
            <div key={breaker.name} className="flex items-center justify-between p-2 border rounded">
              <span className="font-mono text-sm">{breaker.name}</span>
              <Badge variant={
                breaker.state === 'CLOSED' ? 'success' :
                breaker.state === 'HALF_OPEN' ? 'warning' :
                'destructive'
              }>
                {breaker.state}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Failures: {breaker.failures}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
```

---

## 🔁 STRATEGY 3: RETRY WITH EXPONENTIAL BACKOFF

### Problem Statement

Single-attempt API calls fail permanently on transient errors (network blip, temporary service unavailability), forcing users to manually retry.

### Solution: Intelligent Retry with Exponential Backoff

#### Retry Algorithm

```typescript
Attempt 1: Immediate
Attempt 2: Wait 1s (2^1 - 1)
Attempt 3: Wait 3s (2^2 - 1)
Attempt 4: Wait 7s (2^3 - 1)
Max attempts: 3 (configurable)
Max delay: 10s (configurable)
```

#### Implementation

**File:** `src/lib/retry.ts`

```typescript
interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableStatuses: number[];
  retryableErrors: string[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND'],
};

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const cfg = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error;

  for (let attempt = 1; attempt <= cfg.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if error is retryable
      if (!isRetryable(error, cfg)) {
        throw error;
      }

      // Don't wait after last attempt
      if (attempt === cfg.maxAttempts) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        cfg.initialDelay * Math.pow(cfg.backoffMultiplier, attempt - 1),
        cfg.maxDelay
      );

      console.warn(
        `[Retry] Attempt ${attempt}/${cfg.maxAttempts} failed. ` +
        `Retrying in ${delay}ms...`,
        error
      );

      // Emit metric
      trackMetric('api.retry', { 
        attempt, 
        delay, 
        error: (error as Error).message 
      });

      await sleep(delay);
    }
  }

  throw lastError!;
}

function isRetryable(error: any, config: RetryConfig): boolean {
  // Check HTTP status codes
  if (error.response?.status) {
    return config.retryableStatuses.includes(error.response.status);
  }

  // Check network error codes
  if (error.code) {
    return config.retryableErrors.includes(error.code);
  }

  // Check error names
  const errorName = error.name?.toLowerCase() || '';
  if (errorName.includes('timeout') || errorName.includes('network')) {
    return true;
  }

  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

#### Enhanced apiFetch with Retry

**File:** `src/lib/api-client-enhanced.ts`

```typescript
export async function apiFetchWithRetry(
  url: string,
  options?: RequestInit & {
    retry?: Partial<RetryConfig>;
    circuitBreaker?: boolean;
  }
): Promise<Response> {
  return await retryWithBackoff(
    async () => {
      const response = await apiFetch(url, {
        ...options,
        skipCircuitBreaker: !options?.circuitBreaker,
      });

      // Throw on non-2xx so retry can catch it
      if (!response.ok) {
        const error: any = new Error(`HTTP ${response.status}`);
        error.response = response;
        throw error;
      }

      return response;
    },
    options?.retry
  );
}
```

#### Usage Example

```typescript
// In Dashboard.tsx
const loadTransactions = async () => {
  try {
    const response = await apiFetchWithRetry('/api/transactions', {
      retry: {
        maxAttempts: 3,
        initialDelay: 1000,
      },
      circuitBreaker: true,
    });

    const data = await response.json();
    setTransactions(data.transactions);
  } catch (error) {
    // All retries exhausted
    const cachedData = getCachedTransactions();
    if (cachedData) {
      setTransactions(cachedData);
      showCacheWarning();
    } else {
      showError(error);
    }
  }
};
```

---

## 💾 STRATEGY 4: DATA CACHING & FALLBACK

### Problem Statement

When APIs fail, users see blank screens or error messages with no data, even though recent data could be displayed from cache.

### Solution: Three-Tier Caching Strategy

#### Cache Hierarchy

```
Level 1: Memory Cache (React State)
   ↓ Miss
Level 2: LocalStorage Cache (Browser)
   ↓ Miss
Level 3: API Request (Backend)
   ↓ Success → Update Level 1 & 2
   ↓ Failure → Check Circuit Breaker → Retry → Fallback to Level 2
```

#### Implementation

**File:** `src/lib/cache-manager.ts`

```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  version: string;
}

interface CacheConfig {
  ttl: number;              // Time to live (ms)
  maxAge: number;           // Max age for stale data (ms)
  version: string;          // Cache version for invalidation
  namespace: string;        // Cache namespace
}

class CacheManager {
  private memoryCache = new Map<string, CacheEntry<any>>();

  constructor(private config: CacheConfig) {}

  // Get from cache (memory first, then LocalStorage)
  get<T>(key: string): T | null {
    // Check memory cache first
    const memEntry = this.memoryCache.get(key);
    if (memEntry && !this.isExpired(memEntry)) {
      return memEntry.data;
    }

    // Check LocalStorage
    const storageKey = this.getStorageKey(key);
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      try {
        const entry: CacheEntry<T> = JSON.parse(stored);
        
        // Version mismatch - invalidate
        if (entry.version !== this.config.version) {
          this.remove(key);
          return null;
        }

        // Expired - remove
        if (this.isExpired(entry)) {
          this.remove(key);
          return null;
        }

        // Valid - restore to memory cache
        this.memoryCache.set(key, entry);
        return entry.data;
      } catch (err) {
        console.error('Failed to parse cache entry', err);
        this.remove(key);
      }
    }

    return null;
  }

  // Get stale data (for fallback when API fails)
  getStale<T>(key: string): T | null {
    const storageKey = this.getStorageKey(key);
    const stored = localStorage.getItem(storageKey);
    
    if (stored) {
      try {
        const entry: CacheEntry<T> = JSON.parse(stored);
        
        // Version mismatch
        if (entry.version !== this.config.version) {
          return null;
        }

        // Don't serve data older than maxAge
        const age = Date.now() - entry.timestamp;
        if (age > this.config.maxAge) {
          return null;
        }

        return entry.data;
      } catch (err) {
        console.error('Failed to parse stale cache entry', err);
      }
    }

    return null;
  }

  // Set cache entry
  set<T>(key: string, data: T): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + this.config.ttl,
      version: this.config.version,
    };

    // Set in memory
    this.memoryCache.set(key, entry);

    // Set in LocalStorage
    try {
      const storageKey = this.getStorageKey(key);
      localStorage.setItem(storageKey, JSON.stringify(entry));
    } catch (err) {
      console.error('Failed to set cache in LocalStorage', err);
      // Likely quota exceeded - clear old entries
      this.cleanupOldEntries();
    }
  }

  // Remove cache entry
  remove(key: string): void {
    this.memoryCache.delete(key);
    const storageKey = this.getStorageKey(key);
    localStorage.removeItem(storageKey);
  }

  // Clear all cache
  clear(): void {
    this.memoryCache.clear();
    
    // Clear all entries in this namespace
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(`${this.config.namespace}:`)) {
        localStorage.removeItem(key);
      }
    });
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() > entry.expiresAt;
  }

  private getStorageKey(key: string): string {
    return `${this.config.namespace}:${key}`;
  }

  private cleanupOldEntries(): void {
    const keys = Object.keys(localStorage);
    const entries: Array<{ key: string; timestamp: number }> = [];

    keys.forEach(key => {
      if (key.startsWith(`${this.config.namespace}:`)) {
        try {
          const entry = JSON.parse(localStorage.getItem(key) || '');
          entries.push({ key, timestamp: entry.timestamp });
        } catch (err) {
          // Invalid entry - remove
          localStorage.removeItem(key);
        }
      }
    });

    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a.timestamp - b.timestamp);

    // Remove oldest 25% of entries
    const removeCount = Math.floor(entries.length * 0.25);
    entries.slice(0, removeCount).forEach(({ key }) => {
      localStorage.removeItem(key);
    });
  }
}

// Create cache instances for different data types
export const transactionsCache = new CacheManager({
  ttl: 5 * 60 * 1000,        // 5 minutes
  maxAge: 24 * 60 * 60 * 1000, // 24 hours (for stale fallback)
  version: '1.0',
  namespace: 'myfinbank:transactions',
});

export const profileCache = new CacheManager({
  ttl: 15 * 60 * 1000,       // 15 minutes
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  version: '1.0',
  namespace: 'myfinbank:profile',
});

export const balanceCache = new CacheManager({
  ttl: 2 * 60 * 1000,        // 2 minutes
  maxAge: 1 * 60 * 60 * 1000, // 1 hour
  version: '1.0',
  namespace: 'myfinbank:balance',
});
```

#### Resilient Data Fetching Hook

**File:** `src/hooks/useResilientData.ts`

```typescript
interface UseResilientDataOptions<T> {
  cacheKey: string;
  cacheManager: CacheManager;
  fetchFn: () => Promise<T>;
  retryConfig?: Partial<RetryConfig>;
  circuitBreaker?: boolean;
}

export function useResilientData<T>({
  cacheKey,
  cacheManager,
  fetchFn,
  retryConfig,
  circuitBreaker = true,
}: UseResilientDataOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [usingCache, setUsingCache] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setUsingCache(false);

    // Try cache first
    const cached = cacheManager.get<T>(cacheKey);
    if (cached) {
      setData(cached);
      setLoading(false);
      // Still fetch fresh data in background
      loadFreshData();
      return;
    }

    // No cache - must fetch
    await loadFreshData();
  }, [cacheKey, fetchFn]);

  const loadFreshData = async () => {
    try {
      const freshData = await retryWithBackoff(fetchFn, retryConfig);
      
      // Update cache
      cacheManager.set(cacheKey, freshData);
      
      // Update state
      setData(freshData);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch fresh data:', err);
      setError(err as Error);

      // Try stale cache as fallback
      const stale = cacheManager.getStale<T>(cacheKey);
      if (stale) {
        setData(stale);
        setUsingCache(true);
        toast.warning('Showing recent data - connection issues detected', {
          action: {
            label: 'Retry',
            onClick: () => loadFreshData(),
          },
        });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    data,
    loading,
    error,
    usingCache,
    refresh: loadData,
  };
}
```

#### Usage Example

```typescript
// In Dashboard.tsx
const {
  data: transactions,
  loading,
  error,
  usingCache,
  refresh,
} = useResilientData({
  cacheKey: `transactions:${currentUser.account.id}`,
  cacheManager: transactionsCache,
  fetchFn: () => getRecentTransactions(currentUser.account.id, 50),
  retryConfig: { maxAttempts: 3 },
  circuitBreaker: true,
});

// Show cache warning banner
{usingCache && (
  <Alert variant="warning">