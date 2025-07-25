import React from 'react';
import {
  useInfiniteScroll,
  useIntersectionObserver,
} from '../../hooks/useInfiniteScroll';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  inStock: boolean;
  imageUrl?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

interface InfiniteProductListProps {
  searchQuery?: string;
  category?: string;
  className?: string;
}

export const InfiniteProductList: React.FC<InfiniteProductListProps> = ({
  searchQuery = '',
  category = '',
  className = '',
}) => {
  const fetchProducts = async (page: number, limit: number) => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (searchQuery) {
      params.append('search', searchQuery);
    }
    if (category) {
      params.append('category', category);
    }

    const response = await fetch(
      `http://localhost:3001/api/products?${params}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch products');
    }

    const result = await response.json();

    return {
      data: result.data.products || [],
      hasMore: result.data.hasMore || false,
      total: result.data.total || 0,
    };
  };

  const {
    data: products,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    total,
  } = useInfiniteScroll({
    fetchData: fetchProducts,
    limit: 12,
  });

  const loadMoreRef = useIntersectionObserver(loadMore);

  const ProductCard: React.FC<{ product: Product }> = ({ product }) => (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700 transition-transform hover:scale-105"
      data-testid="product-card"
      data-product-id={product.id}
    >
      {product.imageUrl && (
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-48 object-cover rounded-md mb-3"
          data-testid="product-image"
        />
      )}
      <h3
        className="font-semibold text-lg mb-2 text-gray-900 dark:text-white"
        data-testid="product-name"
      >
        {product.name}
      </h3>
      <p
        className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2"
        data-testid="product-description"
      >
        {product.description}
      </p>
      <div className="flex justify-between items-center mb-3">
        <span
          className="text-xl font-bold text-green-600 dark:text-green-400"
          data-testid="product-price"
        >
          ${product.price.toFixed(2)}
        </span>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            product.inStock
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}
          data-testid="product-stock-status"
        >
          {product.inStock ? 'In Stock' : 'Out of Stock'}
        </span>
      </div>
      <div className="flex flex-wrap gap-1 mb-3">
        {product.tags.map((tag, index) => (
          <span
            key={index}
            className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
            data-testid="product-tag"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="text-xs text-gray-500 dark:text-gray-400">
        Category: {product.category}
      </div>
    </div>
  );

  const LoadingSpinner: React.FC = () => (
    <div
      className="flex justify-center items-center py-8"
      data-testid="loading-spinner"
    >
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <span className="ml-2 text-gray-600 dark:text-gray-300">
        Loading products...
      </span>
    </div>
  );

  if (error) {
    return (
      <div className="text-center py-8" data-testid="error-message">
        <div className="text-red-600 dark:text-red-400 mb-4">
          Error: {error}
        </div>
        <button
          onClick={refresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          data-testid="retry-button"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      className={`infinite-product-list ${className}`}
      data-testid="infinite-product-list"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Products
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Showing {products.length} of {total} products
          </p>
        </div>
        <button
          onClick={refresh}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          data-testid="refresh-button"
        >
          Refresh
        </button>
      </div>

      {/* Products Grid */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        data-testid="products-grid"
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {/* Loading indicator */}
      {loading && <LoadingSpinner />}

      {/* Load more trigger */}
      {hasMore && !loading && (
        <div
          ref={loadMoreRef}
          className="h-10 flex items-center justify-center"
          data-testid="load-more-trigger"
        >
          <span className="text-gray-500 dark:text-gray-400 text-sm">
            Scroll down to load more...
          </span>
        </div>
      )}

      {/* End of list message */}
      {!hasMore && products.length > 0 && (
        <div
          className="text-center py-8 text-gray-500 dark:text-gray-400"
          data-testid="end-of-list"
        >
          You've reached the end of the product list!
        </div>
      )}

      {/* Empty state */}
      {!loading && products.length === 0 && (
        <div className="text-center py-12" data-testid="empty-state">
          <div className="text-gray-500 dark:text-gray-400 mb-4">
            No products found
          </div>
          <button
            onClick={refresh}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            data-testid="refresh-empty-button"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
};
