import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import SearchBar from '../SearchBar';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('SearchBar', () => {
  const mockOnSearch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('renders search input with placeholder', () => {
    render(<SearchBar onSearch={mockOnSearch} />);

    const searchInput = screen.getByTestId('search-input');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput).toHaveAttribute(
      'placeholder',
      'Search products, users...'
    );
  });

  it('renders with custom placeholder', () => {
    const customPlaceholder = 'Custom search placeholder';
    render(
      <SearchBar onSearch={mockOnSearch} placeholder={customPlaceholder} />
    );

    const searchInput = screen.getByTestId('search-input');
    expect(searchInput).toHaveAttribute('placeholder', customPlaceholder);
  });

  it('calls onSearch when form is submitted', () => {
    render(<SearchBar onSearch={mockOnSearch} />);

    const searchInput = screen.getByTestId('search-input');
    const submitButton = screen.getByTestId('search-submit-button');

    fireEvent.change(searchInput, { target: { value: 'test query' } });
    fireEvent.click(submitButton);

    expect(mockOnSearch).toHaveBeenCalledWith('test query');
  });

  it('calls onSearch when Enter key is pressed', () => {
    render(<SearchBar onSearch={mockOnSearch} />);

    const searchInput = screen.getByTestId('search-input');

    fireEvent.change(searchInput, { target: { value: 'test query' } });
    fireEvent.keyDown(searchInput, { key: 'Enter' });

    expect(mockOnSearch).toHaveBeenCalledWith('test query');
  });

  it('does not call onSearch with empty query', () => {
    render(<SearchBar onSearch={mockOnSearch} />);

    const searchInput = screen.getByTestId('search-input');
    const submitButton = screen.getByTestId('search-submit-button');

    fireEvent.change(searchInput, { target: { value: '   ' } });
    fireEvent.click(submitButton);

    expect(mockOnSearch).not.toHaveBeenCalled();
  });

  it('shows loading indicator when fetching suggestions', async () => {
    // Mock delayed API response
    mockedAxios.get.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ data: { data: [] } }), 100)
        )
    );

    render(<SearchBar onSearch={mockOnSearch} />);

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(screen.getByTestId('search-loading')).toBeInTheDocument();
    });
  });

  it('fetches and displays suggestions', async () => {
    const mockProducts = [
      { id: '1', name: 'Test Product', category: 'Electronics' },
    ];
    const mockUsers = [
      {
        id: '1',
        username: 'testuser',
        profile: { firstName: 'Test', lastName: 'User' },
      },
    ];

    mockedAxios.get.mockImplementation((url) => {
      if (url.includes('/api/products/search')) {
        return Promise.resolve({ data: { data: mockProducts } });
      }
      if (url.includes('/api/users')) {
        return Promise.resolve({ data: { data: mockUsers } });
      }
      return Promise.resolve({ data: { data: [] } });
    });

    render(<SearchBar onSearch={mockOnSearch} />);

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(screen.getByTestId('search-suggestions')).toBeInTheDocument();
    });

    expect(screen.getByText('Test Product')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('handles keyboard navigation in suggestions', async () => {
    const mockProducts = [
      { id: '1', name: 'Product 1', category: 'Electronics' },
      { id: '2', name: 'Product 2', category: 'Books' },
    ];

    mockedAxios.get.mockImplementation(() =>
      Promise.resolve({ data: { data: mockProducts } })
    );

    render(<SearchBar onSearch={mockOnSearch} />);

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'product' } });

    await waitFor(() => {
      expect(screen.getByTestId('search-suggestions')).toBeInTheDocument();
    });

    // Navigate down
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
    expect(screen.getByTestId('search-suggestion-0')).toHaveClass('bg-blue-50');

    // Navigate down again
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
    expect(screen.getByTestId('search-suggestion-1')).toHaveClass('bg-blue-50');

    // Navigate up
    fireEvent.keyDown(searchInput, { key: 'ArrowUp' });
    expect(screen.getByTestId('search-suggestion-0')).toHaveClass('bg-blue-50');
  });

  it('selects suggestion on Enter key', async () => {
    const mockProducts = [
      { id: '1', name: 'Test Product', category: 'Electronics' },
    ];

    mockedAxios.get.mockImplementation(() =>
      Promise.resolve({ data: { data: mockProducts } })
    );

    render(<SearchBar onSearch={mockOnSearch} />);

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(screen.getByTestId('search-suggestions')).toBeInTheDocument();
    });

    // Navigate to first suggestion and select it
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
    fireEvent.keyDown(searchInput, { key: 'Enter' });

    expect(mockOnSearch).toHaveBeenCalledWith('Test Product');
  });

  it('closes suggestions on Escape key', async () => {
    const mockProducts = [
      { id: '1', name: 'Test Product', category: 'Electronics' },
    ];

    mockedAxios.get.mockImplementation(() =>
      Promise.resolve({ data: { data: mockProducts } })
    );

    render(<SearchBar onSearch={mockOnSearch} />);

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(screen.getByTestId('search-suggestions')).toBeInTheDocument();
    });

    fireEvent.keyDown(searchInput, { key: 'Escape' });

    await waitFor(() => {
      expect(
        screen.queryByTestId('search-suggestions')
      ).not.toBeInTheDocument();
    });
  });

  it('shows no results message when no suggestions found', async () => {
    mockedAxios.get.mockImplementation(() =>
      Promise.resolve({ data: { data: [] } })
    );

    render(<SearchBar onSearch={mockOnSearch} />);

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(screen.getByTestId('search-no-results')).toBeInTheDocument();
    });

    expect(
      screen.getByText('No results found for "nonexistent"')
    ).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    mockedAxios.get.mockRejectedValue(new Error('API Error'));

    render(<SearchBar onSearch={mockOnSearch} />);

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(
        screen.queryByTestId('search-suggestions')
      ).not.toBeInTheDocument();
    });
  });

  it('has proper accessibility attributes', () => {
    render(<SearchBar onSearch={mockOnSearch} />);

    const searchInput = screen.getByTestId('search-input');

    expect(searchInput).toHaveAttribute('role', 'combobox');
    expect(searchInput).toHaveAttribute('aria-label', 'Search');
    expect(searchInput).toHaveAttribute('aria-expanded', 'false');
    expect(searchInput).toHaveAttribute('aria-haspopup', 'listbox');
    expect(searchInput).toHaveAttribute('aria-autocomplete', 'list');
  });

  it('updates accessibility attributes when suggestions are shown', async () => {
    const mockProducts = [
      { id: '1', name: 'Test Product', category: 'Electronics' },
    ];

    mockedAxios.get.mockImplementation(() =>
      Promise.resolve({ data: { data: mockProducts } })
    );

    render(<SearchBar onSearch={mockOnSearch} />);

    const searchInput = screen.getByTestId('search-input');
    fireEvent.change(searchInput, { target: { value: 'test' } });

    await waitFor(() => {
      expect(screen.getByTestId('search-suggestions')).toBeInTheDocument();
    });

    expect(searchInput).toHaveAttribute('aria-expanded', 'true');
  });
});
