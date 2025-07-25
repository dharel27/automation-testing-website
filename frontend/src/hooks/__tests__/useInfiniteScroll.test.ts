import { renderHook, act, waitFor } from '@testing-library/react';
import { useInfiniteScroll } from '../useInfiniteScroll';

// Mock data for testing
const mockData = Array.from({ length: 100 }, (_, i) => ({
  id: `item-${i + 1}`,
  name: `Item ${i + 1}`,
  value: i + 1,
}));

describe('useInfiniteScroll', () => {
  const mockFetchData = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with empty data and loading state', () => {
    mockFetchData.mockResolvedValue({
      data: [],
      hasMore: false,
      total: 0,
    });

    const { result } = renderHook(() =>
      useInfiniteScroll({
        fetchData: mockFetchData,
        limit: 10,
      })
    );

    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBe(null);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.page).toBe(1);
    expect(result.current.total).toBe(0);
  });

  it('should load initial data on mount', async () => {
    const initialData = mockData.slice(0, 10);
    mockFetchData.mockResolvedValue({
      data: initialData,
      hasMore: true,
      total: 100,
    });

    const { result } = renderHook(() =>
      useInfiniteScroll({
        fetchData: mockFetchData,
        limit: 10,
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockFetchData).toHaveBeenCalledWith(1, 10);
    expect(result.current.data).toEqual(initialData);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.total).toBe(100);
    expect(result.current.page).toBe(1);
  });

  it('should load more data when loadMore is called', async () => {
    const firstPageData = mockData.slice(0, 10);
    const secondPageData = mockData.slice(10, 20);

    mockFetchData
      .mockResolvedValueOnce({
        data: firstPageData,
        hasMore: true,
        total: 100,
      })
      .mockResolvedValueOnce({
        data: secondPageData,
        hasMore: true,
        total: 100,
      });

    const { result } = renderHook(() =>
      useInfiniteScroll({
        fetchData: mockFetchData,
        limit: 10,
      })
    );

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Load more data
    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockFetchData).toHaveBeenCalledTimes(2);
    expect(mockFetchData).toHaveBeenNthCalledWith(2, 2, 10);
    expect(result.current.data).toEqual([...firstPageData, ...secondPageData]);
    expect(result.current.page).toBe(2);
  });

  it('should handle errors correctly', async () => {
    const errorMessage = 'Failed to fetch data';
    mockFetchData.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() =>
      useInfiniteScroll({
        fetchData: mockFetchData,
        limit: 10,
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.data).toEqual([]);
  });

  it('should not load more when already loading', async () => {
    mockFetchData.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                data: mockData.slice(0, 10),
                hasMore: true,
                total: 100,
              }),
            100
          )
        )
    );

    const { result } = renderHook(() =>
      useInfiniteScroll({
        fetchData: mockFetchData,
        limit: 10,
      })
    );

    // Try to load more while initial load is in progress
    act(() => {
      result.current.loadMore();
      result.current.loadMore(); // Second call should be ignored
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Should only be called once for initial load
    expect(mockFetchData).toHaveBeenCalledTimes(1);
  });

  it('should not load more when hasMore is false', async () => {
    mockFetchData.mockResolvedValue({
      data: mockData.slice(0, 10),
      hasMore: false,
      total: 10,
    });

    const { result } = renderHook(() =>
      useInfiniteScroll({
        fetchData: mockFetchData,
        limit: 10,
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Try to load more when hasMore is false
    act(() => {
      result.current.loadMore();
    });

    // Should not make additional API calls
    expect(mockFetchData).toHaveBeenCalledTimes(1);
  });

  it('should refresh data correctly', async () => {
    const initialData = mockData.slice(0, 10);
    const refreshedData = mockData.slice(5, 15); // Different data

    mockFetchData
      .mockResolvedValueOnce({
        data: initialData,
        hasMore: true,
        total: 100,
      })
      .mockResolvedValueOnce({
        data: refreshedData,
        hasMore: true,
        total: 100,
      });

    const { result } = renderHook(() =>
      useInfiniteScroll({
        fetchData: mockFetchData,
        limit: 10,
      })
    );

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(initialData);

    // Refresh data
    act(() => {
      result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockFetchData).toHaveBeenCalledTimes(2);
    expect(mockFetchData).toHaveBeenNthCalledWith(2, 1, 10); // Should reset to page 1
    expect(result.current.data).toEqual(refreshedData);
    expect(result.current.page).toBe(1);
  });

  it('should use custom initial page and limit', async () => {
    mockFetchData.mockResolvedValue({
      data: mockData.slice(20, 25),
      hasMore: true,
      total: 100,
    });

    const { result } = renderHook(() =>
      useInfiniteScroll({
        fetchData: mockFetchData,
        limit: 5,
        initialPage: 3,
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockFetchData).toHaveBeenCalledWith(3, 5);
    expect(result.current.page).toBe(3);
  });

  it('should handle string errors correctly', async () => {
    mockFetchData.mockRejectedValue('String error message');

    const { result } = renderHook(() =>
      useInfiniteScroll({
        fetchData: mockFetchData,
        limit: 10,
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('An error occurred');
  });

  it('should prevent concurrent loading operations', async () => {
    let resolveFirst: (value: any) => void;
    let resolveSecond: (value: any) => void;

    const firstPromise = new Promise((resolve) => {
      resolveFirst = resolve;
    });
    const secondPromise = new Promise((resolve) => {
      resolveSecond = resolve;
    });

    mockFetchData
      .mockReturnValueOnce(firstPromise)
      .mockReturnValueOnce(secondPromise);

    const { result } = renderHook(() =>
      useInfiniteScroll({
        fetchData: mockFetchData,
        limit: 10,
      })
    );

    // Start second load while first is still pending
    act(() => {
      result.current.loadMore();
    });

    // Resolve first promise
    act(() => {
      resolveFirst!({
        data: mockData.slice(0, 10),
        hasMore: true,
        total: 100,
      });
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Second call should have been ignored
    expect(mockFetchData).toHaveBeenCalledTimes(1);
  });
});
