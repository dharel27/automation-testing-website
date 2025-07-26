import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ServerErrorPage from '../ServerErrorPage';

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/error/500', search: '' }),
  };
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(<MemoryRouter>{component}</MemoryRouter>);
};

describe('ServerErrorPage', () => {
  it('renders 500 error page with correct content', () => {
    renderWithRouter(<ServerErrorPage />);

    expect(screen.getByTestId('error-page')).toBeInTheDocument();
    expect(screen.getByTestId('error-status-code')).toHaveTextContent('500');
    expect(screen.getByTestId('error-title')).toHaveTextContent(
      'Internal Server Error'
    );
    expect(screen.getByTestId('error-message')).toHaveTextContent(
      'Something went wrong on our end. Our team has been notified and is working to fix the issue.'
    );
  });

  it('shows retry button', () => {
    renderWithRouter(<ServerErrorPage />);
    expect(screen.getByTestId('retry-button')).toBeInTheDocument();
  });

  it('shows go home and go back buttons', () => {
    renderWithRouter(<ServerErrorPage />);
    expect(screen.getByTestId('go-home-button')).toBeInTheDocument();
    expect(screen.getByTestId('go-back-button')).toBeInTheDocument();
  });
});
