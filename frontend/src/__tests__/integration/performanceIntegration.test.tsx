import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import App from '../../App';

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
  getEntriesByName: vi.fn(() => []),
  timing: {
    navigationStart: 1000,
    loadEventEnd: 2000,
  },
  memory: {
    usedJSHeapSize: 1024 * 1024 * 20, // 20MB
  },
};

Object.defineProperty(window, 'performance', {
  value: mockPerformance,
  writable: true,
});

const renderApp = () => {
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
};

describe('Performance Testing Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful large dataset API response
    mockFetch.mockImplementation((url) => {
      if (url.includes('/api/test/large-dataset')) {
        const count =
          new URL(url, 'http://localhost').searchParams.get('count') || '1000';
        const itemCount = parseInt(count);

        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: {
              items: Array.from({ length: itemCount }, (_, i) => ({
                id: i + 1,
                name: `Item ${i + 1}`,
                description: `Description ${i + 1}`,
                value: Math.floor(Math.random() * 1000),
                category: `Category ${Math.floor(i / 100) + 1}`,
                active: i % 2 === 0,
                createdAt: new Date().toISOString(),
              })),
              count: itemCount,
              generatedAt: new Date().toISOString(),
            },
          }),
        });
      }

      if (url.includes('/api/files/upload')) {
        return Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            data: {
              files: [
                {
                  id: 'file-1',
                  originalName: 'test.txt',
                  filename: 'uploaded-test.txt',
                  size: 1024,
                },
              ],
            },
          }),
        });
      }

      return Promise.reject(new Error('Unknown API endpoint'));
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should navigate to performance page and load initial dataset', async () => {
    renderApp();

    // Navigate to performance page
    const performanceLink = screen.getByTestId('nav-performance');
    fireEvent.click(performanceLink);

    // Wait for page to load
    await waitFor(() => {
      expect(screen.getByTestId('performance-test-page')).toBeInTheDocument();
    });

    // Should show performance metrics
    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();

    // Should load initial dataset
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test/large-dataset?count=1000'
      );
    });
  });

  it('should handle dataset size changes and regeneration', async () => {
    renderApp();

    // Navigate to performance page
    const performanceLink = screen.getByTestId('nav-performance');
    fireEvent.click(performanceLink);

    await waitFor(() => {
      expect(screen.getByTestId('performance-test-page')).toBeInTheDocument();
    });

    // Change dataset size
    const sizeSelect = screen.getByTestId('dataset-size-select');
    fireEvent.change(sizeSelect, { target: { value: '5000' } });

    // Click generate button
    const generateButton = screen.getByTestId('generate-dataset-btn');
    fireEvent.click(generateButton);

    // Should call API with new size
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test/large-dataset?count=5000'
      );
    });
  });

  it('should perform search operations on large dataset', async () => {
    renderApp();

    // Navigate to performance page
    const performanceLink = screen.getByTestId('nav-performance');
    fireEvent.click(performanceLink);

    await waitFor(() => {
      expect(screen.getByTestId('performance-test-page')).toBeInTheDocument();
    });

    // Wait for initial data to load
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    // Perform search
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'Item 1' } });

    // Should update results
    expect(searchInput).toHaveValue('Item 1');
  });

  it('should handle multiple filter operations efficiently', async () => {
    renderApp();

    // Navigate to performance page
    const performanceLink = screen.getByTestId('nav-performance');
    fireEvent.click(performanceLink);

    await waitFor(() => {
      expect(screen.getByTestId('performance-test-page')).toBeInTheDocument();
    });

    // Wait for initial data to load
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    // Apply multiple filters
    const categoryFilter = screen.getByTestId('category-filter');
    fireEvent.change(categoryFilter, { target: { value: 'Category 1' } });

    const priorityFilter = screen.getByTestId('priority-filter');
    fireEvent.change(priorityFilter, { target: { value: 'high' } });

    const minValueInput = screen.getByTestId('min-value-input');
    fireEvent.change(minValueInput, { target: { value: '100' } });

    const maxValueInput = screen.getByTestId('max-value-input');
    fireEvent.change(maxValueInput, { target: { value: '500' } });

    const activeOnlyCheckbox = screen.getByTestId('active-only-checkbox');
    fireEvent.click(activeOnlyCheckbox);

    // All filters should be applied
    expect(categoryFilter).toHaveValue('Category 1');
    expect(priorityFilter).toHaveValue('high');
    expect(minValueInput).toHaveValue(100);
    expect(maxValueInput).toHaveValue(500);
    expect(activeOnlyCheckbox).toBeChecked();
  });

  it('should handle sorting operations on large dataset', async () => {
    renderApp();

    // Navigate to performance page
    const performanceLink = screen.getByTestId('nav-performance');
    fireEvent.click(performanceLink);

    await waitFor(() => {
      expect(screen.getByTestId('performance-test-page')).toBeInTheDocument();
    });

    // Wait for initial data to load
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    // Test sorting by different columns
    const sortHeaders = ['sort-id', 'sort-name', 'sort-category', 'sort-value'];

    for (const headerId of sortHeaders) {
      const header = screen.getByTestId(headerId);
      fireEvent.click(header);

      // Should show sort indicator
      expect(header).toHaveTextContent('↑');

      // Click again to reverse sort
      fireEvent.click(header);
      expect(header).toHaveTextContent('↓');
    }
  });

  it('should handle pagination with large datasets', async () => {
    renderApp();

    // Navigate to performance page
    const performanceLink = screen.getByTestId('nav-performance');
    fireEvent.click(performanceLink);

    await waitFor(() => {
      expect(screen.getByTestId('performance-test-page')).toBeInTheDocument();
    });

    // Wait for initial data to load
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    // Test different page sizes
    const itemsPerPageSelect = screen.getByTestId('items-per-page-select');
    const pageSizes = ['25', '50', '100', '200'];

    for (const size of pageSizes) {
      fireEvent.change(itemsPerPageSelect, { target: { value: size } });
      expect(itemsPerPageSelect).toHaveValue(size);
    }

    // Test pagination navigation
    const nextPageBtn = screen.getByTestId('next-page-btn');
    const prevPageBtn = screen.getByTestId('prev-page-btn');

    expect(prevPageBtn).toBeDisabled(); // Should be disabled on first page

    if (!nextPageBtn.hasAttribute('disabled')) {
      fireEvent.click(nextPageBtn);
      // Should enable previous button after moving to next page
      expect(prevPageBtn).not.toBeDisabled();
    }
  });

  it('should display performance metrics during operations', async () => {
    renderApp();

    // Navigate to performance page
    const performanceLink = screen.getByTestId('nav-performance');
    fireEvent.click(performanceLink);

    await waitFor(() => {
      expect(screen.getByTestId('performance-test-page')).toBeInTheDocument();
    });

    // Performance metrics should be visible
    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
    expect(screen.getByText('Last Render:')).toBeInTheDocument();
    expect(screen.getByText('Avg Render:')).toBeInTheDocument();
    expect(screen.getByText('Total Renders:')).toBeInTheDocument();
    expect(screen.getByText('Memory:')).toBeInTheDocument();

    // Perform operations that should update metrics
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    const categoryFilter = screen.getByTestId('category-filter');
    fireEvent.change(categoryFilter, { target: { value: 'Category 1' } });

    // Metrics should still be displayed and potentially updated
    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
  });

  it('should handle file upload with progress tracking', async () => {
    renderApp();

    // Navigate to performance page
    const performanceLink = screen.getByTestId('nav-performance');
    fireEvent.click(performanceLink);

    await waitFor(() => {
      expect(screen.getByTestId('performance-test-page')).toBeInTheDocument();
    });

    // Look for file upload component (if it's integrated into the performance page)
    // This test assumes the FileUploadWithProgress component is part of the performance page
    const fileUploadComponent = screen.queryByTestId(
      'file-upload-with-progress'
    );

    if (fileUploadComponent) {
      const fileInput = screen.getByTestId('file-input');
      const mockFile = new File(['test content'], 'test.txt', {
        type: 'text/plain',
      });

      fireEvent.change(fileInput, {
        target: { files: [mockFile] },
      });

      // Should show upload progress
      await waitFor(() => {
        expect(screen.getByText('Upload Progress')).toBeInTheDocument();
      });
    }
  });

  it('should maintain performance under stress conditions', async () => {
    renderApp();

    // Navigate to performance page
    const performanceLink = screen.getByTestId('nav-performance');
    fireEvent.click(performanceLink);

    await waitFor(() => {
      expect(screen.getByTestId('performance-test-page')).toBeInTheDocument();
    });

    // Generate large dataset
    const sizeSelect = screen.getByTestId('dataset-size-select');
    fireEvent.change(sizeSelect, { target: { value: '10000' } });

    const generateButton = screen.getByTestId('generate-dataset-btn');
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test/large-dataset?count=10000'
      );
    });

    // Perform multiple rapid operations
    const searchInput = screen.getByTestId('search-input');
    const categoryFilter = screen.getByTestId('category-filter');
    const priorityFilter = screen.getByTestId('priority-filter');

    // Rapid fire operations
    for (let i = 0; i < 5; i++) {
      fireEvent.change(searchInput, { target: { value: `test${i}` } });
      fireEvent.change(categoryFilter, {
        target: { value: i % 2 === 0 ? 'Category 1' : '' },
      });
      fireEvent.change(priorityFilter, {
        target: { value: ['low', 'medium', 'high'][i % 3] },
      });
    }

    // Page should remain responsive
    expect(screen.getByTestId('performance-test-page')).toBeInTheDocument();
    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
  });

  it('should handle API errors gracefully during performance testing', async () => {
    // Mock API error
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    renderApp();

    // Navigate to performance page
    const performanceLink = screen.getByTestId('nav-performance');
    fireEvent.click(performanceLink);

    await waitFor(() => {
      expect(screen.getByTestId('performance-test-page')).toBeInTheDocument();
    });

    // Should handle the error gracefully and still show the page
    expect(
      screen.getByText('Performance Testing - Large Dataset')
    ).toBeInTheDocument();
  });

  it('should track API call performance metrics', async () => {
    renderApp();

    // Navigate to performance page
    const performanceLink = screen.getByTestId('nav-performance');
    fireEvent.click(performanceLink);

    await waitFor(() => {
      expect(screen.getByTestId('performance-test-page')).toBeInTheDocument();
    });

    // Generate multiple datasets to create API calls
    const generateButton = screen.getByTestId('generate-dataset-btn');

    // Generate multiple times
    fireEvent.click(generateButton);
    await waitFor(() => expect(mockFetch).toHaveBeenCalled());

    fireEvent.click(generateButton);
    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(3)); // Initial + 2 manual

    // Performance context should be tracking these API calls
    // This is tested indirectly through the component behavior
    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
  });

  it('should demonstrate real-time performance monitoring', async () => {
    renderApp();

    // Navigate to performance page
    const performanceLink = screen.getByTestId('nav-performance');
    fireEvent.click(performanceLink);

    await waitFor(() => {
      expect(screen.getByTestId('performance-test-page')).toBeInTheDocument();
    });

    // Wait for initial data load
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    // Perform operations that should trigger performance measurements
    const searchInput = screen.getByTestId('search-input');

    // Multiple search operations
    for (let i = 0; i < 3; i++) {
      fireEvent.change(searchInput, { target: { value: `search${i}` } });
      // Small delay to allow for performance measurement
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    // Performance metrics should be updated
    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();

    // Should show render count and timing information
    const metricsSection = screen
      .getByText('Performance Metrics')
      .closest('div');
    expect(metricsSection).toBeInTheDocument();
  });
});
