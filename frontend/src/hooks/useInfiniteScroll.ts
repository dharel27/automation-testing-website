import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions<T> {
  fetchData: (
    page: number,
    limit: number
  ) => Promise<{
    data: T[];
    hasMore: boolean;
    total: number;
  }>;
  limit?: number;
  initialPage?: number;
}

interface UseInfiniteScrollReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  total: number;
  page: number;
}

export function useInfiniteScroll<T>({
  fetchData,
  limit = 20,
  initialPage = 1,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(initialPage);
  const [total, setTotal] = useState(0);
  const loadingRef = useRef(false);

  const loadData = useCallback(
    async (pageNum: number, reset = false) => {
      if (loadingRef.current) return;

      loadingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const result = await fetchData(pageNum, limit);

        setData((prevData) =>
          reset ? result.data : [...prevData, ...result.data]
        );
        setHasMore(result.hasMore);
        setTotal(result.total);

        if (!reset) {
          setPage(pageNum);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [fetchData, limit]
  );

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadData(page + 1);
    }
  }, [loading, hasMore, page, loadData]);

  const refresh = useCallback(() => {
    setData([]);
    setPage(initialPage);
    setHasMore(true);
    setTotal(0);
    loadData(initialPage, true);
  }, [initialPage, loadData]);

  // Initial load
  useEffect(() => {
    loadData(initialPage, true);
  }, [loadData, initialPage]);

  return {
    data,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    total,
    page,
  };
}

// Hook for intersection observer to trigger infinite scroll
export function useIntersectionObserver(
  callback: () => void,
  options: IntersectionObserverInit = {}
) {
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callback();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
        ...options,
      }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [callback, options]);

  return targetRef;
}
