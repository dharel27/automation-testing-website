import React from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum number of entries
  staleWhileRevalidate?: boolean; // Return stale data while fetching fresh data
}

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  private maxSize = 100;
  private pendingRequests = new Map<string, Promise<any>>();

  constructor(options: CacheOptions = {}) {
    this.defaultTTL = options.ttl || this.defaultTTL;
    this.maxSize = options.maxSize || this.maxSize;
  }

  /**
   * Generate cache key from URL and options
   */
  private generateKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET';
    const body = options?.body ? JSON.stringify(options.body) : '';
    return `${method}:${url}:${body}`;
  }

  /**
   * Check if cache entry is valid
   */
  private isValid(entry: CacheEntry<any>): boolean {
    return Date.now() < entry.expiresAt;
  }

  /**
   * Check if cache entry is stale but not expired
   */
  private isStale(entry: CacheEntry<any>): boolean {
    const now = Date.now();
    const staleTime = entry.timestamp + this.defaultTTL * 0.8; // 80% of TTL
    return now > staleTime && now < entry.expiresAt;
  }

  /**
   * Evict oldest entries when cache is full
   */
  private evictOldest(): void {
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (this.isValid(entry)) {
      return entry.data;
    }

    // Remove expired entry
    this.cache.delete(key);
    return null;
  }

  /**
   * Set data in cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    this.evictOldest();

    const now = Date.now();
    const expiresAt = now + (ttl || this.defaultTTL);

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt,
    });
  }

  /**
   * Delete entry from cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      pendingRequests: this.pendingRequests.size,
    };
  }

  /**
   * Cached fetch with deduplication
   */
  async fetch<T>(
    url: string,
    options: RequestInit & { ttl?: number; forceRefresh?: boolean } = {}
  ): Promise<T> {
    const { ttl, forceRefresh, ...fetchOptions } = options;
    const key = this.generateKey(url, fetchOptions);

    // Return cached data if available and not forcing refresh
    if (!forceRefresh) {
      const cached = this.get<T>(key);
      if (cached) return cached;
    }

    // Deduplicate concurrent requests
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    // Make the request
    const requestPromise = fetch(url, fetchOptions)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        // Cache the result
        this.set(key, data, ttl);
        this.pendingRequests.delete(key);
        return data;
      })
      .catch((error) => {
        this.pendingRequests.delete(key);
        throw error;
      });

    this.pendingRequests.set(key, requestPromise);
    return requestPromise;
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidatePattern(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Preload data into cache
   */
  async preload<T>(
    url: string,
    options?: RequestInit & { ttl?: number }
  ): Promise<void> {
    try {
      await this.fetch<T>(url, options);
    } catch (error) {
      console.warn('Failed to preload cache entry:', error);
    }
  }
}

// Create singleton instance
export const apiCache = new ApiCache({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100,
});

// Cache-aware fetch hook
export function useCachedFetch<T>(
  url: string | null,
  options: RequestInit & { ttl?: number; enabled?: boolean } = {}
) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const { enabled = true, ...fetchOptions } = options;

  React.useEffect(() => {
    if (!url || !enabled) return;

    setLoading(true);
    setError(null);

    apiCache
      .fetch<T>(url, fetchOptions)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [url, enabled, JSON.stringify(fetchOptions)]);

  const refetch = React.useCallback(() => {
    if (!url) return;

    setLoading(true);
    setError(null);

    apiCache
      .fetch<T>(url, { ...fetchOptions, forceRefresh: true })
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [url, fetchOptions]);

  return { data, loading, error, refetch };
}

export default apiCache;
