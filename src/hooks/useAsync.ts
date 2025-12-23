import { useState, useCallback } from "react";

export function useAsync<T>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const run = useCallback(async (fn: () => Promise<T>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fn();
      setLoading(false);
      return res;
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      setLoading(false);
      throw e;
    }
  }, []);

  return { loading, error, run, setError } as const;
}

export default useAsync;
