import { useState, useEffect, useCallback } from 'react';

// A simple global cache store for API responses
const globalCache = new Map<string, any>();
const globalPromises = new Map<string, Promise<any>>();
const globalStale = new Set<string>();

export function clearQueryCache() {
  // Mark all existing keys as stale instead of clearing them.
  // This allows the UI to show old data instantly while fetching new data in the background.
  for (const key of globalCache.keys()) {
    globalStale.add(key);
  }
}

/**
 * A lightweight SWR-like hook for caching API responses globally across tabs.
 * @param queryKey A unique string key for this query (e.g., API endpoint path)
 * @param queryFn An async function that fetches the data
 */
export function useCachedQuery<T>(queryKey: string, queryFn: () => Promise<T>) {
  // If we already have data in cache, we start with it and skip loading state
  const initialData = globalCache.get(queryKey);
  const [data, setData] = useState<T | undefined>(initialData);
  const [loading, setLoading] = useState<boolean>(!initialData);
  const [error, setError] = useState<Error | null>(null);

  const fetch = useCallback(async (force = false) => {
    const isStale = globalStale.has(queryKey);
    const shouldFetch = !globalCache.has(queryKey) || force || isStale;

    // If not forced/stale and we already have a pending promise for this key, await it
    if (!shouldFetch && globalPromises.has(queryKey)) {
      if (!globalCache.has(queryKey)) setLoading(true);
      try {
        const result = await globalPromises.get(queryKey);
        setData(result);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!shouldFetch) return; // We have valid data and no need to refetch

    // Only set loading to true if we don't have ANY data yet.
    // If we have stale data, we keep loading = false (or we could expose an isValidating boolean).
    if (!globalCache.has(queryKey)) {
      setLoading(true);
    }
    
    // Clear stale flag now that we are fetching
    globalStale.delete(queryKey);

    const promise = queryFn();
    globalPromises.set(queryKey, promise);

    try {
      const result = await promise;
      globalCache.set(queryKey, result);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      globalPromises.delete(queryKey);
      setLoading(false);
    }
  }, [queryKey, queryFn]);

  useEffect(() => {
    fetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryKey]);

  return { 
    data, 
    loading, 
    error,
    refetch: () => fetch(true),
    mutate: (newData: T) => {
      globalCache.set(queryKey, newData);
      globalStale.delete(queryKey);
      setData(newData);
    }
  };
}
