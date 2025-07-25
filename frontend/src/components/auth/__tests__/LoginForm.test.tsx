import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { LoginForm } from '../LoginForm';
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

function renderWithProviders(component: React.ReactElement) {
  return render(
    <BrowserRouter>
      <AuthProvider>{component}</AuthProvider>
    </BrowserRouter>
  );
}

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    mockedAxios.defaults = { baseURL: '' } as any;
    mockedAxios.interceptors = {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    } as any;
  });

  it('should render login form with all required fields', () => {
    renderWithProviders(<LoginForm />);

    expect(screen.getByTestId('login-form')).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-submit')).toBeInTheDocument();
    expect(screen.getByTestId('remember-checkbox')).toBeInTheDocument();
    expect(screen.getByTestId('forgot-password-link')).toBeInTheDocument();
  });

  it('should show validation errors for empty fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    const submitButton = screen.getByTestId('login-submit');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('email-error')).toHaveTextContent(
        'Email is required'
      );
      expect(screen.getByTestId('password-error')).toHaveTextContent(
        'Password is required'
      );
    });
  });

  it('should show validation error for invalid email format', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    const emailInput = screen.getByTestId('email-input');
    const submitButton = screen.getByTestId('login-submit');

    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('email-error')).toHaveTextContent(
        'Please enter a valid email address'
      );
    });
  });

  it('should show validation error for short password', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    const passwordInput = screen.getByTestId('password-input');
    const submitButton = screen.getByTestId('login-submit');

    await user.type(passwordInput, '123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('password-error')).toHaveTextContent(
        'Password must be at least 6 characters long'
      );
    });
  });

  it('should clear field errors when user starts typing', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    const emailInput = screen.getByTestId('email-input');
    const submitButton = screen.getByTestId('login-submit');

    // Trigger validation error
    await user.click(submitButton);
    await waitFor(() => {
      expect(screen.getByTestId('email-error')).toBeInTheDocument();
    });

    // Start typing to clear error
    await user.type(emailInput, 'test');
    expect(screen.queryByTestId('email-error')).not.toBeInTheDocument();
  });

  it('should toggle password visibility', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    const passwordInput = screen.getByTestId(
      'password-input'
    ) as HTMLInputElement;
    const toggleButton = screen.getByTestId('toggle-password');

    expect(passwordInput.type).toBe('password');

    await user.click(toggleButton);
    expect(passwordInput.type).toBe('text');

    await user.click(toggleButton);
    expect(passwordInput.type).toBe('password');
  });

  it('should handle successful login', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const mockUser = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      role: 'user' as const,
      profile: { firstName: 'Test', lastName: 'User' },
    };

    mockedAxios.post.mockResolvedValueOnce({
      data: { data: { user: mockUser, token: 'mock-token' } },
    });

    renderWithProviders(<LoginForm onSuccess={onSuccess} />);

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const submitButton = screen.getByTestId('login-submit');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });

    expect(mockedAxios.post).toHaveBeenCalledWith('/auth/login', {
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('should handle login failure', async () => {
    const user = userEvent.setup();
    mockedAxios.post.mockRejectedValueOnce({
      response: { data: { error: { message: 'Invalid credentials' } } },
    });

    renderWithProviders(<LoginForm />);

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const submitButton = screen.getByTestId('login-submit');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'wrongpassword');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('login-error')).toHaveTextContent(
        'Invalid credentials'
      );
    });
  });

  it('should show loading state during login', async () => {
    const user = userEvent.setup();
    let resolveLogin: (value: any) => void;
    const loginPromise = new Promise((resolve) => {
      resolveLogin = resolve;
    });

    mockedAxios.post.mockReturnValueOnce(loginPromise as any);

    renderWithProviders(<LoginForm />);

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const submitButton = screen.getByTestId('login-submit');

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    expect(submitButton).toHaveTextContent('Signing in...');
    expect(submitButton).toBeDisabled();

    // Resolve the promise
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

    await waitFor(() => {
      expect(submitButton).toHaveTextContent('Sign In');
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    renderWithProviders(<LoginForm onCancel={onCancel} />);

    const cancelButton = screen.getByTestId('login-cancel');
    await user.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it('should not show cancel button when onCancel is not provided', () => {
    renderWithProviders(<LoginForm />);

    expect(screen.queryByTestId('login-cancel')).not.toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    renderWithProviders(<LoginForm />);

    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');
    const form = screen.getByTestId('login-form');

    expect(emailInput).toHaveAttribute('aria-invalid', 'false');
    expect(passwordInput).toHaveAttribute('aria-invalid', 'false');
    expect(form).toBeInTheDocument();

    // Check for proper labeling
    expect(screen.getByLabelText('Email Address')).toBe(emailInput);
    expect(screen.getByLabelText('Password')).toBe(passwordInput);
  });

  it('should update aria-invalid when validation fails', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    const emailInput = screen.getByTestId('email-input');
    const submitButton = screen.getByTestId('login-submit');

    await user.click(submitButton);

    await waitFor(() => {
      expect(emailInput).toHaveAttribute('aria-invalid', 'true');
      expect(emailInput).toHaveAttribute('aria-describedby', 'email-error');
    });
  });
});
