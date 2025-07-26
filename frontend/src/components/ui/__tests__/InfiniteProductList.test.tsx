import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import axios from 'axios';
import InfiniteProductList from '../InfiniteProductList';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock the useInfiniteScroll hook
const mockUseInfiniteScroll = {
  data: [],
  loading: false,
  error: null,
  hasMore: true,
  loadMore: jest.fn(),
  reset: jest.fn(),
  total: 0,
  page: 1,
};

jest.mock('../../hooks/useInfiniteScroll', () => ({
  useInfiniteScroll: jest.fn(() => mockUseInfiniteScroll),
  useInfiniteScrollSentinel: jest.fn(() => ({
    sentinelRef: { current: null },
    SentinelComponent: () => <div data-testid="infinite-scroll-sentinel" />,
  })),
}));

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
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Test Product 2',
    description: 'Another test product',
    price: 49.99,
    category: 'Clothing',
    inStock: false,
    tags: ['tag3', 'tag4', 'tag5', 'tag6'], // More than 3 tags to test truncation
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

describe('InfiniteProductList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock hook state
    Object.assign(mockUseInfiniteScroll, {
      data: [],
      loading: false,
      error: null,
      hasMore: true,
      total: 0,
      page: 1,
    });
  });

  it('should render empty state when no products', () => {
    render(<InfiniteProductList />);

    expect(screen.getByTestId('infinite-product-list')).toBeInTheDocument();
    expect(screen.getByTestId('no-results')).toBeInTheDocument();
    expect(screen.getByText('No products found')).toBeInTheDocument();
  });

  it('should render products correctly', () => {
    mockUseInfiniteScroll.data = mockProducts;
    mockUseInfiniteScroll.total = 2;

    render(<InfiniteProductList />);

    expect(screen.getByTestId('results-summary')).toHaveTextContent(
      'Showing 2 of 2 products'
    );
    expect(screen.getByTestId('product-card-0')).toBeInTheDocument();
    expect(screen.getByTestId('product-card-1')).toBeInTheDocument();

    // Check product details
    expect(screen.getByText('Test Product 1')).toBeInTheDocument();
    expect(screen.getByText('Test Product 2')).toBeInTheDocument();
    expect(screen.getByText('$29.99')).toBeInTheDocument();
    expect(screen.getByText('$49.99')).toBeInTheDocument();
  });

  it('should show loading indicator when loading', () => {
    mockUseInfiniteScroll.loading = true;
    mockUseInfiniteScroll.data = mockProducts;

    render(<InfiniteProductList />);

    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    expect(screen.getByText('Loading more products...')).toBeInTheDocument();
  });

  it('should show error state and retry button', () => {
    mockUseInfiniteScroll.error = 'Failed to load products';

    render(<InfiniteProductList />);

    expect(screen.getByTestId('product-list-error')).toBeInTheDocument();
    expect(screen.getByText('Error Loading Products')).toBeInTheDocument();
    expect(screen.getByText('Failed to load products')).toBeInTheDocument();

    const retryButton = screen.getByTestId('retry-button');
    expect(retryButton).toBeInTheDocument();

    fireEvent.click(retryButton);
    expect(mockUseInfiniteScroll.reset).toHaveBeenCalled();
  });

  it('should show "no more results" when hasMore is false', () => {
    mockUseInfiniteScroll.data = mockProducts;
    mockUseInfiniteScroll.hasMore = false;

    render(<InfiniteProductList />);

    expect(screen.getByTestId('no-more-results')).toBeInTheDocument();
    expect(
      screen.getByText("You've reached the end of the product list.")
    ).toBeInTheDocument();
  });

  it('should display product stock status correctly', () => {
    mockUseInfiniteScroll.data = mockProducts;

    render(<InfiniteProductList />);

    expect(screen.getByText('In Stock')).toBeInTheDocument();
    expect(screen.getByText('Out of Stock')).toBeInTheDocument();
  });

  it('should handle add to cart button states', () => {
    mockUseInfiniteScroll.data = mockProducts;

    render(<InfiniteProductList />);

    const buttons = screen.getAllByTestId('add-to-cart-button');

    // First product is in stock
    expect(buttons[0]).toHaveTextContent('Add to Cart');
    expect(buttons[0]).not.toBeDisabled();

    // Second product is out of stock
    expect(buttons[1]).toHaveTextContent('Out of Stock');
    expect(buttons[1]).toBeDisabled();
  });

  it('should display product tags correctly', () => {
    mockUseInfiniteScroll.data = mockProducts;

    render(<InfiniteProductList />);

    // First product has 2 tags
    const firstProductTags = screen.getAllByTestId('product-tags')[0];
    expect(firstProductTags).toHaveTextContent('tag1');
    expect(firstProductTags).toHaveTextContent('tag2');

    // Second product has more than 3 tags, should show truncation
    const secondProductTags = screen.getAllByTestId('product-tags')[1];
    expect(secondProductTags).toHaveTextContent('tag3');
    expect(secondProductTags).toHaveTextContent('tag4');
    expect(secondProductTags).toHaveTextContent('tag5');
    expect(secondProductTags).toHaveTextContent('+1 more');
  });

  it('should format prices correctly', () => {
    mockUseInfiniteScroll.data = mockProducts;

    render(<InfiniteProductList />);

    expect(screen.getByText('$29.99')).toBeInTheDocument();
    expect(screen.getByText('$49.99')).toBeInTheDocument();
  });

  it('should show search query in results summary', () => {
    mockUseInfiniteScroll.data = mockProducts;
    mockUseInfiniteScroll.total = 2;

    render(<InfiniteProductList searchQuery="test" />);

    expect(screen.getByTestId('results-summary')).toHaveTextContent(
      'Showing 2 of 2 products for "test"'
    );
  });

  it('should show category in results summary', () => {
    mockUseInfiniteScroll.data = mockProducts;
    mockUseInfiniteScroll.total = 2;

    render(<InfiniteProductList category="Electronics" />);

    expect(screen.getByTestId('results-summary')).toHaveTextContent(
      'Showing 2 of 2 products in Electronics'
    );
  });

  it('should show both search query and category in results summary', () => {
    mockUseInfiniteScroll.data = mockProducts;
    mockUseInfiniteScroll.total = 2;

    render(<InfiniteProductList searchQuery="test" category="Electronics" />);

    expect(screen.getByTestId('results-summary')).toHaveTextContent(
      'Showing 2 of 2 products for "test" in Electronics'
    );
  });

  it('should render infinite scroll sentinel', () => {
    render(<InfiniteProductList />);

    expect(screen.getByTestId('infinite-scroll-sentinel')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const customClass = 'custom-test-class';
    render(<InfiniteProductList className={customClass} />);

    expect(screen.getByTestId('infinite-product-list')).toHaveClass(
      customClass
    );
  });

  it('should show placeholder image when imageUrl is not provided', () => {
    const productWithoutImage = {
      ...mockProducts[0],
      imageUrl: undefined,
    };

    mockUseInfiniteScroll.data = [productWithoutImage];

    render(<InfiniteProductList />);

    const productCard = screen.getByTestId('product-card-0');
    const placeholderIcon = productCard.querySelector('svg');
    expect(placeholderIcon).toBeInTheDocument();
  });

  it('should show actual image when imageUrl is provided', () => {
    mockUseInfiniteScroll.data = [mockProducts[0]];

    render(<InfiniteProductList />);

    const productCard = screen.getByTestId('product-card-0');
    const image = productCard.querySelector('img');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', mockProducts[0].imageUrl);
    expect(image).toHaveAttribute('alt', mockProducts[0].name);
  });

  it('should call reset when search query changes', () => {
    const { rerender } = render(<InfiniteProductList searchQuery="initial" />);

    rerender(<InfiniteProductList searchQuery="changed" />);

    expect(mockUseInfiniteScroll.reset).toHaveBeenCalled();
  });

  it('should call reset when category changes', () => {
    const { rerender } = render(<InfiniteProductList category="Electronics" />);

    rerender(<InfiniteProductList category="Clothing" />);

    expect(mockUseInfiniteScroll.reset).toHaveBeenCalled();
  });

  it('should show appropriate no results message for search', () => {
    mockUseInfiniteScroll.data = [];

    render(<InfiniteProductList searchQuery="nonexistent" />);

    expect(screen.getByTestId('no-results')).toBeInTheDocument();
    expect(
      screen.getByText('Try adjusting your search criteria.')
    ).toBeInTheDocument();
  });

  it('should show appropriate no results message for category filter', () => {
    mockUseInfiniteScroll.data = [];

    render(<InfiniteProductList category="NonexistentCategory" />);

    expect(screen.getByTestId('no-results')).toBeInTheDocument();
    expect(
      screen.getByText('Try adjusting your search criteria.')
    ).toBeInTheDocument();
  });
});
