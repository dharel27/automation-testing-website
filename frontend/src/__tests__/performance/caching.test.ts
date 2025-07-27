import { describe, it, expect, beforeEach, vi } from 'vitest';
import { apiCache } from '../../utils/apiCache';

// Mock fetch
global.fetch = vi.fn();

describe('API Caching Performance Tests', () => {
  beforeEach(() => {
    apiCache.clear();
    vi.clearAllMocks();
  });

  it('should cache API responses', async () => {
    const mockResponse = { data: 'test' };
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    // First request should hit the network
    const result1 = await apiCache.fetch('/api/test');
    expect(result1).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledTimes(1);

    // Second request should use cache
    const result2 = await apiCache.fetch('/api/test');
    expect(result2).toEqual(mockResponse);
    expect(fetch).toHaveBeenCalledTimes(1); // Still only 1 call
  });

  it('should respect TTL for cache entries', async () => {
    const mockResponse = { data: 'test' };
    (fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    // Cache with very short TTL
    await apiCache.fetch('/api/test', { ttl: 1 });

    // Wait for TTL to expire
    await new Promise((resolve) => setTimeout(resolve, 2));

    // Should make new request after TTL expires
    await apiCache.fetch('/api/test');
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it('should deduplicate concurrent requests', async () => {
    const mockResponse = { data: 'test' };
    (fetch as any).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: () => Promise.resolve(mockResponse),
              }),
            100
          )
        )
    );

    // Make multiple concurrent requests
    const promises = [
      apiCache.fetch('/api/test'),
      apiCache.fetch('/api/test'),
      apiCache.fetch('/api/test'),
    ];

    const results = await Promise.all(promises);

    // All should return the same result
    results.forEach((result) => {
      expect(result).toEqual(mockResponse);
    });

    // But only one network request should be made
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('should handle cache size limits', () => {
    const cache = new (apiCache.constructor as any)({ maxSize: 2 });

    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3'); // Should evict key1

    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBe('value2');
    expect(cache.get('key3')).toBe('value3');
  });

  it('should invalidate cache by pattern', () => {
    apiCache.set('GET:/api/users::', { users: [] });
    apiCache.set('GET:/api/products::', { products: [] });
    apiCache.set('GET:/api/orders::', { orders: [] });

    // Invalidate all user-related cache entries
    apiCache.invalidatePattern(/\/api\/users/);

    expect(apiCache.get('GET:/api/users::')).toBeNull();
    expect(apiCache.get('GET:/api/products::')).toEqual({ products: [] });
    expect(apiCache.get('GET:/api/orders::')).toEqual({ orders: [] });
  });

  it('should provide cache statistics', () => {
    apiCache.set('key1', 'value1');
    apiCache.set('key2', 'value2');

    const stats = apiCache.getStats();

    expect(stats.size).toBe(2);
    expect(stats.maxSize).toBeGreaterThan(0);
    expect(stats.pendingRequests).toBe(0);
  });

  it('should handle network errors gracefully', async () => {
    (fetch as any).mockRejectedValue(new Error('Network error'));

    await expect(apiCache.fetch('/api/test')).rejects.toThrow('Network error');
  });

  it('should handle HTTP error responses', async () => {
    (fetch as any).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    await expect(apiCache.fetch('/api/test')).rejects.toThrow(
      'HTTP 404: Not Found'
    );
  });
});
