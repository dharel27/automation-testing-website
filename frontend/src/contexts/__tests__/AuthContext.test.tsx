import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import axios from 'axios';
import { AuthProvider, useAuth } from '../AuthContext';

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

// Test component that uses the auth context
function TestComponent() {
  const { state, login, register, logout } = useAuth();

  return (
    <div>
      <div data-testid="auth-state">
        {state.isAuthenticated ? 'authenticated' : 'not-authenticated'}
      </div>
      <div data-testid="loading-state">
        {state.isLoading ? 'loading' : 'not-loading'}
      </div>
      {state.user && (
        <div data-testid="user-info">
          {state.user.username} - {state.user.email} - {state.user.role}
        </div>
      )}
      <button
        data-testid="login-button"
        onClick={() =>
          login({ email: 'test@example.com', password: 'password123' })
        }
      >
        Login
      </button>
      <button
        data-testid="register-button"
        onClick={() =>
          register({
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
            firstName: 'Test',
            lastName: 'User',
          })
        }
      >
        Register
      </button>
      <button data-testid="logout-button" onClick={logout}>
        Logout
      </button>
    </div>
  );
}

function renderWithProviders(component: React.ReactElement) {
  return render(
    <BrowserRouter>
      <AuthProvider>{component}</AuthProvider>
    </BrowserRouter>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    mockedAxios.defaults = { baseURL: '' } as any;
    mockedAxios.interceptors = {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    } as any;
  });

  it('should provide initial unauthenticated state', () => {
    renderWithProviders(<TestComponent />);

    expect(screen.getByTestId('auth-state')).toHaveTextContent(
      'not-authenticated'
    );
    expect(screen.getByTestId('loading-state')).toHaveTextContent(
      'not-loading'
    );
    expect(screen.queryByTestId('user-info')).not.toBeInTheDocument();
  });

  it('should handle successful login', async () => {
    const user = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      role: 'user' as const,
      profile: { firstName: 'Test', lastName: 'User' },
    };

    mockedAxios.post.mockResolvedValueOnce({
      data: { data: { user, token: 'mock-token' } },
    });

    renderWithProviders(<TestComponent />);

    const loginButton = screen.getByTestId('login-button');
    await act(async () => {
      await userEvent.click(loginButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-state')).toHaveTextContent(
        'authenticated'
      );
    });

    expect(screen.getByTestId('user-info')).toHaveTextContent(
      'testuser - test@example.com - user'
    );
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'auth_token',
      'mock-token'
    );
    expect(mockedAxios.post).toHaveBeenCalledWith('/auth/login', {
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('should handle login failure', async () => {
    mockedAxios.post.mockRejectedValueOnce({
      response: { data: { error: { message: 'Invalid credentials' } } },
    });

    renderWithProviders(<TestComponent />);

    const loginButton = screen.getByTestId('login-button');

    await expect(async () => {
      await act(async () => {
        await userEvent.click(loginButton);
      });
    }).rejects.toEqual({
      response: { data: { error: { message: 'Invalid credentials' } } },
    });

    expect(screen.getByTestId('auth-state')).toHaveTextContent(
      'not-authenticated'
    );
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
  });

  it('should handle successful registration', async () => {
    const user = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      role: 'user' as const,
      profile: { firstName: 'Test', lastName: 'User' },
    };

    mockedAxios.post.mockResolvedValueOnce({
      data: { data: { user, token: 'mock-token' } },
    });

    renderWithProviders(<TestComponent />);

    const registerButton = screen.getByTestId('register-button');
    await act(async () => {
      await userEvent.click(registerButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-state')).toHaveTextContent(
        'authenticated'
      );
    });

    expect(screen.getByTestId('user-info')).toHaveTextContent(
      'testuser - test@example.com - user'
    );
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'auth_token',
      'mock-token'
    );
    expect(mockedAxios.post).toHaveBeenCalledWith('/auth/register', {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
    });
  });

  it('should handle logout', async () => {
    // First login
    const user = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      role: 'user' as const,
      profile: { firstName: 'Test', lastName: 'User' },
    };

    mockedAxios.post.mockResolvedValueOnce({
      data: { data: { user, token: 'mock-token' } },
    });

    renderWithProviders(<TestComponent />);

    const loginButton = screen.getByTestId('login-button');
    await act(async () => {
      await userEvent.click(loginButton);
    });

    await waitFor(() => {
      expect(screen.getByTestId('auth-state')).toHaveTextContent(
        'authenticated'
      );
    });

    // Then logout
    const logoutButton = screen.getByTestId('logout-button');
    await act(async () => {
      await userEvent.click(logoutButton);
    });

    expect(screen.getByTestId('auth-state')).toHaveTextContent(
      'not-authenticated'
    );
    expect(screen.queryByTestId('user-info')).not.toBeInTheDocument();
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
  });

  it('should check for existing token on mount', async () => {
    const user = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      role: 'user' as const,
      profile: { firstName: 'Test', lastName: 'User' },
    };

    localStorageMock.getItem.mockReturnValue('existing-token');
    mockedAxios.get.mockResolvedValueOnce({
      data: { data: { user } },
    });

    renderWithProviders(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('auth-state')).toHaveTextContent(
        'authenticated'
      );
    });

    expect(screen.getByTestId('user-info')).toHaveTextContent(
      'testuser - test@example.com - user'
    );
    expect(mockedAxios.get).toHaveBeenCalledWith('/auth/profile');
  });

  it('should handle token refresh failure', async () => {
    localStorageMock.getItem.mockReturnValue('invalid-token');
    mockedAxios.get.mockRejectedValueOnce(new Error('Token invalid'));

    renderWithProviders(<TestComponent />);

    await waitFor(() => {
      expect(screen.getByTestId('auth-state')).toHaveTextContent(
        'not-authenticated'
      );
    });

    expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
  });

  it('should throw error when useAuth is used outside AuthProvider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleSpy.mockRestore();
  });

  it('should show loading state during authentication', async () => {
    let resolveLogin: (value: any) => void;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });

    mockedAxios.post.mockReturnValueOnce(loginPromise as any);

    renderWithProviders(<TestComponent />);

    const loginButton = screen.getByTestId('login-button');
    await act(async () => {
      await userEvent.click(loginButton);
    });

    expect(screen.getByTestId('loading-state')).toHaveTextContent('loading');

    // Resolve the promise
    await act(async () => {
      resolveLogin!({
        data: {
          data: {
            user: {
              id: '1',
              username: 'testuser',
              email: 'test@example.com',
              role: 'user',
              profile: { firstName: 'Test', lastName: 'User' },
            },
            token: 'mock-token',
          },
        },
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId('loading-state')).toHaveTextContent(
        'not-loading'
      );
    });
  });
});
