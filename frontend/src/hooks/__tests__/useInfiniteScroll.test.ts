import { renderHook, act, waitFor } from '@testing-library/react';
import { useInfiniteScroll } from '../useInfiniteScroll';

// Mock IntersectionObserver
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
});
window.IntersectionObserver = mockIntersectionObserver;

interface TestItem {
  id: string;
  name: string;
}

describe('useInfiniteScroll', () => {
  const mockFetchMore = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockIntersectionObserver.mockClear();
  });

  it('should initialize with empty data and loading state', () => {
    const { result } = renderHook(() =>
      useInfiniteScroll({
        fetchMore: mockFetchMore,
        enabled: false, // Disable to prevent initial load
      })
    );

    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.page).toBe(1);
    expect(result.current.total).toBe(0);
  });

  it('should load initial data when enabled', async () => {
    const mockData: TestItem[] = [
      { id: '1', name: 'Item 1' },
      { id: '2', name: 'Item 2' },
    ];

    mockFetchMore.mockResolvedValueOnce({
      data: mockData,
      hasMore: true,
      total: 10,
    });

    const { result } = renderHook(() =>
      useInfiniteScroll({
        fetchMore: mockFetchMore,
        pageSize: 2,
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.total).toBe(10);
    expect(result.current.page).toBe(2);
    expect(mockFetchMore).toHaveBeenCalledWith(1, 2);
  });

  it('should load more data when loadMore is called', async () => {
    const initialData: TestItem[] = [
      { id: '1', name: 'Item 1' },
      { id: '2', name: 'Item 2' },
    ];

    const moreData: TestItem[] = [
      { id: '3', name: 'Item 3' },
      { id: '4', name: 'Item 4' },
    ];

    mockFetchMore
      .mockResolvedValueOnce({
        data: initialData,
        hasMore: true,
        total: 10,
      })
      .mockResolvedValueOnce({
        data: moreData,
        hasMore: true,
        total: 10,
      });

    const { result } = renderHook(() =>
      useInfiniteScroll({
        fetchMore: mockFetchMore,
        pageSize: 2,
      })
    );

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Load more data
    await act(async () => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual([...initialData, ...moreData]);
    expect(result.current.page).toBe(3);
    expect(mockFetchMore).toHaveBeenCalledTimes(2);
    expect(mockFetchMore).toHaveBeenNthCalledWith(2, 2, 2);
  });

  it('should handle errors correctly', async () => {
    const errorMessage = 'Failed to fetch data';
    mockFetchMore.mockRejectedValueOnce(new Error(errorMessage));

    const { result } = renderHook(() =>
      useInfiniteScroll({
        fetchMore: mockFetchMore,
        pageSize: 2,
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.data).toEqual([]);
  });

  it('should reset data and state when reset is called', async () => {
    const mockData: TestItem[] = [
      { id: '1', name: 'Item 1' },
      { id: '2', name: 'Item 2' },
    ];

    mockFetchMore.mockResolvedValue({
      data: mockData,
      hasMore: true,
      total: 10,
    });

    const { result } = renderHook(() =>
      useInfiniteScroll({
        fetchMore: mockFetchMore,
        pageSize: 2,
      })
    );

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);

    // Reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.page).toBe(1);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.error).toBe(null);
    expect(result.current.total).toBe(0);
  });

  it('should not load more when hasMore is false', async () => {
    const mockData: TestItem[] = [
      { id: '1', name: 'Item 1' },
      { id: '2', name: 'Item 2' },
    ];

    mockFetchMore.mockResolvedValueOnce({
      data: mockData,
      hasMore: false,
      total: 2,
    });

    const { result } = renderHook(() =>
      useInfiniteScroll({
        fetchMore: mockFetchMore,
        pageSize: 2,
      })
    );

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.hasMore).toBe(false);

    // Try to load more
    await act(async () => {
      result.current.loadMore();
    });

    // Should not make another request
    expect(mockFetchMore).toHaveBeenCalledTimes(1);
  });

  it('should not load more when already loading', async () => {
    const mockData: TestItem[] = [
      { id: '1', name: 'Item 1' },
      { id: '2', name: 'Item 2' },
    ];

    // Make the first call slow
    mockFetchMore.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                data: mockData,
                hasMore: true,
                total: 10,
              }),
            100
          )
        )
    );

    const { result } = renderHook(() =>
      useInfiniteScroll({
        fetchMore: mockFetchMore,
        pageSize: 2,
      })
    );

    // Wait a bit for loading to start
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(result.current.loading).toBe(true);

    // Try to load more while already loading
    await act(async () => {
      result.current.loadMore();
    });

    // Should not make another request
    expect(mockFetchMore).toHaveBeenCalledTimes(1);
  });

  it('should not load when disabled', async () => {
    const { result } = renderHook(() =>
      useInfiniteScroll({
        fetchMore: mockFetchMore,
        enabled: false,
      })
    );

    // Wait a bit
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
    });

    expect(mockFetchMore).not.toHaveBeenCalled();
    expect(result.current.data).toEqual([]);
  });

  it('should use custom pageSize and threshold', async () => {
    const mockData: TestItem[] = [{ id: '1', name: 'Item 1' }];

    mockFetchMore.mockResolvedValueOnce({
      data: mockData,
      hasMore: true,
      total: 10,
    });

    const { result } = renderHook(() =>
      useInfiniteScroll({
        fetchMore: mockFetchMore,
        pageSize: 1,
        threshold: 50,
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockFetchMore).toHaveBeenCalledWith(1, 1);
  });

  it('should setup IntersectionObserver correctly', () => {
    renderHook(() =>
      useInfiniteScroll({
        fetchMore: mockFetchMore,
        threshold: 100,
      })
    );

    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      { rootMargin: '100px' }
    );
  });

  it('should handle string errors correctly', async () => {
    mockFetchMore.mockRejectedValueOnce('String error');

    const { result } = renderHook(() =>
      useInfiniteScroll({
        fetchMore: mockFetchMore,
      })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Failed to load more data');
  });

  it('should clear error on successful load', async () => {
    const mockData: TestItem[] = [{ id: '1', name: 'Item 1' }];

    // First call fails
    mockFetchMore
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        data: mockData,
        hasMore: false,
        total: 1,
      });

    const { result } = renderHook(() =>
      useInfiniteScroll({
        fetchMore: mockFetchMore,
      })
    );

    // Wait for initial error
    await waitFor(() => {
      expect(result.current.error).toBe('Network error');
    });

    // Try again
    await act(async () => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe(null);
    expect(result.current.data).toEqual(mockData);
  });
});
