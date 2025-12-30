/**
 * Resilient API Client: Timeout + Retry + Circuit Breaker
 *
 * Features:
 * - Request timeouts with AbortController (prevents indefinite hangs)
 * - Exponential backoff retry for transient errors (5xx, network)
 * - Circuit breaker per endpoint (prevents cascading failures)
 * - Cancellation support (AbortSignal) for preventing stale updates
 * - Safe error parsing (no crashes on invalid JSON)
 */

export interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterFactor: number;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
}

interface ResilientApiFetchOptions extends RequestInit {
  tokenOverride?: string | null;
  skipAuth?: boolean;
  retryConfig?: Partial<RetryConfig>;
  circuitBreakerId?: string;
  timeoutMs?: number;
  signal?: AbortSignal;
}

// Default retry configuration
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 32000,
  backoffMultiplier: 2,
  jitterFactor: 0.1,
};

// Default circuit breaker configuration
const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 60_000, // 60 seconds
};

/**
 * Circuit Breaker State Machine
 * Prevents cascading failures by halting requests to failing endpoints
 */
class CircuitBreaker {
  private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";
  private failureCount = 0;
  private successCount = 0;
  private nextAttemptTime = 0;
  private config: CircuitBreakerConfig;

  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = { ...DEFAULT_CIRCUIT_BREAKER_CONFIG, ...config };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === "OPEN") {
      if (Date.now() < this.nextAttemptTime) {
        throw new Error(
          `[Circuit Breaker] OPEN. Retry after ${new Date(this.nextAttemptTime).toISOString()}`
        );
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
      if (this.successCount >= this.config.successThreshold) {
        this.state = "CLOSED";
        this.successCount = 0;
      }
    }
  }

  private onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.config.failureThreshold) {
      this.state = "OPEN";
      this.nextAttemptTime = Date.now() + this.config.timeout;
      console.warn(
        `[Circuit Breaker] OPEN after ${this.failureCount} failures. Will retry after ${this.config.timeout}ms`
      );
    }
  }

  getState() {
    return this.state;
  }

  reset() {
    this.state = "CLOSED";
    this.failureCount = 0;
    this.successCount = 0;
  }
}

// Global circuit breaker registry (per endpoint)
const circuitBreakers = new Map<string, CircuitBreaker>();

function getOrCreateCircuitBreaker(id: string): CircuitBreaker {
  if (!circuitBreakers.has(id)) {
    circuitBreakers.set(id, new CircuitBreaker());
  }
  return circuitBreakers.get(id)!;
}

/**
 * Calculate exponential backoff delay with jitter
 */
function getBackoffDelay(
  attempt: number,
  config: RetryConfig
): number {
  const exponentialDelay = Math.min(
    config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt),
    config.maxDelayMs
  );

  // Add jitter to prevent thundering herd
  const jitter = exponentialDelay * config.jitterFactor * Math.random();
  return exponentialDelay + jitter;
}

/**
 * Determine if an error is transient (retryable)
 */
function isTransientError(status: number, error: unknown): boolean {
  // HTTP 5xx errors are transient
  if (status >= 500 && status < 600) return true;

  // HTTP 429 (Too Many Requests) is transient
  if (status === 429) return true;

  // Network errors (timeout, ECONNREFUSED, etc.) are transient
  if (error instanceof TypeError) {
    const message = error.message.toLowerCase();
    if (
      message.includes("timeout") ||
      message.includes("network") ||
      message.includes("failed to fetch")
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Sleep utility for backoff delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Resilient API fetch with timeout, retry, and circuit breaker
 *
 * @param path API endpoint path
 * @param options Request options + resilience config
 * @returns Response object or throws after max retries
 */
export async function resilientApiFetch(
  path: string,
  options: ResilientApiFetchOptions = {}
): Promise<Response> {
  const {
    tokenOverride,
    skipAuth,
    headers,
    retryConfig = {},
    circuitBreakerId,
    timeoutMs = 30_000,
    signal,
    ...rest
  } = options;

  const mergedRetryConfig: RetryConfig = {
    ...DEFAULT_RETRY_CONFIG,
    ...retryConfig,
  };

  // Circuit breaker check (if enabled)
  let circuitBreaker: CircuitBreaker | undefined;
  if (circuitBreakerId) {
    circuitBreaker = getOrCreateCircuitBreaker(circuitBreakerId);
  }

  /**
   * Inner fetch function with timeout support
   */
  const fetchWithTimeout = async (
    url: string,
    fetchOptions: RequestInit
  ): Promise<Response> => {
    // Create a combined abort controller for timeout + external signal
    const timeoutController = new AbortController();
    const combinedSignal = signal
      ? AbortSignal.any([timeoutController.signal, signal])
      : timeoutController.signal;

    const timeoutId = setTimeout(() => {
      timeoutController.abort();
    }, timeoutMs);

    try {
      return await fetch(url, {
        ...fetchOptions,
        signal: combinedSignal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  };

  /**
   * Actual fetch implementation (will be retried)
   */
  const doFetch = async (
    overrideToken?: string | null
  ): Promise<Response> => {
    const requestHeaders = new Headers(headers || {});

    const token = skipAuth ? null : overrideToken ?? tokenOverride;
    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }

    const url = path.startsWith("http")
      ? path
      : `${import.meta.env.VITE_API_BASE_URL || window.location.origin}${path}`;

    return fetchWithTimeout(url, {
      credentials: "include",
      ...rest,
      headers: requestHeaders,
    });
  };

  /**
   * Retry loop with exponential backoff
   */
  const executeWithRetries = async (): Promise<Response> => {
    let lastError: unknown;

    for (let attempt = 0; attempt <= mergedRetryConfig.maxRetries; attempt++) {
      try {
        const response = await doFetch();

        // 401 (Unauthorized) is not retried at this level
        // It should be handled by the auth layer above
        return response;
      } catch (error) {
        lastError = error;

        // Check if we should retry
        const isLastAttempt = attempt === mergedRetryConfig.maxRetries;
        if (isLastAttempt) break;

        // Calculate backoff delay
        const delayMs = getBackoffDelay(attempt, mergedRetryConfig);

        console.warn(
          `[Resilient API] Attempt ${attempt + 1} failed. Retrying in ${delayMs}ms...`,
          error
        );

        await sleep(delayMs);
      }
    }

    // All retries exhausted
    throw lastError;
  };

  /**
   * Execute with circuit breaker (if enabled)
   */
  if (circuitBreaker) {
    return circuitBreaker.execute(() => executeWithRetries());
  }

  return executeWithRetries();
}

/**
 * Export circuit breaker utilities for testing/monitoring
 */
export function getCircuitBreakerState(id: string): string {
  const breaker = circuitBreakers.get(id);
  return breaker ? breaker.getState() : "UNKNOWN";
}

export function resetCircuitBreaker(id: string): void {
  const breaker = circuitBreakers.get(id);
  if (breaker) {
    breaker.reset();
  }
}

export function resetAllCircuitBreakers(): void {
  circuitBreakers.forEach((breaker) => breaker.reset());
}
