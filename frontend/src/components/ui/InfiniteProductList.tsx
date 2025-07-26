import React, { useCallback } from 'react';
import {
  useInfiniteScroll,
  useInfiniteScrollSentinel,
} from '../../hooks/useInfiniteScroll';
import axios from 'axios';

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

const InfiniteProductList: React.FC<InfiniteProductListProps> = ({
  searchQuery = '',
  category = '',
  className = '',
}) => {
  const { SentinelComponent } = useInfiniteScrollSentinel();

  const fetchProducts = useCallback(
    async (page: number, pageSize: number) => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });

      if (searchQuery) {
        params.append('search', searchQuery);
      }
      if (category) {
        params.append('category', category);
      }

      const response = await axios.get(
        `http://localhost:3001/api/products?${params}`
      );

      if (!response.data.success) {
        throw new Error(
          response.data.error?.message || 'Failed to fetch products'
        );
      }

      const { data: products, pagination } = response.data.data;

      return {
        data: products,
        hasMore: pagination.hasMore,
        total: pagination.total,
      };
    },
    [searchQuery, category]
  );

  const {
    data: products,
    loading,
    error,
    hasMore,
    total,
    reset,
  } = useInfiniteScroll({
    fetchMore: fetchProducts,
    pageSize: 12,
    threshold: 200,
  });

  // Reset when search query or category changes
  React.useEffect(() => {
    reset();
  }, [searchQuery, category, reset]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const getStockStatus = (inStock: boolean) => {
    return inStock ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        In Stock
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
        Out of Stock
      </span>
    );
  };

  if (error) {
    return (
      <div
        className={`text-center py-8 ${className}`}
        data-testid="product-list-error"
      >
        <div className="text-red-600 mb-4">
          <svg
            className="mx-auto h-12 w-12"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Error Loading Products
        </h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <button
          onClick={reset}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          data-testid="retry-button"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={className} data-testid="infinite-product-list">
      {/* Results summary */}
      <div className="mb-6 text-sm text-gray-600" data-testid="results-summary">
        {total > 0 && (
          <p>
            Showing {products.length} of {total} products
            {searchQuery && ` for "${searchQuery}"`}
            {category && ` in ${category}`}
          </p>
        )}
      </div>

      {/* Product grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product, index) => (
          <div
            key={product.id}
            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
            data-testid={`product-card-${index}`}
          >
            {/* Product image placeholder */}
            <div className="h-48 bg-gray-200 flex items-center justify-center">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <svg
                  className="h-16 w-16 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              )}
            </div>

            {/* Product details */}
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <h3
                  className="text-lg font-semibold text-gray-900 truncate"
                  data-testid="product-name"
                >
                  {product.name}
                </h3>
                {getStockStatus(product.inStock)}
              </div>

              <p
                className="text-gray-600 text-sm mb-3 line-clamp-2"
                data-testid="product-description"
              >
                {product.description}
              </p>

              <div className="flex justify-between items-center mb-3">
                <span
                  className="text-2xl font-bold text-blue-600"
                  data-testid="product-price"
                >
                  {formatPrice(product.price)}
                </span>
                <span
                  className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded"
                  data-testid="product-category"
                >
                  {product.category}
                </span>
              </div>

              {/* Tags */}
              {product.tags.length > 0 && (
                <div
                  className="flex flex-wrap gap-1 mb-3"
                  data-testid="product-tags"
                >
                  {product.tags.slice(0, 3).map((tag, tagIndex) => (
                    <span
                      key={tagIndex}
                      className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {product.tags.length > 3 && (
                    <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                      +{product.tags.length - 3} more
                    </span>
                  )}
                </div>
              )}

              {/* Action button */}
              <button
                className={`w-full py-2 px-4 rounded-md text-sm font-medium transition-colors duration-200 ${
                  product.inStock
                    ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                disabled={!product.inStock}
                data-testid="add-to-cart-button"
              >
                {product.inStock ? 'Add to Cart' : 'Out of Stock'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div
          className="flex justify-center items-center py-8"
          data-testid="loading-indicator"
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading more products...</span>
        </div>
      )}

      {/* No more results */}
      {!hasMore && products.length > 0 && (
        <div
          className="text-center py-8 text-gray-500"
          data-testid="no-more-results"
        >
          <p>You've reached the end of the product list.</p>
        </div>
      )}

      {/* No results */}
      {!loading && products.length === 0 && (
        <div className="text-center py-12" data-testid="no-results">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2 2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1H7a1 1 0 00-1 1v1m8 0V4a1 1 0 00-1-1H9a1 1 0 00-1 1v1m4 0h-2m0 0V4a1 1 0 00-1-1h-2a1 1 0 00-1 1v1m4 0V4a1 1 0 00-1-1h-2a1 1 0 00-1 1v1"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No products found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || category
              ? 'Try adjusting your search criteria.'
              : 'No products are available at the moment.'}
          </p>
        </div>
      )}

      {/* Infinite scroll sentinel */}
      <SentinelComponent />
    </div>
  );
};

export default InfiniteProductList;
