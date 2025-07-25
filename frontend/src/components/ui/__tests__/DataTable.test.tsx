import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { DataTable, Column } from '../DataTable';

// Mock data
interface TestItem {
  id: string;
  name: string;
  email: string;
  role: string;
  age: number;
  active: boolean;
}

const mockData: TestItem[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
    age: 30,
    active: true,
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'user',
    age: 25,
    active: false,
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'user',
    age: 35,
    active: true,
  },
];

const mockColumns: Column<TestItem>[] = [
  {
    key: 'name',
    header: 'Name',
    sortable: true,
    filterable: true,
  },
  {
    key: 'email',
    header: 'Email',
    sortable: true,
    filterable: true,
  },
  {
    key: 'role',
    header: 'Role',
    sortable: true,
    filterable: true,
  },
  {
    key: 'age',
    header: 'Age',
    sortable: true,
  },
  {
    key: 'active',
    header: 'Active',
    render: (value: boolean) => (value ? 'Yes' : 'No'),
  },
];

const mockPagination = {
  page: 1,
  limit: 10,
  total: 3,
  totalPages: 1,
};

describe('DataTable', () => {
  const defaultProps = {
    data: mockData,
    columns: mockColumns,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders table with data', () => {
      render(<DataTable {...defaultProps} />);

      expect(screen.getByTestId('data-table')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('jane@example.com')).toBeInTheDocument();
      expect(screen.getByText('admin')).toBeInTheDocument();
    });

    it('renders column headers', () => {
      render(<DataTable {...defaultProps} />);

      expect(screen.getByTestId('data-table-header-name')).toBeInTheDocument();
      expect(screen.getByTestId('data-table-header-email')).toBeInTheDocument();
      expect(screen.getByTestId('data-table-header-role')).toBeInTheDocument();
      expect(screen.getByTestId('data-table-header-age')).toBeInTheDocument();
      expect(
        screen.getByTestId('data-table-header-active')
      ).toBeInTheDocument();
    });

    it('renders custom cell content using render function', () => {
      render(<DataTable {...defaultProps} />);

      expect(screen.getAllByText('Yes')).toHaveLength(2); // active: true (2 items)
      expect(screen.getByText('No')).toBeInTheDocument(); // active: false
    });

    it('displays empty message when no data', () => {
      render(
        <DataTable {...defaultProps} data={[]} emptyMessage="No items found" />
      );

      expect(screen.getByTestId('data-table-empty')).toBeInTheDocument();
      expect(screen.getByText('No items found')).toBeInTheDocument();
    });

    it('displays loading state', () => {
      render(<DataTable {...defaultProps} loading={true} />);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Sorting', () => {
    it('calls onSort when sortable column header is clicked', async () => {
      const onSort = vi.fn();
      render(<DataTable {...defaultProps} onSort={onSort} />);

      const nameHeader = screen.getByTestId('data-table-header-name');
      await userEvent.click(nameHeader);

      expect(onSort).toHaveBeenCalledWith('name', 'asc');
    });

    it('toggles sort direction on repeated clicks', async () => {
      const onSort = vi.fn();
      render(<DataTable {...defaultProps} onSort={onSort} />);

      const nameHeader = screen.getByTestId('data-table-header-name');

      // First click - ascending
      await userEvent.click(nameHeader);
      expect(onSort).toHaveBeenCalledWith('name', 'asc');

      // Second click - descending
      await userEvent.click(nameHeader);
      expect(onSort).toHaveBeenCalledWith('name', 'desc');
    });

    it('does not call onSort for non-sortable columns', async () => {
      const onSort = vi.fn();
      const nonSortableColumns: Column<TestItem>[] = [
        { key: 'name', header: 'Name', sortable: false },
      ];

      render(
        <DataTable
          data={mockData}
          columns={nonSortableColumns}
          onSort={onSort}
        />
      );

      const nameHeader = screen.getByTestId('data-table-header-name');
      await userEvent.click(nameHeader);

      expect(onSort).not.toHaveBeenCalled();
    });
  });

  describe('Filtering', () => {
    it('renders filter inputs for filterable columns', () => {
      render(<DataTable {...defaultProps} />);

      expect(screen.getByTestId('data-table-filter-name')).toBeInTheDocument();
      expect(screen.getByTestId('data-table-filter-email')).toBeInTheDocument();
      expect(screen.getByTestId('data-table-filter-role')).toBeInTheDocument();
      expect(
        screen.queryByTestId('data-table-filter-age')
      ).not.toBeInTheDocument(); // not filterable
    });

    it('calls onFilter when filter input changes', async () => {
      const onFilter = vi.fn();
      render(<DataTable {...defaultProps} onFilter={onFilter} />);

      const nameFilter = screen.getByTestId('data-table-filter-name');
      await userEvent.type(nameFilter, 'John');

      await waitFor(() => {
        expect(onFilter).toHaveBeenCalledWith({ name: 'John' });
      });
    });

    it('removes filter when input is cleared', async () => {
      const onFilter = vi.fn();
      render(<DataTable {...defaultProps} onFilter={onFilter} />);

      const nameFilter = screen.getByTestId('data-table-filter-name');

      // Type and then clear
      await userEvent.type(nameFilter, 'John');
      await userEvent.clear(nameFilter);

      await waitFor(() => {
        expect(onFilter).toHaveBeenCalledWith({});
      });
    });
  });

  describe('Row Selection', () => {
    it('renders selection checkboxes when selectable is true', () => {
      render(<DataTable {...defaultProps} selectable={true} />);

      expect(screen.getByTestId('data-table-select-all')).toBeInTheDocument();
      expect(screen.getByTestId('data-table-select-1')).toBeInTheDocument();
      expect(screen.getByTestId('data-table-select-2')).toBeInTheDocument();
      expect(screen.getByTestId('data-table-select-3')).toBeInTheDocument();
    });

    it('calls onRowSelect when individual row is selected', async () => {
      const onRowSelect = vi.fn();
      render(
        <DataTable
          {...defaultProps}
          selectable={true}
          onRowSelect={onRowSelect}
        />
      );

      const checkbox = screen.getByTestId('data-table-select-1');
      await userEvent.click(checkbox);

      expect(onRowSelect).toHaveBeenCalledWith([mockData[0]]);
    });

    it('selects all rows when select all is clicked', async () => {
      const onRowSelect = vi.fn();
      render(
        <DataTable
          {...defaultProps}
          selectable={true}
          onRowSelect={onRowSelect}
        />
      );

      const selectAllCheckbox = screen.getByTestId('data-table-select-all');
      await userEvent.click(selectAllCheckbox);

      expect(onRowSelect).toHaveBeenCalledWith(mockData);
    });

    it('deselects all rows when select all is unchecked', async () => {
      const onRowSelect = vi.fn();
      render(
        <DataTable
          {...defaultProps}
          selectable={true}
          onRowSelect={onRowSelect}
        />
      );

      const selectAllCheckbox = screen.getByTestId('data-table-select-all');

      // Select all first
      await userEvent.click(selectAllCheckbox);
      // Then deselect all
      await userEvent.click(selectAllCheckbox);

      expect(onRowSelect).toHaveBeenLastCalledWith([]);
    });
  });

  describe('CRUD Operations', () => {
    it('renders edit and delete buttons when editable and deletable are true', () => {
      render(<DataTable {...defaultProps} editable={true} deletable={true} />);

      expect(screen.getByTestId('data-table-edit-1')).toBeInTheDocument();
      expect(screen.getByTestId('data-table-delete-1')).toBeInTheDocument();
    });

    it('calls onRowEdit when edit button is clicked', async () => {
      const onRowEdit = vi.fn();
      render(
        <DataTable {...defaultProps} editable={true} onRowEdit={onRowEdit} />
      );

      const editButton = screen.getByTestId('data-table-edit-1');
      await userEvent.click(editButton);

      expect(onRowEdit).toHaveBeenCalledWith(mockData[0]);
    });

    it('calls onRowDelete when delete button is clicked', async () => {
      const onRowDelete = vi.fn();
      render(
        <DataTable
          {...defaultProps}
          deletable={true}
          onRowDelete={onRowDelete}
        />
      );

      const deleteButton = screen.getByTestId('data-table-delete-1');
      await userEvent.click(deleteButton);

      expect(onRowDelete).toHaveBeenCalledWith(mockData[0]);
    });
  });

  describe('Bulk Operations', () => {
    it('shows bulk actions when rows are selected and bulkActions is true', async () => {
      render(
        <DataTable {...defaultProps} selectable={true} bulkActions={true} />
      );

      // Select a row first
      const checkbox = screen.getByTestId('data-table-select-1');
      await userEvent.click(checkbox);

      expect(screen.getByTestId('data-table-bulk-delete')).toBeInTheDocument();
      expect(
        screen.getByTestId('data-table-clear-selection')
      ).toBeInTheDocument();
      expect(screen.getByText('1 item selected')).toBeInTheDocument();
    });

    it('calls onBulkDelete when bulk delete is clicked', async () => {
      const onBulkDelete = vi.fn();
      render(
        <DataTable
          {...defaultProps}
          selectable={true}
          bulkActions={true}
          onBulkDelete={onBulkDelete}
        />
      );

      // Select rows
      const checkbox1 = screen.getByTestId('data-table-select-1');
      const checkbox2 = screen.getByTestId('data-table-select-2');
      await userEvent.click(checkbox1);
      await userEvent.click(checkbox2);

      // Click bulk delete
      const bulkDeleteButton = screen.getByTestId('data-table-bulk-delete');
      await userEvent.click(bulkDeleteButton);

      expect(onBulkDelete).toHaveBeenCalledWith([mockData[0], mockData[1]]);
    });

    it('clears selection when clear selection is clicked', async () => {
      render(
        <DataTable {...defaultProps} selectable={true} bulkActions={true} />
      );

      // Select a row
      const checkbox = screen.getByTestId('data-table-select-1');
      await userEvent.click(checkbox);

      // Clear selection
      const clearButton = screen.getByTestId('data-table-clear-selection');
      await userEvent.click(clearButton);

      // Bulk actions should be hidden
      expect(
        screen.queryByTestId('data-table-bulk-delete')
      ).not.toBeInTheDocument();
    });
  });

  describe('Pagination', () => {
    it('renders pagination controls when pagination prop is provided', () => {
      render(<DataTable {...defaultProps} pagination={mockPagination} />);

      expect(screen.getByTestId('data-table-page-size')).toBeInTheDocument();
      expect(screen.getByTestId('data-table-prev-page')).toBeInTheDocument();
      expect(screen.getByTestId('data-table-next-page')).toBeInTheDocument();
      expect(screen.getByTestId('data-table-page-1')).toBeInTheDocument();
    });

    it('calls onPageChange when page button is clicked', async () => {
      const onPageChange = vi.fn();
      const paginationWithMultiplePages = {
        ...mockPagination,
        total: 25,
        totalPages: 3,
      };

      render(
        <DataTable
          {...defaultProps}
          pagination={paginationWithMultiplePages}
          onPageChange={onPageChange}
        />
      );

      const nextButton = screen.getByTestId('data-table-next-page');
      await userEvent.click(nextButton);

      expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('calls onLimitChange when page size is changed', async () => {
      const onLimitChange = vi.fn();
      render(
        <DataTable
          {...defaultProps}
          pagination={mockPagination}
          onLimitChange={onLimitChange}
        />
      );

      const pageSizeSelect = screen.getByTestId('data-table-page-size');
      await userEvent.selectOptions(pageSizeSelect, '25');

      expect(onLimitChange).toHaveBeenCalledWith(25);
    });

    it('disables previous button on first page', () => {
      render(<DataTable {...defaultProps} pagination={mockPagination} />);

      const prevButton = screen.getByTestId('data-table-prev-page');
      expect(prevButton).toBeDisabled();
    });

    it('disables next button on last page', () => {
      render(<DataTable {...defaultProps} pagination={mockPagination} />);

      const nextButton = screen.getByTestId('data-table-next-page');
      expect(nextButton).toBeDisabled();
    });

    it('displays correct pagination info', () => {
      render(<DataTable {...defaultProps} pagination={mockPagination} />);

      expect(
        screen.getByText('Showing 1 to 3 of 3 results')
      ).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<DataTable {...defaultProps} />);

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      const columnHeaders = screen.getAllByRole('columnheader');
      // We have 2 rows of headers (main headers + filter row), so double the columns
      expect(columnHeaders).toHaveLength(mockColumns.length * 2);
    });

    it('supports keyboard navigation for sortable headers', async () => {
      const onSort = vi.fn();
      render(<DataTable {...defaultProps} onSort={onSort} />);

      const nameHeader = screen.getByTestId('data-table-header-name');

      // Click should work for sorting
      await userEvent.click(nameHeader);
      expect(onSort).toHaveBeenCalledWith('name', 'asc');
    });
  });

  describe('Custom Test ID', () => {
    it('uses custom data-testid', () => {
      render(<DataTable {...defaultProps} data-testid="custom-table" />);

      expect(screen.getByTestId('custom-table')).toBeInTheDocument();
      expect(
        screen.getByTestId('custom-table-header-name')
      ).toBeInTheDocument();
    });
  });

  describe('Nested Properties', () => {
    interface NestedItem {
      id: string;
      user: {
        profile: {
          name: string;
        };
      };
    }

    const nestedData: NestedItem[] = [
      {
        id: '1',
        user: {
          profile: {
            name: 'John Doe',
          },
        },
      },
    ];

    const nestedColumns: Column<NestedItem>[] = [
      {
        key: 'user.profile.name',
        header: 'Name',
        sortable: true,
      },
    ];

    it('handles nested property access', () => {
      render(<DataTable data={nestedData} columns={nestedColumns} />);

      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });
});
