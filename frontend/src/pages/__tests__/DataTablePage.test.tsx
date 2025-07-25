import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import DataTablePage from '../DataTablePage';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock data
const mockUsersResponse = {
  success: true,
  data: [
    {
      id: '1',
      username: 'john_doe',
      email: 'john@example.com',
      role: 'admin',
      profile: {
        firstName: 'John',
        lastName: 'Doe',
      },
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      username: 'jane_smith',
      email: 'jane@example.com',
      role: 'user',
      profile: {
        firstName: 'Jane',
        lastName: 'Smith',
      },
      createdAt: '2024-01-02T00:00:00Z',
    },
  ],
  pagination: {
    page: 1,
    limit: 10,
    total: 2,
    totalPages: 1,
  },
};

const mockProductsResponse = {
  success: true,
  data: [
    {
      id: '1',
      name: 'Laptop',
      description: 'High-performance laptop',
      price: 999.99,
      category: 'Electronics',
      inStock: true,
      tags: ['computer', 'portable'],
      createdAt: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      name: 'Mouse',
      description: 'Wireless mouse',
      price: 29.99,
      category: 'Electronics',
      inStock: false,
      tags: ['computer', 'wireless'],
      createdAt: '2024-01-02T00:00:00Z',
    },
  ],
  pagination: {
    page: 1,
    limit: 10,
    total: 2,
    totalPages: 1,
  },
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('DataTablePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/api/users')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockUsersResponse),
        });
      }
      if (url.includes('/api/products')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockProductsResponse),
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  describe('Page Rendering', () => {
    it('renders the page title and description', async () => {
      renderWithRouter(<DataTablePage />);

      expect(screen.getByText('Dynamic Data Tables')).toBeInTheDocument();
      expect(
        screen.getByText(
          'Interactive data tables with sorting, filtering, pagination, and CRUD operations'
        )
      ).toBeInTheDocument();
    });

    it('renders tab navigation', async () => {
      renderWithRouter(<DataTablePage />);

      await waitFor(() => {
        expect(screen.getByTestId('users-tab')).toBeInTheDocument();
        expect(screen.getByTestId('products-tab')).toBeInTheDocument();
      });
    });

    it('shows users tab as active by default', async () => {
      renderWithRouter(<DataTablePage />);

      await waitFor(() => {
        const usersTab = screen.getByTestId('users-tab');
        expect(usersTab).toHaveClass('border-blue-500');
      });
    });
  });

  describe('Users Table', () => {
    it('fetches and displays users data', async () => {
      renderWithRouter(<DataTablePage />);

      await waitFor(() => {
        expect(screen.getByText('john_doe')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('Jane')).toBeInTheDocument();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/users?page=1&limit=10')
      );
    });

    it('displays user role badges with correct styling', async () => {
      renderWithRouter(<DataTablePage />);

      await waitFor(() => {
        const adminBadge = screen.getByText('admin');
        expect(adminBadge).toHaveClass('bg-red-100', 'text-red-800');

        const userBadge = screen.getByText('user');
        expect(userBadge).toHaveClass('bg-green-100', 'text-green-800');
      });
    });

    it('formats dates correctly', async () => {
      renderWithRouter(<DataTablePage />);

      await waitFor(() => {
        expect(screen.getByText('1/1/2024')).toBeInTheDocument();
        expect(screen.getByText('1/2/2024')).toBeInTheDocument();
      });
    });

    it('handles user pagination', async () => {
      renderWithRouter(<DataTablePage />);

      await waitFor(() => {
        expect(screen.getByTestId('users-table')).toBeInTheDocument();
      });

      // Check if pagination controls are rendered
      expect(screen.getByTestId('users-table-page-size')).toBeInTheDocument();
    });

    it('handles user sorting', async () => {
      renderWithRouter(<DataTablePage />);

      await waitFor(() => {
        expect(
          screen.getByTestId('users-table-header-username')
        ).toBeInTheDocument();
      });

      const usernameHeader = screen.getByTestId('users-table-header-username');
      await userEvent.click(usernameHeader);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('sortBy=username&sortOrder=asc')
        );
      });
    });

    it('handles user filtering', async () => {
      renderWithRouter(<DataTablePage />);

      await waitFor(() => {
        expect(
          screen.getByTestId('users-table-filter-username')
        ).toBeInTheDocument();
      });

      const usernameFilter = screen.getByTestId('users-table-filter-username');
      await userEvent.type(usernameFilter, 'john');

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('username=john')
        );
      });
    });
  });

  describe('Products Table', () => {
    it('switches to products tab and fetches products data', async () => {
      renderWithRouter(<DataTablePage />);

      const productsTab = screen.getByTestId('products-tab');
      await userEvent.click(productsTab);

      await waitFor(() => {
        expect(screen.getByText('Laptop')).toBeInTheDocument();
        expect(screen.getByText('$999.99')).toBeInTheDocument();
        expect(screen.getByText('Electronics')).toBeInTheDocument();
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/products?page=1&limit=10')
      );
    });

    it('displays product stock status with correct styling', async () => {
      renderWithRouter(<DataTablePage />);

      const productsTab = screen.getByTestId('products-tab');
      await userEvent.click(productsTab);

      await waitFor(() => {
        const inStockBadge = screen.getByText('Yes');
        expect(inStockBadge).toHaveClass('bg-green-100', 'text-green-800');

        const outOfStockBadge = screen.getByText('No');
        expect(outOfStockBadge).toHaveClass('bg-red-100', 'text-red-800');
      });
    });

    it('displays product tags correctly', async () => {
      renderWithRouter(<DataTablePage />);

      const productsTab = screen.getByTestId('products-tab');
      await userEvent.click(productsTab);

      await waitFor(() => {
        expect(screen.getAllByText('computer')).toHaveLength(2); // appears in both products
        expect(screen.getByText('portable')).toBeInTheDocument();
        expect(screen.getByText('wireless')).toBeInTheDocument();
      });
    });

    it('truncates long descriptions', async () => {
      renderWithRouter(<DataTablePage />);

      const productsTab = screen.getByTestId('products-tab');
      await userEvent.click(productsTab);

      await waitFor(() => {
        const description = screen.getByText('High-performance laptop');
        expect(description).toHaveClass('max-w-xs', 'truncate');
      });
    });
  });

  describe('CRUD Operations', () => {
    it('opens edit modal when edit button is clicked', async () => {
      renderWithRouter(<DataTablePage />);

      await waitFor(() => {
        expect(screen.getByTestId('users-table-edit-1')).toBeInTheDocument();
      });

      const editButton = screen.getByTestId('users-table-edit-1');
      await userEvent.click(editButton);

      expect(screen.getByTestId('edit-modal')).toBeInTheDocument();
      expect(screen.getByText('Edit User')).toBeInTheDocument();
    });

    it('opens delete modal when delete button is clicked', async () => {
      renderWithRouter(<DataTablePage />);

      await waitFor(() => {
        expect(screen.getByTestId('users-table-delete-1')).toBeInTheDocument();
      });

      const deleteButton = screen.getByTestId('users-table-delete-1');
      await userEvent.click(deleteButton);

      expect(screen.getByTestId('delete-modal')).toBeInTheDocument();
      expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    });

    it('closes edit modal when cancel is clicked', async () => {
      renderWithRouter(<DataTablePage />);

      await waitFor(() => {
        expect(screen.getByTestId('users-table-edit-1')).toBeInTheDocument();
      });

      const editButton = screen.getByTestId('users-table-edit-1');
      await userEvent.click(editButton);

      const cancelButton = screen.getByText('Cancel');
      await userEvent.click(cancelButton);

      expect(screen.queryByTestId('edit-modal')).not.toBeInTheDocument();
    });

    it('performs delete operation when confirmed', async () => {
      mockFetch.mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true }),
        })
      );

      renderWithRouter(<DataTablePage />);

      await waitFor(() => {
        expect(screen.getByTestId('users-table-delete-1')).toBeInTheDocument();
      });

      const deleteButton = screen.getByTestId('users-table-delete-1');
      await userEvent.click(deleteButton);

      const confirmButton = screen.getByText('Delete');
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/users/1', {
          method: 'DELETE',
        });
      });
    });
  });

  describe('Row Selection and Bulk Operations', () => {
    it('enables row selection and shows bulk actions', async () => {
      renderWithRouter(<DataTablePage />);

      await waitFor(() => {
        expect(screen.getByTestId('users-table-select-1')).toBeInTheDocument();
      });

      const checkbox = screen.getByTestId('users-table-select-1');
      await userEvent.click(checkbox);

      expect(screen.getByTestId('users-table-bulk-delete')).toBeInTheDocument();
      expect(screen.getByText('1 item selected')).toBeInTheDocument();
    });

    it('handles select all functionality', async () => {
      renderWithRouter(<DataTablePage />);

      await waitFor(() => {
        expect(
          screen.getByTestId('users-table-select-all')
        ).toBeInTheDocument();
      });

      const selectAllCheckbox = screen.getByTestId('users-table-select-all');
      await userEvent.click(selectAllCheckbox);

      expect(screen.getByText('2 items selected')).toBeInTheDocument();
    });

    it('clears selection when clear button is clicked', async () => {
      renderWithRouter(<DataTablePage />);

      await waitFor(() => {
        expect(screen.getByTestId('users-table-select-1')).toBeInTheDocument();
      });

      // Select a row
      const checkbox = screen.getByTestId('users-table-select-1');
      await userEvent.click(checkbox);

      // Clear selection
      const clearButton = screen.getByTestId('users-table-clear-selection');
      await userEvent.click(clearButton);

      expect(
        screen.queryByTestId('users-table-bulk-delete')
      ).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('handles fetch errors gracefully', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      renderWithRouter(<DataTablePage />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error fetching users:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });

    it('handles delete errors gracefully', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // First call for initial data fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUsersResponse),
      });

      // Second call for delete operation
      mockFetch.mockRejectedValueOnce(new Error('Delete failed'));

      renderWithRouter(<DataTablePage />);

      await waitFor(() => {
        expect(screen.getByTestId('users-table-delete-1')).toBeInTheDocument();
      });

      const deleteButton = screen.getByTestId('users-table-delete-1');
      await userEvent.click(deleteButton);

      const confirmButton = screen.getByText('Delete');
      await userEvent.click(confirmButton);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error deleting item:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Tab Counts', () => {
    it('displays correct counts in tab labels', async () => {
      renderWithRouter(<DataTablePage />);

      await waitFor(() => {
        expect(screen.getByText('Users (2)')).toBeInTheDocument();
      });

      const productsTab = screen.getByTestId('products-tab');
      await userEvent.click(productsTab);

      await waitFor(() => {
        expect(screen.getByText('Products (2)')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('shows loading state while fetching data', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(promise);

      renderWithRouter(<DataTablePage />);

      // Should show loading state
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Resolve the promise
      resolvePromise!({
        ok: true,
        json: () => Promise.resolve(mockUsersResponse),
      });

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });
    });
  });
});
