import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions<T> {
  fetchMore: (page: number, pageSize: number) => Promise<{
    data: T[];
    hasMore: boolean;
    total?: number;
  }>;
  pageSize?: number;
  threshold?: number;
  enabled?: boolean;
}

interface UseInfiniteScrollReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  reset: () => void;
  total: number;
  page: number;
}

export function useInfiniteScroll<T>({
  fetchMore,
  pageSize = 20,
  threshold = 100,
  enabled = true,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  
  const loadingRef = useRef(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore || !enabled) return;

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const result = await fetchMore(page, pageSize);
      
      setData(prevData => [...prevData, ...result.data]);
      setHasMore(result.hasMore);
      setPage(prevPage => prevPage + 1);
      
      if (result.total !== undefined) {
        setTotal(result.total);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more data');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [fetchMore, page, pageSize, hasMore, enabled]);

  const reset = useCallback(() => {
    setData([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    setTotal(0);
    loadingRef.current = false;
  }, []);

  // Set up intersection observer
  useEffect(() => {
    if (!enabled) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      {
        rootMargin: `${threshold}px`,
      }
    );

    observerRef.current = observer;

    return () => {
      observer.disconnect();
    };
  }, [loadMore, hasMore, loading, threshold, enabled]);

  // Observe sentinel element
  useEffect(() => {
    const observer = observerRef.current;
    const sentinel = sentinelRef.current;

    if (observer && sentinel) {
      observer.observe(sentinel);
    }

    return () => {
      if (observer && sentinel) {
        observer.unobserve(sentinel);
      }
    };
  }, []);

  // Load initial data
  useEffect(() => {
    if (enabled && data.length === 0 && !loadingRef.current) {
      loadMore();
    }
  }, [enabled, data.length, loadMore]);

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    reset,
    total,
    page,
  };
}

// Hook for creating a sentinel element ref
export function useInfiniteScrollSentinel() {
  const sentinelRef = useRef<HTMLDivElement>(null);
  
  const SentinelComponent = useCallback((): JSX.Element => (
    <div
      ref={sentinelRef}
      className="h-4 w-full"
      data-testid="infinite-scroll-sentinel"
      aria-hidden="true"
    />
  ), []);

  return { sentinelRef, SentinelComponent };
}