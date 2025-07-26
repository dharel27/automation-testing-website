import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import PerformanceTestPage from '../PerformanceTestPage';
import { PerformanceProvider } from '../../contexts/PerformanceContext';

// Mock the performance monitoring hooks
vi.mock('../../hooks/usePerformanceMonitor', () => ({
  usePerformanceMonitor: () => ({
    metrics: {
      renderTime: 12.5,
      averageRenderTime: 15.2,
      totalRenders: 5,
      memoryUsage: 1024 * 1024 * 50, // 50MB
    },
    startMeasurement: vi.fn(),
    endMeasurement: vi.fn(),
  }),
  useAsyncPerformanceMonitor: () => ({
    measureAsync: vi.fn().mockImplementation(async (name, fn) => await fn()),
  }),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <PerformanceProvider>{component}</PerformanceProvider>
    </BrowserRouter>
  );
};

describe('PerformanceTestPage', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    // Mock successful API response
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          items: Array.from({ length: 100 }, (_, i) => ({
            id: i + 1,
            name: `Item ${i + 1}`,
            description: `Description ${i + 1}`,
            value: Math.floor(Math.random() * 1000),
            category: `Category ${Math.floor(i / 10) + 1}`,
            active: i % 2 === 0,
            createdAt: new Date().toISOString(),
          })),
          count: 100,
          generatedAt: new Date().toISOString(),
        },
      }),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders performance test page with initial elements', async () => {
    renderWithProviders(<PerformanceTestPage />);

    expect(screen.getByTestId('performance-test-page')).toBeInTheDocument();
    expect(
      screen.getByText('Performance Testing - Large Dataset')
    ).toBeInTheDocument();
    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
    expect(screen.getByText('Search & Filters')).toBeInTheDocument();

    // Wait for initial dataset to load
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test/large-dataset?count=1000'
      );
    });
  });

  it('displays performance metrics correctly', async () => {
    renderWithProviders(<PerformanceTestPage />);

    await waitFor(() => {
      expect(screen.getByText('12.50ms')).toBeInTheDocument(); // Last render time
      expect(screen.getByText('15.20ms')).toBeInTheDocument(); // Average render time
      expect(screen.getByText('5')).toBeInTheDocument(); // Total renders
      expect(screen.getByText('50.0MB')).toBeInTheDocument(); // Memory usage
    });
  });

  it('allows changing dataset size and regenerating data', async () => {
    renderWithProviders(<PerformanceTestPage />);

    const sizeSelect = screen.getByTestId('dataset-size-select');
    const generateButton = screen.getByTestId('generate-dataset-btn');

    // Change dataset size
    fireEvent.change(sizeSelect, { target: { value: '500' } });
    expect(sizeSelect).toHaveValue('500');

    // Click generate button
    fireEvent.click(generateButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/test/large-dataset?count=500'
      );
    });
  });

  it('handles search functionality', async () => {
    renderWithProviders(<PerformanceTestPage />);

    // Wait for initial data to load
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'Item 1' } });

    expect(searchInput).toHaveValue('Item 1');
  });

  it('handles category filtering', async () => {
    renderWithProviders(<PerformanceTestPage />);

    // Wait for initial data to load
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const categoryFilter = screen.getByTestId('category-filter');
    fireEvent.change(categoryFilter, { target: { value: 'Category 1' } });

    expect(categoryFilter).toHaveValue('Category 1');
  });

  it('handles priority filtering', async () => {
    renderWithProviders(<PerformanceTestPage />);

    // Wait for initial data to load
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const priorityFilter = screen.getByTestId('priority-filter');
    fireEvent.change(priorityFilter, { target: { value: 'high' } });

    expect(priorityFilter).toHaveValue('high');
  });

  it('handles value range filtering', async () => {
    renderWithProviders(<PerformanceTestPage />);

    // Wait for initial data to load
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const minValueInput = screen.getByTestId('min-value-input');
    const maxValueInput = screen.getByTestId('max-value-input');

    fireEvent.change(minValueInput, { target: { value: '100' } });
    fireEvent.change(maxValueInput, { target: { value: '500' } });

    expect(minValueInput).toHaveValue(100);
    expect(maxValueInput).toHaveValue(500);
  });

  it('handles active-only checkbox filtering', async () => {
    renderWithProviders(<PerformanceTestPage />);

    // Wait for initial data to load
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const activeOnlyCheckbox = screen.getByTestId('active-only-checkbox');
    fireEvent.click(activeOnlyCheckbox);

    expect(activeOnlyCheckbox).toBeChecked();
  });

  it('handles pagination controls', async () => {
    renderWithProviders(<PerformanceTestPage />);

    // Wait for initial data to load
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const itemsPerPageSelect = screen.getByTestId('items-per-page-select');
    fireEvent.change(itemsPerPageSelect, { target: { value: '100' } });

    expect(itemsPerPageSelect).toHaveValue('100');

    const nextPageBtn = screen.getByTestId('next-page-btn');
    const prevPageBtn = screen.getByTestId('prev-page-btn');

    expect(prevPageBtn).toBeDisabled(); // Should be disabled on first page
    expect(nextPageBtn).toBeInTheDocument();
  });

  it('handles table sorting', async () => {
    renderWithProviders(<PerformanceTestPage />);

    // Wait for initial data to load
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const sortIdHeader = screen.getByTestId('sort-id');
    fireEvent.click(sortIdHeader);

    // Should show sort indicator
    expect(sortIdHeader).toHaveTextContent('↑');

    // Click again to reverse sort
    fireEvent.click(sortIdHeader);
    expect(sortIdHeader).toHaveTextContent('↓');
  });

  it('displays data table with correct structure', async () => {
    renderWithProviders(<PerformanceTestPage />);

    // Wait for initial data to load
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const dataTable = screen.getByTestId('performance-data-table');
    expect(dataTable).toBeInTheDocument();

    // Check table headers
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Created')).toBeInTheDocument();
  });

  it('shows loading state during data generation', async () => {
    // Mock a delayed response
    mockFetch.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                status: 200,
                json: async () => ({
                  success: true,
                  data: { items: [], count: 0 },
                }),
              }),
            100
          )
        )
    );

    renderWithProviders(<PerformanceTestPage />);

    const generateButton = screen.getByTestId('generate-dataset-btn');
    fireEvent.click(generateButton);

    // Should show loading state
    expect(screen.getByText('Generating...')).toBeInTheDocument();
    expect(screen.getByText('Generating large dataset...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Generate Dataset')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    mockFetch.mockRejectedValue(new Error('Network error'));

    renderWithProviders(<PerformanceTestPage />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to generate dataset:',
        expect.any(Error)
      );
    });

    consoleSpy.mockRestore();
  });

  it('displays results summary correctly', async () => {
    renderWithProviders(<PerformanceTestPage />);

    // Wait for initial data to load
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    // Should show results summary
    expect(screen.getByText(/Showing \d+ of \d+ items/)).toBeInTheDocument();
  });

  it('handles large dataset sizes correctly', async () => {
    renderWithProviders(<PerformanceTestPage />);

    const sizeSelect = screen.getByTestId('dataset-size-select');

    // Test different dataset sizes
    const sizes = ['100', '500', '1000', '2500', '5000', '10000'];
    sizes.forEach((size) => {
      expect(screen.getByDisplayValue(size)).toBeInTheDocument();
    });

    // Select largest size
    fireEvent.change(sizeSelect, { target: { value: '10000' } });
    expect(sizeSelect).toHaveValue('10000');
  });

  it('maintains performance metrics during interactions', async () => {
    renderWithProviders(<PerformanceTestPage />);

    // Wait for initial data to load
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    // Perform multiple interactions
    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    const categoryFilter = screen.getByTestId('category-filter');
    fireEvent.change(categoryFilter, { target: { value: 'Category 1' } });

    // Performance metrics should still be displayed
    expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
    expect(screen.getByText('12.50ms')).toBeInTheDocument();
  });
});
