import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InfiniteProductList } from '../InfiniteProductList';

// Mock the useInfiniteScroll hook
const mockUseInfiniteScroll = {
  data: [],
  loading: false,
  error: null,
  hasMore: true,
  loadMore: jest.fn(),
  refresh: jest.fn(),
  total: 0,
  page: 1,
};

jest.mock('../../hooks/useInfiniteScroll', () => ({
  useInfiniteScroll: () => mockUseInfiniteScroll,
  useIntersectionObserver: (callback: () => void) => {
    // Return a ref that can be used to trigger the callback
    const ref = { current: null };
    // Simulate intersection observer triggering
    setTimeout(() => callback(), 100);
    return ref;
  },
}));

// Mock fetch
global.fetch = jest.fn();

const mockProducts = [
  {
    id: '1',
    name: 'Test Product 1',
    description: 'This is a test product description',
    price: 29.99,
    category: 'Electronics',
    inStock: true,
    imageUrl: 'https://example.com/image1.jpg',
    tags: ['tag1', 'tag2'],
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Test Product 2',
    description: 'Another test product',
    price: 49.99,
    category: 'Clothing',
    inStock: false,
    tags: ['tag3'],
    createdAt: '2023-01-02T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z',
  },
];

describe('InfiniteProductList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseInfiniteScroll.data = [];
    mockUseInfiniteScroll.loading = false;
    mockUseInfiniteScroll.error = null;
    mockUseInfiniteScroll.hasMore = true;
    mockUseInfiniteScroll.total = 0;
  });

  it('should render the component with header', () => {
    render(<InfiniteProductList />);

    expect(screen.getByText('Products')).toBeInTheDocument();
    expect(screen.getByText('Showing 0 of 0 products')).toBeInTheDocument();
    expect(screen.getByTestId('refresh-button')).toBeInTheDocument();
  });

  it('should render products when data is available', () => {
    mockUseInfiniteScroll.data = mockProducts;
    mockUseInfiniteScroll.total = 2;

    render(<InfiniteProductList />);

    expect(screen.getByText('Showing 2 of 2 products')).toBeInTheDocument();
    expect(screen.getByTestId('products-grid')).toBeInTheDocument();

    // Check if products are rendered
    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    expect(screen.getByText('Test Product 2')).toBeInTheDocument();

    // Check product details
    expect(screen.getByText('$29.99')).toBeInTheDocument();
    expect(screen.getByText('$49.99')).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('Clothing')).toBeInTheDocument();
  });

  it('should display product stock status correctly', () => {
    mockUseInfiniteScroll.data = mockProducts;

    render(<InfiniteProductList />);

    const stockStatuses = screen.getAllByTestId('product-stock-status');
    expect(stockStatuses[0]).toHaveTextContent('In Stock');
    expect(stockStatuses[1]).toHaveTextContent('Out of Stock');
  });

  it('should render product tags', () => {
    mockUseInfiniteScroll.data = mockProducts;

    render(<InfiniteProductList />);

    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.getByText('tag2')).toBeInTheDocument();
    expect(screen.getByText('tag3')).toBeInTheDocument();
  });

  it('should show loading spinner when loading', () => {
    mockUseInfiniteScroll.loading = true;

    render(<InfiniteProductList />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    expect(screen.getByText('Loading products...')).toBeInTheDocument();
  });

  it('should show error message when there is an error', () => {
    mockUseInfiniteScroll.error = 'Failed to fetch products';

    render(<InfiniteProductList />);

    expect(screen.getByTestId('error-message')).toBeInTheDocument();
    expect(
      screen.getByText('Error: Failed to fetch products')
    ).toBeInTheDocument();
    expect(screen.getByTestId('retry-button')).toBeInTheDocument();
  });

  it('should call refresh when retry button is clicked', async () => {
    const user = userEvent.setup();
    mockUseInfiniteScroll.error = 'Failed to fetch products';

    render(<InfiniteProductList />);

    const retryButton = screen.getByTestId('retry-button');
    await user.click(retryButton);

    expect(mockUseInfiniteScroll.refresh).toHaveBeenCalled();
  });

  it('should call refresh when refresh button is clicked', async () => {
    const user = userEvent.setup();

    render(<InfiniteProductList />);

    const refreshButton = screen.getByTestId('refresh-button');
    await user.click(refreshButton);

    expect(mockUseInfiniteScroll.refresh).toHaveBeenCalled();
  });

  it('should show load more trigger when hasMore is true', () => {
    mockUseInfiniteScroll.data = mockProducts;
    mockUseInfiniteScroll.hasMore = true;
    mockUseInfiniteScroll.loading = false;

    render(<InfiniteProductList />);

    expect(screen.getByTestId('load-more-trigger')).toBeInTheDocument();
    expect(screen.getByText('Scroll down to load more...')).toBeInTheDocument();
  });

  it('should show end of list message when hasMore is false', () => {
    mockUseInfiniteScroll.data = mockProducts;
    mockUseInfiniteScroll.hasMore = false;

    render(<InfiniteProductList />);

    expect(screen.getByTestId('end-of-list')).toBeInTheDocument();
    expect(
      screen.getByText("You've reached the end of the product list!")
    ).toBeInTheDocument();
  });

  it('should show empty state when no products and not loading', () => {
    mockUseInfiniteScroll.data = [];
    mockUseInfiniteScroll.loading = false;

    render(<InfiniteProductList />);

    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    expect(screen.getByText('No products found')).toBeInTheDocument();
    expect(screen.getByTestId('refresh-empty-button')).toBeInTheDocument();
  });

  it('should render product images when imageUrl is provided', () => {
    mockUseInfiniteScroll.data = mockProducts;

    render(<InfiniteProductList />);

    const productImage = screen.getByTestId('product-image');
    expect(productImage).toBeInTheDocument();
    expect(productImage).toHaveAttribute(
      'src',
      'https://example.com/image1.jpg'
    );
    expect(productImage).toHaveAttribute('alt', 'Test Product 1');
  });

  it('should have proper data attributes for automation testing', () => {
    mockUseInfiniteScroll.data = mockProducts;

    render(<InfiniteProductList />);

    expect(screen.getByTestId('infinite-product-list')).toBeInTheDocument();
    expect(screen.getByTestId('products-grid')).toBeInTheDocument();

    const productCards = screen.getAllByTestId('product-card');
    expect(productCards[0]).toHaveAttribute('data-product-id', '1');
    expect(productCards[1]).toHaveAttribute('data-product-id', '2');
  });

  it('should apply custom className', () => {
    const customClass = 'custom-product-list';

    render(<InfiniteProductList className={customClass} />);

    const listElement = screen.getByTestId('infinite-product-list');
    expect(listElement).toHaveClass(customClass);
  });

  it('should handle search query and category props', () => {
    const searchQuery = 'test search';
    const category = 'Electronics';

    render(
      <InfiniteProductList searchQuery={searchQuery} category={category} />
    );

    // The component should render (props are used internally by the hook)
    expect(screen.getByTestId('infinite-product-list')).toBeInTheDocument();
  });

  it('should not show load more trigger when loading', () => {
    mockUseInfiniteScroll.data = mockProducts;
    mockUseInfiniteScroll.hasMore = true;
    mockUseInfiniteScroll.loading = true;

    render(<InfiniteProductList />);

    expect(screen.queryByTestId('load-more-trigger')).not.toBeInTheDocument();
  });

  it('should format prices correctly', () => {
    const productWithDecimalPrice = {
      ...mockProducts[0],
      price: 123.456,
    };

    mockUseInfiniteScroll.data = [productWithDecimalPrice];

    render(<InfiniteProductList />);

    expect(screen.getByText('$123.46')).toBeInTheDocument();
  });
});
