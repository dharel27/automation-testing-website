import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import NotFoundPage from '../NotFoundPage';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/non-existent', search: '' }),
  };
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(<MemoryRouter>{component}</MemoryRouter>);
};

describe('NotFoundPage', () => {
  it('renders 404 error page with correct content', () => {
    renderWithRouter(<NotFoundPage />);

    expect(screen.getByTestId('error-page')).toBeInTheDocument();
    expect(screen.getByTestId('error-status-code')).toHaveTextContent('404');
    expect(screen.getByTestId('error-title')).toHaveTextContent(
      'Page Not Found'
    );
    expect(screen.getByTestId('error-message')).toHaveTextContent(
      "The page you're looking for doesn't exist or has been moved. Please check the URL and try again."
    );
  });

  it('does not show retry button', () => {
    renderWithRouter(<NotFoundPage />);
    expect(screen.queryByTestId('retry-button')).not.toBeInTheDocument();
  });

  it('shows go home and go back buttons', () => {
    renderWithRouter(<NotFoundPage />);
    expect(screen.getByTestId('go-home-button')).toBeInTheDocument();
    expect(screen.getByTestId('go-back-button')).toBeInTheDocument();
  });
});
