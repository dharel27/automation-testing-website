import React, { useState, useEffect } from 'react';
import { DataTable, Column } from '../components/ui/DataTable';
import { Modal } from '../components/ui/Modal';

// Types for our data
interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  profile: {
    firstName?: string;
    lastName?: string;
  };
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  inStock: boolean;
  tags: string[];
  createdAt: string;
}

interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const DataTablePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'products'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [productsLoading, setProductsLoading] = useState(false);
  const [usersPagination, setUsersPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [productsPagination, setProductsPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [usersSort, setUsersSort] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [productsSort, setProductsSort] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [usersFilters, setUsersFilters] = useState<Record<string, string>>({});
  const [productsFilters, setProductsFilters] = useState<
    Record<string, string>
  >({});
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<User | Product | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<User | Product | null>(null);

  // Fetch users
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const params = new URLSearchParams({
        page: usersPagination.page.toString(),
        limit: usersPagination.limit.toString(),
      });

      // Add filters
      Object.entries(usersFilters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });

      // Add sorting
      if (usersSort) {
        params.append('sortBy', usersSort.key);
        params.append('sortOrder', usersSort.direction);
      }

      const response = await fetch(`/api/users?${params}`);
      const data: PaginatedResponse<User> = await response.json();

      if (data.success) {
        setUsers(data.data);
        setUsersPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  // Fetch products
  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const params = new URLSearchParams({
        page: productsPagination.page.toString(),
        limit: productsPagination.limit.toString(),
      });

      // Add filters
      Object.entries(productsFilters).forEach(([key, value]) => {
        if (value) {
          if (key === 'q') {
            params.append('q', value);
          } else if (key === 'category') {
            params.append('category', value);
          } else if (key === 'inStock') {
            params.append('inStock', value);
          }
        }
      });

      // Add sorting
      if (productsSort) {
        params.append('sortBy', productsSort.key);
        params.append('sortOrder', productsSort.direction);
      }

      const response = await fetch(`/api/products?${params}`);
      const data: PaginatedResponse<Product> = await response.json();

      if (data.success) {
        setProducts(data.data);
        setProductsPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setProductsLoading(false);
    }
  };

  // Load data on component mount and when dependencies change
  useEffect(() => {
    fetchUsers();
  }, [usersPagination.page, usersPagination.limit, usersSort, usersFilters]);

  useEffect(() => {
    fetchProducts();
  }, [
    productsPagination.page,
    productsPagination.limit,
    productsSort,
    productsFilters,
  ]);

  // User table columns
  const userColumns: Column<User>[] = [
    {
      key: 'username',
      header: 'Username',
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
      render: (value: string) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            value === 'admin'
              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              : value === 'user'
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
          }`}
        >
          {value}
        </span>
      ),
    },
    {
      key: 'profile.firstName',
      header: 'First Name',
      sortable: true,
      filterable: true,
      render: (value: string | undefined) => value || '-',
    },
    {
      key: 'profile.lastName',
      header: 'Last Name',
      sortable: true,
      filterable: true,
      render: (value: string | undefined) => value || '-',
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  // Product table columns
  const productColumns: Column<Product>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      filterable: true,
    },
    {
      key: 'description',
      header: 'Description',
      filterable: true,
      render: (value: string) => (
        <div className="max-w-xs truncate" title={value}>
          {value}
        </div>
      ),
    },
    {
      key: 'price',
      header: 'Price',
      sortable: true,
      render: (value: number) => `$${value.toFixed(2)}`,
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      filterable: true,
    },
    {
      key: 'inStock',
      header: 'In Stock',
      sortable: true,
      filterable: true,
      render: (value: boolean) => (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            value
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}
        >
          {value ? 'Yes' : 'No'}
        </span>
      ),
    },
    {
      key: 'tags',
      header: 'Tags',
      render: (value: string[]) => (
        <div className="flex flex-wrap gap-1">
          {value.slice(0, 2).map((tag, index) => (
            <span
              key={index}
              className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded"
            >
              {tag}
            </span>
          ))}
          {value.length > 2 && (
            <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 rounded">
              +{value.length - 2}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  // Handle user operations
  const handleUserPageChange = (page: number) => {
    setUsersPagination((prev) => ({ ...prev, page }));
  };

  const handleUserLimitChange = (limit: number) => {
    setUsersPagination((prev) => ({ ...prev, limit, page: 1 }));
  };

  const handleUserSort = (key: string, direction: 'asc' | 'desc') => {
    setUsersSort({ key, direction });
  };

  const handleUserFilter = (filters: Record<string, string>) => {
    setUsersFilters(filters);
    setUsersPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleUserEdit = (user: User) => {
    setEditingItem(user);
    setEditModalOpen(true);
  };

  const handleUserDelete = (user: User) => {
    setDeletingItem(user);
    setDeleteModalOpen(true);
  };

  const handleUserBulkDelete = (users: User[]) => {
    console.log('Bulk delete users:', users);
    // Implement bulk delete logic
  };

  // Handle product operations
  const handleProductPageChange = (page: number) => {
    setProductsPagination((prev) => ({ ...prev, page }));
  };

  const handleProductLimitChange = (limit: number) => {
    setProductsPagination((prev) => ({ ...prev, limit, page: 1 }));
  };

  const handleProductSort = (key: string, direction: 'asc' | 'desc') => {
    setProductsSort({ key, direction });
  };

  const handleProductFilter = (filters: Record<string, string>) => {
    setProductsFilters(filters);
    setProductsPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleProductEdit = (product: Product) => {
    setEditingItem(product);
    setEditModalOpen(true);
  };

  const handleProductDelete = (product: Product) => {
    setDeletingItem(product);
    setDeleteModalOpen(true);
  };

  const handleProductBulkDelete = (products: Product[]) => {
    console.log('Bulk delete products:', products);
    // Implement bulk delete logic
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;

    try {
      const endpoint = 'username' in deletingItem ? 'users' : 'products';
      const response = await fetch(`/api/${endpoint}/${deletingItem.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Refresh data
        if ('username' in deletingItem) {
          fetchUsers();
        } else {
          fetchProducts();
        }
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    } finally {
      setDeleteModalOpen(false);
      setDeletingItem(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Dynamic Data Tables
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Interactive data tables with sorting, filtering, pagination, and CRUD
          operations
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            data-testid="users-tab"
          >
            Users ({usersPagination.total})
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'products'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
            data-testid="products-tab"
          >
            Products ({productsPagination.total})
          </button>
        </nav>
      </div>

      {/* Users Table */}
      {activeTab === 'users' && (
        <DataTable
          data={users}
          columns={userColumns}
          loading={usersLoading}
          pagination={usersPagination}
          onPageChange={handleUserPageChange}
          onLimitChange={handleUserLimitChange}
          onSort={handleUserSort}
          onFilter={handleUserFilter}
          onRowSelect={setSelectedUsers}
          onRowEdit={handleUserEdit}
          onRowDelete={handleUserDelete}
          onBulkDelete={handleUserBulkDelete}
          selectable
          editable
          deletable
          bulkActions
          emptyMessage="No users found"
          data-testid="users-table"
        />
      )}

      {/* Products Table */}
      {activeTab === 'products' && (
        <DataTable
          data={products}
          columns={productColumns}
          loading={productsLoading}
          pagination={productsPagination}
          onPageChange={handleProductPageChange}
          onLimitChange={handleProductLimitChange}
          onSort={handleProductSort}
          onFilter={handleProductFilter}
          onRowSelect={setSelectedProducts}
          onRowEdit={handleProductEdit}
          onRowDelete={handleProductDelete}
          onBulkDelete={handleProductBulkDelete}
          selectable
          editable
          deletable
          bulkActions
          emptyMessage="No products found"
          data-testid="products-table"
        />
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingItem(null);
        }}
        title={`Edit ${editingItem && 'username' in editingItem ? 'User' : 'Product'}`}
        data-testid="edit-modal"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Edit functionality would be implemented here with a form.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setEditModalOpen(false);
                setEditingItem(null);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setEditModalOpen(false);
                setEditingItem(null);
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletingItem(null);
        }}
        title="Confirm Delete"
        data-testid="delete-modal"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete this{' '}
            {deletingItem && 'username' in deletingItem ? 'user' : 'product'}?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setDeleteModalOpen(false);
                setDeletingItem(null);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DataTablePage;
