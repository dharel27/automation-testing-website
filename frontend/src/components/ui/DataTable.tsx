import React, { useState, useEffect, useMemo } from 'react';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, item: T) => React.ReactNode;
  width?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  onSort?: (key: string, direction: 'asc' | 'desc') => void;
  onFilter?: (filters: Record<string, string>) => void;
  onRowSelect?: (selectedRows: T[]) => void;
  onRowEdit?: (item: T) => void;
  onRowDelete?: (item: T) => void;
  onBulkDelete?: (items: T[]) => void;
  selectable?: boolean;
  editable?: boolean;
  deletable?: boolean;
  bulkActions?: boolean;
  emptyMessage?: string;
  'data-testid'?: string;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  loading = false,
  pagination,
  onPageChange,
  onLimitChange,
  onSort,
  onFilter,
  onRowSelect,
  onRowEdit,
  onRowDelete,
  onBulkDelete,
  selectable = false,
  editable = false,
  deletable = false,
  bulkActions = false,
  emptyMessage = 'No data available',
  'data-testid': testId = 'data-table',
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Reset selection when data changes
  useEffect(() => {
    setSelectedRows(new Set());
    setSelectAll(false);
  }, [data]);

  // Update select all state based on selected rows
  useEffect(() => {
    if (data.length === 0) {
      setSelectAll(false);
    } else {
      setSelectAll(selectedRows.size === data.length);
    }
  }, [selectedRows, data.length]);

  // Notify parent of selected rows
  useEffect(() => {
    if (onRowSelect) {
      const selected = data.filter((item) => selectedRows.has(item.id));
      onRowSelect(selected);
    }
  }, [selectedRows, data, onRowSelect]);

  const handleSort = (key: string) => {
    const column = columns.find((col) => col.key === key);
    if (!column?.sortable) return;

    let direction: 'asc' | 'desc' = 'asc';
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === 'asc'
    ) {
      direction = 'desc';
    }

    setSortConfig({ key, direction });
    onSort?.(key, direction);
  };

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    if (!value) {
      delete newFilters[key];
    }
    setFilters(newFilters);
    onFilter?.(newFilters);
  };

  const handleRowSelect = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedRows(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(data.map((item) => item.id)));
    } else {
      setSelectedRows(new Set());
    }
    setSelectAll(checked);
  };

  const handleBulkDelete = () => {
    if (onBulkDelete && selectedRows.size > 0) {
      const selectedItems = data.filter((item) => selectedRows.has(item.id));
      onBulkDelete(selectedItems);
    }
  };

  const getCellValue = (item: T, column: Column<T>) => {
    if (typeof column.key === 'string' && column.key.includes('.')) {
      // Handle nested properties
      const keys = column.key.split('.');
      let value: any = item;
      for (const key of keys) {
        value = value?.[key];
      }
      return value;
    }
    return (item as any)[column.key];
  };

  const renderSortIcon = (column: Column<T>) => {
    if (!column.sortable) return null;

    const isActive = sortConfig?.key === column.key;
    const direction = sortConfig?.direction;

    return (
      <span className="ml-1 inline-flex flex-col">
        <svg
          className={`w-3 h-3 ${
            isActive && direction === 'asc'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-400'
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
        <svg
          className={`w-3 h-3 -mt-1 ${
            isActive && direction === 'desc'
              ? 'text-blue-600 dark:text-blue-400'
              : 'text-gray-400'
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
          transform="rotate(180)"
        >
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </span>
    );
  };

  const pageSizeOptions = [10, 25, 50, 100];

  return (
    <div className="w-full" data-testid={testId}>
      {/* Bulk Actions */}
      {bulkActions && selectedRows.size > 0 && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700 dark:text-blue-300">
              {selectedRows.size} item{selectedRows.size !== 1 ? 's' : ''}{' '}
              selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                data-testid={`${testId}-bulk-delete`}
              >
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedRows(new Set())}
                className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                data-testid={`${testId}-clear-selection`}
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 rounded-lg">
        <table className="min-w-full divide-y divide-gray-300 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {selectable && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    data-testid={`${testId}-select-all`}
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                    column.sortable
                      ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700'
                      : ''
                  }`}
                  style={{ width: column.width }}
                  onClick={() =>
                    column.sortable && handleSort(String(column.key))
                  }
                  data-testid={`${testId}-header-${String(column.key)}`}
                >
                  <div className="flex items-center">
                    {column.header}
                    {renderSortIcon(column)}
                  </div>
                </th>
              ))}
              {(editable || deletable) && (
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
            {/* Filter Row */}
            <tr className="bg-gray-25 dark:bg-gray-750">
              {selectable && <th className="px-6 py-2"></th>}
              {columns.map((column) => (
                <th key={`filter-${String(column.key)}`} className="px-6 py-2">
                  {column.filterable && (
                    <input
                      type="text"
                      placeholder={`Filter ${column.header.toLowerCase()}...`}
                      value={filters[String(column.key)] || ''}
                      onChange={(e) =>
                        handleFilterChange(String(column.key), e.target.value)
                      }
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      data-testid={`${testId}-filter-${String(column.key)}`}
                    />
                  )}
                </th>
              ))}
              {(editable || deletable) && <th className="px-6 py-2"></th>}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td
                  colSpan={
                    columns.length +
                    (selectable ? 1 : 0) +
                    (editable || deletable ? 1 : 0)
                  }
                  className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                >
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    columns.length +
                    (selectable ? 1 : 0) +
                    (editable || deletable ? 1 : 0)
                  }
                  className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                  data-testid={`${testId}-empty`}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr
                  key={item.id}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${
                    selectedRows.has(item.id)
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : ''
                  }`}
                  data-testid={`${testId}-row-${index}`}
                >
                  {selectable && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(item.id)}
                        onChange={(e) =>
                          handleRowSelect(item.id, e.target.checked)
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        data-testid={`${testId}-select-${item.id}`}
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={String(column.key)}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
                      data-testid={`${testId}-cell-${item.id}-${String(column.key)}`}
                    >
                      {column.render
                        ? column.render(getCellValue(item, column), item)
                        : String(getCellValue(item, column) || '')}
                    </td>
                  ))}
                  {(editable || deletable) && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex gap-2">
                        {editable && (
                          <button
                            onClick={() => onRowEdit?.(item)}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            data-testid={`${testId}-edit-${item.id}`}
                          >
                            Edit
                          </button>
                        )}
                        {deletable && (
                          <button
                            onClick={() => onRowDelete?.(item)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                            data-testid={`${testId}-delete-${item.id}`}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700 dark:text-gray-300">
                Show:
              </label>
              <select
                value={pagination.limit}
                onChange={(e) => onLimitChange?.(Number(e.target.value))}
                className="border border-gray-300 dark:border-gray-600 rounded px-2 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                data-testid={`${testId}-page-size`}
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              Showing{' '}
              {Math.min(
                (pagination.page - 1) * pagination.limit + 1,
                pagination.total
              )}{' '}
              to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
              of {pagination.total} results
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange?.(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              data-testid={`${testId}-prev-page`}
            >
              Previous
            </button>

            <div className="flex gap-1">
              {Array.from(
                { length: Math.min(5, pagination.totalPages) },
                (_, i) => {
                  let pageNum;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange?.(pageNum)}
                      className={`px-3 py-1 text-sm border rounded ${
                        pagination.page === pageNum
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                      }`}
                      data-testid={`${testId}-page-${pageNum}`}
                    >
                      {pageNum}
                    </button>
                  );
                }
              )}
            </div>

            <button
              onClick={() => onPageChange?.(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              data-testid={`${testId}-next-page`}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
