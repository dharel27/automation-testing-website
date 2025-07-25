import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import HomePage from '../HomePage';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock the home components
vi.mock('../components/home/SearchBar', () => ({
  default: ({ onSearch, placeholder }: any) => (
    <div data-testid="search-bar-mock">
      <input
        data-testid="search-input-mock"
        placeholder={placeholder}
        onChange={(e) => onSearch(e.target.value)}
      />
    </div>
  ),
}));

vi.mock('../components/home/BannerSection', () => ({
  default: ({ delay, className }: any) => (
    <div data-testid="banner-section-mock" className={className}>
      Banner with delay: {delay}
    </div>
  ),
}));

vi.mock('../components/home/FeatureCard', () => ({
  default: ({ featureType, delay }: any) => (
    <div data-testid={`feature-card-${featureType}-mock`}>
      Feature: {featureType}, Delay: {delay}
    </div>
  ),
}));

vi.mock('../components/home/StatsSection', () => ({
  default: () => <div data-testid="stats-section-mock">Stats Section</div>,
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock setTimeout to control timing in tests
vi.useFakeTimers();

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('renders the home page with all sections', () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        status: 'OK',
        message: 'Backend is healthy',
        timestamp: new Date().toISOString(),
      },
    });

    renderWithRouter(<HomePage />);

    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    expect(screen.getByTestId('banner-section')).toBeInTheDocument();
    expect(screen.getByTestId('features-section')).toBeInTheDocument();
    expect(screen.getByTestId('stats-section')).toBeInTheDocument();
    expect(screen.getByTestId('system-status-section')).toBeInTheDocument();
    expect(screen.getByTestId('tech-stack-section')).toBeInTheDocument();
  });

  it('displays the main heading and description', () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        status: 'OK',
        message: 'Backend is healthy',
        timestamp: new Date().toISOString(),
      },
    });

    renderWithRouter(<HomePage />);

    expect(screen.getByText('Automation Testing Website')).toBeInTheDocument();
    expect(
      screen.getByText(
        /A comprehensive platform for testing automation frameworks/
      )
    ).toBeInTheDocument();
  });

  it('renders search bar with correct placeholder', () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        status: 'OK',
        message: 'Backend is healthy',
        timestamp: new Date().toISOString(),
      },
    });

    renderWithRouter(<HomePage />);

    expect(screen.getByTestId('search-bar-mock')).toBeInTheDocument();
    const searchInput = screen.getByTestId('search-input-mock');
    expect(searchInput).toHaveAttribute(
      'placeholder',
      'Search products, users, or explore features...'
    );
  });

  it('handles search functionality', () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        status: 'OK',
        message: 'Backend is healthy',
        timestamp: new Date().toISOString(),
      },
    });

    renderWithRouter(<HomePage />);

    const searchInput = screen.getByTestId('search-input-mock');
    fireEvent.change(searchInput, { target: { value: 'test query' } });

    expect(mockNavigate).toHaveBeenCalledWith(
      '/data-table?search=test%20query'
    );
  });

  it('renders CTA buttons with correct links', () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        status: 'OK',
        message: 'Backend is healthy',
        timestamp: new Date().toISOString(),
      },
    });

    renderWithRouter(<HomePage />);

    const startTestingButton = screen.getByTestId('cta-start-testing');
    const exploreApiButton = screen.getByTestId('cta-explore-api');

    expect(startTestingButton).toHaveAttribute('href', '/forms');
    expect(startTestingButton).toHaveTextContent('Start Testing');

    expect(exploreApiButton).toHaveAttribute('href', '/api-testing');
    expect(exploreApiButton).toHaveTextContent('Explore APIs');
  });

  it('renders banner section with delay', () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        status: 'OK',
        message: 'Backend is healthy',
        timestamp: new Date().toISOString(),
      },
    });

    renderWithRouter(<HomePage />);

    const bannerSection = screen.getByTestId('banner-section-mock');
    expect(bannerSection).toHaveTextContent('Banner with delay: 200');
  });

  it('renders all feature cards with correct types and delays', () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        status: 'OK',
        message: 'Backend is healthy',
        timestamp: new Date().toISOString(),
      },
    });

    renderWithRouter(<HomePage />);

    expect(screen.getByTestId('feature-card-forms-mock')).toHaveTextContent(
      'Feature: forms, Delay: 100'
    );
    expect(screen.getByTestId('feature-card-api-mock')).toHaveTextContent(
      'Feature: api, Delay: 200'
    );
    expect(screen.getByTestId('feature-card-data-mock')).toHaveTextContent(
      'Feature: data, Delay: 300'
    );
    expect(screen.getByTestId('feature-card-ui-mock')).toHaveTextContent(
      'Feature: ui, Delay: 400'
    );
  });

  it('renders features section with heading and description', () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        status: 'OK',
        message: 'Backend is healthy',
        timestamp: new Date().toISOString(),
      },
    });

    renderWithRouter(<HomePage />);

    expect(screen.getByText('Testing Features')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Explore our comprehensive testing environment designed for automation engineers'
      )
    ).toBeInTheDocument();
  });

  it('renders stats section', () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        status: 'OK',
        message: 'Backend is healthy',
        timestamp: new Date().toISOString(),
      },
    });

    renderWithRouter(<HomePage />);

    expect(screen.getByTestId('stats-section-mock')).toBeInTheDocument();
  });

  it('shows loading state for system status initially', () => {
    mockedAxios.get.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                data: {
                  status: 'OK',
                  message: 'Backend is healthy',
                  timestamp: new Date().toISOString(),
                },
              }),
            100
          )
        )
    );

    renderWithRouter(<HomePage />);

    expect(screen.getByTestId('system-status-loading')).toBeInTheDocument();
    expect(
      screen.getByText('Checking backend connection...')
    ).toBeInTheDocument();
  });

  it('displays system status after loading', async () => {
    const mockHealthData = {
      status: 'OK',
      message: 'Backend is healthy',
      timestamp: '2023-01-01T00:00:00.000Z',
    };

    mockedAxios.get.mockResolvedValue({ data: mockHealthData });

    renderWithRouter(<HomePage />);

    vi.advanceTimersByTime(100);

    await waitFor(() => {
      expect(screen.getByTestId('system-status-content')).toBeInTheDocument();
    });

    expect(screen.getByTestId('backend-status')).toHaveTextContent('OK');
    expect(screen.getByTestId('backend-message')).toHaveTextContent(
      'Backend is healthy'
    );
    expect(screen.getByTestId('backend-timestamp')).toBeInTheDocument();
  });

  it('handles backend connection error', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Connection failed'));

    renderWithRouter(<HomePage />);

    vi.advanceTimersByTime(100);

    await waitFor(() => {
      expect(screen.getByTestId('system-status-content')).toBeInTheDocument();
    });

    expect(screen.getByTestId('backend-status')).toHaveTextContent('ERROR');
    expect(screen.getByTestId('backend-message')).toHaveTextContent(
      'Backend connection failed'
    );
  });

  it('displays technology stack information', () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        status: 'OK',
        message: 'Backend is healthy',
        timestamp: new Date().toISOString(),
      },
    });

    renderWithRouter(<HomePage />);

    expect(screen.getByText('Technology Stack')).toBeInTheDocument();
    expect(
      screen.getByText('React + TypeScript + Vite + Tailwind CSS')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Node.js + Express + TypeScript + SQLite')
    ).toBeInTheDocument();
  });

  it('has proper section structure and spacing', () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        status: 'OK',
        message: 'Backend is healthy',
        timestamp: new Date().toISOString(),
      },
    });

    renderWithRouter(<HomePage />);

    const homePage = screen.getByTestId('home-page');
    expect(homePage).toHaveClass('space-y-12');
  });

  it('has proper responsive design classes', () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        status: 'OK',
        message: 'Backend is healthy',
        timestamp: new Date().toISOString(),
      },
    });

    renderWithRouter(<HomePage />);

    const heading = screen.getByText('Automation Testing Website');
    expect(heading).toHaveClass('text-4xl', 'md:text-5xl');

    const description = screen.getByText(
      /A comprehensive platform for testing automation frameworks/
    );
    expect(description).toHaveClass('text-lg', 'md:text-xl');
  });

  it('has proper CTA button styling', () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        status: 'OK',
        message: 'Backend is healthy',
        timestamp: new Date().toISOString(),
      },
    });

    renderWithRouter(<HomePage />);

    const startTestingButton = screen.getByTestId('cta-start-testing');
    const exploreApiButton = screen.getByTestId('cta-explore-api');

    expect(startTestingButton).toHaveClass(
      'bg-blue-600',
      'hover:bg-blue-700',
      'transform',
      'hover:scale-105'
    );
    expect(exploreApiButton).toHaveClass(
      'bg-transparent',
      'border-2',
      'transform',
      'hover:scale-105'
    );
  });

  it('displays system status with proper styling', async () => {
    const mockHealthData = {
      status: 'OK',
      message: 'Backend is healthy',
      timestamp: '2023-01-01T00:00:00.000Z',
    };

    mockedAxios.get.mockResolvedValue({ data: mockHealthData });

    renderWithRouter(<HomePage />);

    vi.advanceTimersByTime(100);

    await waitFor(() => {
      expect(screen.getByTestId('backend-status')).toBeInTheDocument();
    });

    const statusElement = screen.getByTestId('backend-status');
    expect(statusElement).toHaveClass(
      'bg-green-100',
      'dark:bg-green-900/20',
      'text-green-800',
      'dark:text-green-200'
    );
  });

  it('displays error status with proper styling', async () => {
    mockedAxios.get.mockRejectedValue(new Error('Connection failed'));

    renderWithRouter(<HomePage />);

    vi.advanceTimersByTime(100);

    await waitFor(() => {
      expect(screen.getByTestId('backend-status')).toBeInTheDocument();
    });

    const statusElement = screen.getByTestId('backend-status');
    expect(statusElement).toHaveClass(
      'bg-red-100',
      'dark:bg-red-900/20',
      'text-red-800',
      'dark:text-red-200'
    );
  });

  it('makes API call to health endpoint on mount', () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        status: 'OK',
        message: 'Backend is healthy',
        timestamp: new Date().toISOString(),
      },
    });

    renderWithRouter(<HomePage />);

    expect(mockedAxios.get).toHaveBeenCalledWith(
      'http://localhost:3001/api/health'
    );
  });

  it('handles search with special characters', () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        status: 'OK',
        message: 'Backend is healthy',
        timestamp: new Date().toISOString(),
      },
    });

    renderWithRouter(<HomePage />);

    const searchInput = screen.getByTestId('search-input-mock');
    fireEvent.change(searchInput, { target: { value: 'test & query' } });

    expect(mockNavigate).toHaveBeenCalledWith(
      '/data-table?search=test%20%26%20query'
    );
  });
});
