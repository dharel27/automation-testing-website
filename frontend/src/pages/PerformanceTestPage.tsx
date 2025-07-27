import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  usePerformanceMonitor,
  useAsyncPerformanceMonitor,
} from '../hooks/usePerformanceMonitor';
import { usePerformance } from '../contexts/PerformanceContext';
import PerformanceDashboard from '../components/performance/PerformanceDashboard';

interface LargeDataItem {
  id: number;
  name: string;
  description: string;
  value: number;
  category: string;
  active: boolean;
  createdAt: string;
  tags: string[];
  metadata: {
    priority: 'low' | 'medium' | 'high';
    complexity: number;
    lastModified: string;
  };
}

interface SearchFilters {
  query: string;
  category: string;
  minValue: number;
  maxValue: number;
  activeOnly: boolean;
  priority: string;
}

export default function PerformanceTestPage() {
  const { metrics, startMeasurement, endMeasurement } = usePerformanceMonitor(
    'PerformanceTestPage'
  );
  const { measureAsync } = useAsyncPerformanceMonitor();
  const { recordApiCall } = usePerformance();

  const [dataset, setDataset] = useState<LargeDataItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [datasetSize, setDatasetSize] = useState(1000);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    category: '',
    minValue: 0,
    maxValue: 1000,
    activeOnly: false,
    priority: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [sortField, setSortField] = useState<keyof LargeDataItem>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Generate large dataset
  const generateLargeDataset = useCallback(
    async (size: number) => {
      setLoading(true);
      startMeasurement('dataset-generation');

      try {
        const result = await measureAsync('generate-dataset', async () => {
          // Simulate API call for large dataset
          const startTime = performance.now();

          const response = await fetch(`/api/test/large-dataset?count=${size}`);
          const data = await response.json();

          const endTime = performance.now();
          recordApiCall({
            url: `/api/test/large-dataset?count=${size}`,
            method: 'GET',
            duration: endTime - startTime,
            status: response.status,
            timestamp: Date.now(),
            size: JSON.stringify(data).length,
          });

          // Transform API data to our format with additional fields for testing
          const enhancedData: LargeDataItem[] = data.data.items.map(
            (item: any, index: number) => ({
              ...item,
              tags: [
                `tag-${index % 10}`,
                `category-${item.category}`,
                item.active ? 'active' : 'inactive',
              ],
              metadata: {
                priority: ['low', 'medium', 'high'][index % 3] as
                  | 'low'
                  | 'medium'
                  | 'high',
                complexity: Math.floor(Math.random() * 10) + 1,
                lastModified: new Date(
                  Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
                ).toISOString(),
              },
            })
          );

          return enhancedData;
        });

        setDataset(result);
      } catch (error) {
        console.error('Failed to generate dataset:', error);
      } finally {
        setLoading(false);
        endMeasurement('dataset-generation');
      }
    },
    [startMeasurement, endMeasurement, measureAsync, recordApiCall]
  );

  // Filtered and sorted data with performance monitoring
  const processedData = useMemo(() => {
    startMeasurement('data-processing');

    let filtered = dataset;

    // Apply filters
    if (searchFilters.query) {
      const query = searchFilters.query.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    if (searchFilters.category) {
      filtered = filtered.filter(
        (item) => item.category === searchFilters.category
      );
    }

    if (searchFilters.activeOnly) {
      filtered = filtered.filter((item) => item.active);
    }

    if (searchFilters.priority) {
      filtered = filtered.filter(
        (item) => item.metadata.priority === searchFilters.priority
      );
    }

    filtered = filtered.filter(
      (item) =>
        item.value >= searchFilters.minValue &&
        item.value <= searchFilters.maxValue
    );

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;

      return sortDirection === 'desc' ? -comparison : comparison;
    });

    endMeasurement('data-processing');
    return filtered;
  }, [
    dataset,
    searchFilters,
    sortField,
    sortDirection,
    startMeasurement,
    endMeasurement,
  ]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedData.slice(startIndex, startIndex + itemsPerPage);
  }, [processedData, currentPage, itemsPerPage]);

  // Get unique categories for filter dropdown
  const categories = useMemo(() => {
    return Array.from(new Set(dataset.map((item) => item.category))).sort();
  }, [dataset]);

  // Load initial dataset
  useEffect(() => {
    generateLargeDataset(datasetSize);
  }, []);

  const handleFilterChange = (field: keyof SearchFilters, value: any) => {
    setSearchFilters((prev) => ({ ...prev, [field]: value }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handleSort = (field: keyof LargeDataItem) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const totalPages = Math.ceil(processedData.length / itemsPerPage);

  return (
    <div
      className="container mx-auto px-4 py-8"
      data-testid="performance-test-page"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Performance Testing - Large Dataset
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          This page tests performance with large datasets, complex filtering,
          and real-time search. Current dataset size:{' '}
          <strong>{dataset.length.toLocaleString()}</strong> items
        </p>

        {/* Performance Dashboard */}
        <PerformanceDashboard className="mb-6" showDetails={true} />

        {/* Performance Metrics Display */}
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg mb-6">
          <h3 className="text-lg font-semibold mb-2">
            Component Performance Metrics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">
                Last Render:
              </span>
              <span className="ml-2 font-mono">
                {metrics.renderTime.toFixed(2)}ms
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">
                Avg Render:
              </span>
              <span className="ml-2 font-mono">
                {metrics.averageRenderTime.toFixed(2)}ms
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">
                Total Renders:
              </span>
              <span className="ml-2 font-mono">{metrics.totalRenders}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Memory:</span>
              <span className="ml-2 font-mono">
                {metrics.memoryUsage
                  ? `${(metrics.memoryUsage / 1024 / 1024).toFixed(1)}MB`
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Dataset Size Controls */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Dataset Size (for load testing)
          </label>
          <div className="flex items-center space-x-4">
            <select
              value={datasetSize}
              onChange={(e) => setDatasetSize(Number(e.target.value))}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              data-testid="dataset-size-select"
            >
              <option value={100}>100 items</option>
              <option value={500}>500 items</option>
              <option value={1000}>1,000 items</option>
              <option value={2500}>2,500 items</option>
              <option value={5000}>5,000 items</option>
              <option value={10000}>10,000 items</option>
            </select>
            <button
              onClick={() => generateLargeDataset(datasetSize)}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md transition-colors"
              data-testid="generate-dataset-btn"
            >
              {loading ? 'Generating...' : 'Generate Dataset'}
            </button>
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-lg font-semibold mb-4">Search & Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search Query
              </label>
              <input
                type="text"
                value={searchFilters.query}
                onChange={(e) => handleFilterChange('query', e.target.value)}
                placeholder="Search name, description, or tags..."
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                data-testid="search-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={searchFilters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                data-testid="category-filter"
              >
                <option value="">All Categories</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </label>
              <select
                value={searchFilters.priority}
                onChange={(e) => handleFilterChange('priority', e.target.value)}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                data-testid="priority-filter"
              >
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Min Value
              </label>
              <input
                type="number"
                value={searchFilters.minValue}
                onChange={(e) =>
                  handleFilterChange('minValue', Number(e.target.value))
                }
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                data-testid="min-value-input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Value
              </label>
              <input
                type="number"
                value={searchFilters.maxValue}
                onChange={(e) =>
                  handleFilterChange('maxValue', Number(e.target.value))
                }
                className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                data-testid="max-value-input"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="active-only"
                checked={searchFilters.activeOnly}
                onChange={(e) =>
                  handleFilterChange('activeOnly', e.target.checked)
                }
                className="mr-2"
                data-testid="active-only-checkbox"
              />
              <label
                htmlFor="active-only"
                className="text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Active items only
              </label>
            </div>
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Showing {paginatedData.length} of{' '}
          {processedData.length.toLocaleString()} items
          {processedData.length !== dataset.length &&
            ` (filtered from ${dataset.length.toLocaleString()} total)`}
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Items per page:
            </label>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              data-testid="items-per-page-select"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 px-3 py-1 rounded-md transition-colors"
              data-testid="prev-page-btn"
            >
              Previous
            </button>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              className="bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 px-3 py-1 rounded-md transition-colors"
              data-testid="next-page-btn"
            >
              Next
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full" data-testid="performance-data-table">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  {[
                    { key: 'id', label: 'ID' },
                    { key: 'name', label: 'Name' },
                    { key: 'category', label: 'Category' },
                    { key: 'value', label: 'Value' },
                    { key: 'active', label: 'Status' },
                    { key: 'createdAt', label: 'Created' },
                  ].map(({ key, label }) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key as keyof LargeDataItem)}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                      data-testid={`sort-${key}`}
                    >
                      {label}
                      {sortField === key && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {paginatedData.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    data-testid={`data-row-${item.id}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {item.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {item.value}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          item.active
                            ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                            : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                        }`}
                      >
                        {item.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {loading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-900 dark:text-white">
                Generating large dataset...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
