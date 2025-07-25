import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute, withRoleProtection } from '../ProtectedRoute';
import { AuthProvider } from '../../../contexts/AuthContext';
import axios from 'axios';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Test components
function TestComponent() {
  return <div data-testid="protected-content">Protected Content</div>;
}

function LoginPage() {
  return <div data-testid="login-page">Login Page</div>;
}

function renderWithProviders(
  component: React.ReactElement,
  initialEntries: string[] = ['/protected']
) {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/protected" element={component} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    mockedAxios.defaults = { baseURL: '' } as any;
    mockedAxios.interceptors = {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    } as any;
  });

  it('should show loading spinner while checking authentication', () => {
    // Mock a pending authentication check
    mockedAxios.get.mockImplementation(() => new Promise(() => {}));
    localStorageMock.getItem.mockReturnValue('some-token');

    renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    );

    expect(screen.getByTestId('protected-route-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('should redirect to login when not authenticated', async () => {
    renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  it('should render children when authenticated', async () => {
    const mockUser = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      role: 'user' as const,
      profile: { firstName: 'Test', lastName: 'User' },
    };

    localStorageMock.getItem.mockReturnValue('valid-token');
    mockedAxios.get.mockResolvedValueOnce({
      data: { data: { user: mockUser } },
    });

    renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    );

    await waitFor(() => {
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
  });

  it('should redirect to custom path when specified', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route
              path="/custom-login"
              element={<div data-testid="custom-login">Custom Login</div>}
            />
            <Route
              path="/protected"
              element={
                <ProtectedRoute redirectTo="/custom-login">
                  <TestComponent />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('custom-login')).toBeInTheDocument();
    });
  });

  describe('Role-based access control', () => {
    const mockUsers = {
      guest: {
        id: '1',
        username: 'guest',
        email: 'guest@example.com',
        role: 'guest' as const,
        profile: { firstName: 'Guest', lastName: 'User' },
      },
      user: {
        id: '2',
        username: 'user',
        email: 'user@example.com',
        role: 'user' as const,
        profile: { firstName: 'Regular', lastName: 'User' },
      },
      admin: {
        id: '3',
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin' as const,
        profile: { firstName: 'Admin', lastName: 'User' },
      },
    };

    it('should allow access when user has required role', async () => {
      localStorageMock.getItem.mockReturnValue('valid-token');
      mockedAxios.get.mockResolvedValueOnce({
        data: { data: { user: mockUsers.admin } },
      });

      renderWithProviders(
        <ProtectedRoute requiredRole="admin">
          <TestComponent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });

    it('should deny access when user lacks required role', async () => {
      localStorageMock.getItem.mockReturnValue('valid-token');
      mockedAxios.get.mockResolvedValueOnce({
        data: { data: { user: mockUsers.guest } },
      });

      renderWithProviders(
        <ProtectedRoute requiredRole="admin">
          <TestComponent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('protected-route-unauthorized')
        ).toBeInTheDocument();
      });

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
      expect(screen.getByText('Required role: admin')).toBeInTheDocument();
      expect(screen.getByText('Your current role: guest')).toBeInTheDocument();
    });

    it('should allow user role to access guest-required content', async () => {
      localStorageMock.getItem.mockReturnValue('valid-token');
      mockedAxios.get.mockResolvedValueOnce({
        data: { data: { user: mockUsers.user } },
      });

      renderWithProviders(
        <ProtectedRoute requiredRole="guest">
          <TestComponent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });

    it('should allow admin role to access user-required content', async () => {
      localStorageMock.getItem.mockReturnValue('valid-token');
      mockedAxios.get.mockResolvedValueOnce({
        data: { data: { user: mockUsers.admin } },
      });

      renderWithProviders(
        <ProtectedRoute requiredRole="user">
          <TestComponent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });

    it('should have working go back button on unauthorized page', async () => {
      const mockHistoryBack = vi.fn();
      Object.defineProperty(window, 'history', {
        value: { back: mockHistoryBack },
        writable: true,
      });

      localStorageMock.getItem.mockReturnValue('valid-token');
      mockedAxios.get.mockResolvedValueOnce({
        data: { data: { user: mockUsers.guest } },
      });

      renderWithProviders(
        <ProtectedRoute requiredRole="admin">
          <TestComponent />
        </ProtectedRoute>
      );

      await waitFor(() => {
        expect(
          screen.getByTestId('protected-route-unauthorized')
        ).toBeInTheDocument();
      });

      const goBackButton = screen.getByTestId('go-back-button');
      await userEvent.click(goBackButton);

      expect(mockHistoryBack).toHaveBeenCalled();
    });
  });

  describe('withRoleProtection HOC', () => {
    it('should create a protected component with role requirement', async () => {
      const ProtectedTestComponent = withRoleProtection(TestComponent, 'admin');

      const mockUser = {
        id: '1',
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin' as const,
        profile: { firstName: 'Admin', lastName: 'User' },
      };

      localStorageMock.getItem.mockReturnValue('valid-token');
      mockedAxios.get.mockResolvedValueOnce({
        data: { data: { user: mockUser } },
      });

      renderWithProviders(<ProtectedTestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });

    it('should deny access when using HOC with insufficient role', async () => {
      const ProtectedTestComponent = withRoleProtection(TestComponent, 'admin');

      const mockUser = {
        id: '1',
        username: 'user',
        email: 'user@example.com',
        role: 'user' as const,
        profile: { firstName: 'Regular', lastName: 'User' },
      };

      localStorageMock.getItem.mockReturnValue('valid-token');
      mockedAxios.get.mockResolvedValueOnce({
        data: { data: { user: mockUser } },
      });

      renderWithProviders(<ProtectedTestComponent />);

      await waitFor(() => {
        expect(
          screen.getByTestId('protected-route-unauthorized')
        ).toBeInTheDocument();
      });
    });

    it('should work without role requirement', async () => {
      const ProtectedTestComponent = withRoleProtection(TestComponent);

      const mockUser = {
        id: '1',
        username: 'user',
        email: 'user@example.com',
        role: 'user' as const,
        profile: { firstName: 'Regular', lastName: 'User' },
      };

      localStorageMock.getItem.mockReturnValue('valid-token');
      mockedAxios.get.mockResolvedValueOnce({
        data: { data: { user: mockUser } },
      });

      renderWithProviders(<ProtectedTestComponent />);

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });
  });
});
