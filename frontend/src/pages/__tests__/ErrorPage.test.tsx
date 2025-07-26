import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ErrorPage from '../ErrorPage';

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockLocation = {
  pathname: '/test-path',
  search: '?param=value',
};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(<MemoryRouter>{component}</MemoryRouter>);
};

describe('ErrorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.history.length
    Object.defineProperty(window, 'history', {
      value: { length: 2 },
      writable: true,
    });
  });

  it('renders default 404 error page', () => {
    renderWithRouter(<ErrorPage />);

    expect(screen.getByTestId('error-page')).toBeInTheDocument();
    expect(screen.getByTestId('error-status-code')).toHaveTextContent('404');
    expect(screen.getByTestId('error-title')).toHaveTextContent(
      'Page Not Found'
    );
    expect(screen.getByTestId('error-message')).toHaveTextContent(
      "The page you're looking for doesn't exist or has been moved."
    );
  });

  it('renders custom error page with provided props', () => {
    renderWithRouter(
      <ErrorPage
        statusCode={500}
        title="Custom Error"
        message="Custom error message"
        showRetry={false}
      />
    );

    expect(screen.getByTestId('error-status-code')).toHaveTextContent('500');
    expect(screen.getByTestId('error-title')).toHaveTextContent('Custom Error');
    expect(screen.getByTestId('error-message')).toHaveTextContent(
      'Custom error message'
    );
    expect(screen.queryByTestId('retry-button')).not.toBeInTheDocument();
  });

  it('renders different error types correctly', () => {
    const testCases = [
      { code: 403, expectedTitle: 'Access Forbidden' },
      { code: 401, expectedTitle: 'Unauthorized' },
      { code: 503, expectedTitle: 'Service Unavailable' },
      { code: 999, expectedTitle: 'Error' }, // Default case
    ];

    testCases.forEach(({ code, expectedTitle }) => {
      const { unmount } = renderWithRouter(<ErrorPage statusCode={code} />);
      expect(screen.getByTestId('error-title')).toHaveTextContent(
        expectedTitle
      );
      unmount();
    });
  });

  it('handles go home button click', () => {
    renderWithRouter(<ErrorPage />);

    const goHomeButton = screen.getByTestId('go-home-button');
    fireEvent.click(goHomeButton);

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('handles go back button click with history', () => {
    renderWithRouter(<ErrorPage />);

    const goBackButton = screen.getByTestId('go-back-button');
    fireEvent.click(goBackButton);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('handles go back button click without history', () => {
    Object.defineProperty(window, 'history', {
      value: { length: 1 },
      writable: true,
    });

    renderWithRouter(<ErrorPage />);

    const goBackButton = screen.getByTestId('go-back-button');
    fireEvent.click(goBackButton);

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('handles retry button click', () => {
    const mockReload = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true,
    });

    renderWithRouter(<ErrorPage showRetry={true} />);

    const retryButton = screen.getByTestId('retry-button');
    fireEvent.click(retryButton);

    expect(mockReload).toHaveBeenCalled();
  });

  it('shows debug information in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    renderWithRouter(<ErrorPage />);

    expect(screen.getByTestId('debug-pathname')).toHaveTextContent(
      '/test-path'
    );
    expect(screen.getByTestId('debug-search')).toHaveTextContent(
      '?param=value'
    );
    expect(screen.getByTestId('debug-timestamp')).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('hides debug information in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    renderWithRouter(<ErrorPage />);

    expect(screen.queryByTestId('debug-pathname')).not.toBeInTheDocument();
    expect(screen.queryByTestId('debug-search')).not.toBeInTheDocument();
    expect(screen.queryByTestId('debug-timestamp')).not.toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('has proper accessibility attributes', () => {
    renderWithRouter(<ErrorPage />);

    const errorPage = screen.getByTestId('error-page');
    expect(errorPage).toHaveAttribute('role', 'main');
    expect(errorPage).toHaveAttribute('aria-labelledby', 'error-title');

    const goHomeButton = screen.getByTestId('go-home-button');
    expect(goHomeButton).toHaveAttribute('aria-label', 'Go to home page');

    const goBackButton = screen.getByTestId('go-back-button');
    expect(goBackButton).toHaveAttribute(
      'aria-label',
      'Go back to previous page'
    );
  });

  it('shows retry button by default', () => {
    renderWithRouter(<ErrorPage />);
    expect(screen.getByTestId('retry-button')).toBeInTheDocument();
  });

  it('hides retry button when showRetry is false', () => {
    renderWithRouter(<ErrorPage showRetry={false} />);
    expect(screen.queryByTestId('retry-button')).not.toBeInTheDocument();
  });
});
