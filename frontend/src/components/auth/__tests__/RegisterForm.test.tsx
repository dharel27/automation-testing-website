import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { RegisterForm } from '../RegisterForm';
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

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
    mockedAxios.defaults = { baseURL: '' } as any;
    mockedAxios.interceptors = {
      request: { use: vi.fn(), eject: vi.fn() },
      response: { use: vi.fn(), eject: vi.fn() },
    } as any;
  });

  it('should render registration form with all required fields', () => {
    renderWithProviders(<RegisterForm />);

    expect(screen.getByTestId('register-form')).toBeInTheDocument();
    expect(screen.getByTestId('username-input')).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('firstName-input')).toBeInTheDocument();
    expect(screen.getByTestId('lastName-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('confirmPassword-input')).toBeInTheDocument();
    expect(screen.getByTestId('terms-checkbox')).toBeInTheDocument();
    expect(screen.getByTestId('register-submit')).toBeInTheDocument();
  });

  it('should show validation errors for empty required fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    const submitButton = screen.getByTestId('register-submit');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('username-error')).toHaveTextContent(
        'Username is required'
      );
      expect(screen.getByTestId('email-error')).toHaveTextContent(
        'Email is required'
      );
      expect(screen.getByTestId('firstName-error')).toHaveTextContent(
        'First name is required'
      );
      expect(screen.getByTestId('lastName-error')).toHaveTextContent(
        'Last name is required'
      );
      expect(screen.getByTestId('password-error')).toHaveTextContent(
        'Password is required'
      );
      expect(screen.getByTestId('confirmPassword-error')).toHaveTextContent(
        'Please confirm your password'
      );
      expect(screen.getByTestId('terms-error')).toHaveTextContent(
        'You must accept the terms and conditions'
      );
    });
  });

  it('should validate username format', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    const usernameInput = screen.getByTestId('username-input');
    const submitButton = screen.getByTestId('register-submit');

    // Test short username
    await user.type(usernameInput, 'ab');
    await user.click(submitButton);
    await waitFor(() => {
      expect(screen.getByTestId('username-error')).toHaveTextContent(
        'Username must be at least 3 characters long'
      );
    });

    // Test invalid characters
    await user.clear(usernameInput);
    await user.type(usernameInput, 'user@name');
    await user.click(submitButton);
    await waitFor(() => {
      expect(screen.getByTestId('username-error')).toHaveTextContent(
        'Username can only contain letters, numbers, and underscores'
      );
    });
  });

  it('should validate email format', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    const emailInput = screen.getByTestId('email-input');
    const submitButton = screen.getByTestId('register-submit');

    await user.type(emailInput, 'invalid-email');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('email-error')).toHaveTextContent(
        'Please enter a valid email address'
      );
    });
  });

  it('should validate password complexity', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    const passwordInput = screen.getByTestId('password-input');
    const submitButton = screen.getByTestId('register-submit');

    // Test short password
    await user.type(passwordInput, '123');
    await user.click(submitButton);
    await waitFor(() => {
      expect(screen.getByTestId('password-error')).toHaveTextContent(
        'Password must be at least 8 characters long'
      );
    });

    // Test password without uppercase
    await user.clear(passwordInput);
    await user.type(passwordInput, 'password123!');
    await user.click(submitButton);
    await waitFor(() => {
      expect(screen.getByTestId('password-error')).toHaveTextContent(
        'Password must contain at least one uppercase letter'
      );
    });

    // Test password without lowercase
    await user.clear(passwordInput);
    await user.type(passwordInput, 'PASSWORD123!');
    await user.click(submitButton);
    await waitFor(() => {
      expect(screen.getByTestId('password-error')).toHaveTextContent(
        'Password must contain at least one lowercase letter'
      );
    });

    // Test password without number
    await user.clear(passwordInput);
    await user.type(passwordInput, 'Password!');
    await user.click(submitButton);
    await waitFor(() => {
      expect(screen.getByTestId('password-error')).toHaveTextContent(
        'Password must contain at least one number'
      );
    });

    // Test password without special character
    await user.clear(passwordInput);
    await user.type(passwordInput, 'Password123');
    await user.click(submitButton);
    await waitFor(() => {
      expect(screen.getByTestId('password-error')).toHaveTextContent(
        'Password must contain at least one special character (@$!%*?&)'
      );
    });
  });

  it('should validate password confirmation', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    const passwordInput = screen.getByTestId('password-input');
    const confirmPasswordInput = screen.getByTestId('confirmPassword-input');
    const submitButton = screen.getByTestId('register-submit');

    await user.type(passwordInput, 'Password123!');
    await user.type(confirmPasswordInput, 'DifferentPassword123!');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('confirmPassword-error')).toHaveTextContent(
        'Passwords do not match'
      );
    });
  });

  it('should validate name fields', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    const firstNameInput = screen.getByTestId('firstName-input');
    const submitButton = screen.getByTestId('register-submit');

    // Test short name
    await user.type(firstNameInput, 'A');
    await user.click(submitButton);
    await waitFor(() => {
      expect(screen.getByTestId('firstName-error')).toHaveTextContent(
        'First name must be at least 2 characters long'
      );
    });

    // Test invalid characters
    await user.clear(firstNameInput);
    await user.type(firstNameInput, 'John123');
    await user.click(submitButton);
    await waitFor(() => {
      expect(screen.getByTestId('firstName-error')).toHaveTextContent(
        'First name can only contain letters, spaces, hyphens, and apostrophes'
      );
    });
  });

  it('should toggle password visibility', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    const passwordInput = screen.getByTestId(
      'password-input'
    ) as HTMLInputElement;
    const confirmPasswordInput = screen.getByTestId(
      'confirmPassword-input'
    ) as HTMLInputElement;
    const togglePasswordButton = screen.getByTestId('toggle-password');
    const toggleConfirmPasswordButton = screen.getByTestId(
      'toggle-confirm-password'
    );

    expect(passwordInput.type).toBe('password');
    expect(confirmPasswordInput.type).toBe('password');

    await user.click(togglePasswordButton);
    expect(passwordInput.type).toBe('text');

    await user.click(toggleConfirmPasswordButton);
    expect(confirmPasswordInput.type).toBe('text');
  });

  it('should clear field errors when user starts typing', async () => {
    const user = userEvent.setup();
    renderWithProviders(<RegisterForm />);

    const usernameInput = screen.getByTestId('username-input');
    const submitButton = screen.getByTestId('register-submit');

    // Trigger validation error
    await user.click(submitButton);
    await waitFor(() => {
      expect(screen.getByTestId('username-error')).toBeInTheDocument();
    });

    // Start typing to clear error
    await user.type(usernameInput, 'test');
    expect(screen.queryByTestId('username-error')).not.toBeInTheDocument();
  });

  it('should handle successful registration', async () => {
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

    renderWithProviders(<RegisterForm onSuccess={onSuccess} />);

    // Fill out the form
    await user.type(screen.getByTestId('username-input'), 'testuser');
    await user.type(screen.getByTestId('email-input'), 'test@example.com');
    await user.type(screen.getByTestId('firstName-input'), 'Test');
    await user.type(screen.getByTestId('lastName-input'), 'User');
    await user.type(screen.getByTestId('password-input'), 'Password123!');
    await user.type(
      screen.getByTestId('confirmPassword-input'),
      'Password123!'
    );
    await user.click(screen.getByTestId('terms-checkbox'));

    const submitButton = screen.getByTestId('register-submit');
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalled();
    });

    expect(mockedAxios.post).toHaveBeenCalledWith('/auth/register', {
      username: 'testuser',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      password: 'Password123!',
    });
  });

  it('should handle registration failure', async () => {
    const user = userEvent.setup();
    mockedAxios.post.mockRejectedValueOnce({
      response: { data: { error: { message: 'Email already exists' } } },
    });

    renderWithProviders(<RegisterForm />);

    // Fill out the form with valid data
    await user.type(screen.getByTestId('username-input'), 'testuser');
    await user.type(screen.getByTestId('email-input'), 'test@example.com');
    await user.type(screen.getByTestId('firstName-input'), 'Test');
    await user.type(screen.getByTestId('lastName-input'), 'User');
    await user.type(screen.getByTestId('password-input'), 'Password123!');
    await user.type(
      screen.getByTestId('confirmPassword-input'),
      'Password123!'
    );
    await user.click(screen.getByTestId('terms-checkbox'));

    const submitButton = screen.getByTestId('register-submit');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByTestId('register-error')).toHaveTextContent(
        'Email already exists'
      );
    });
  });

  it('should show loading state during registration', async () => {
    const user = userEvent.setup();
    let resolveRegister: (value: any) => void;
    const registerPromise = new Promise((resolve) => {
      resolveRegister = resolve;
    });

    mockedAxios.post.mockReturnValueOnce(registerPromise as any);

    renderWithProviders(<RegisterForm />);

    // Fill out the form
    await user.type(screen.getByTestId('username-input'), 'testuser');
    await user.type(screen.getByTestId('email-input'), 'test@example.com');
    await user.type(screen.getByTestId('firstName-input'), 'Test');
    await user.type(screen.getByTestId('lastName-input'), 'User');
    await user.type(screen.getByTestId('password-input'), 'Password123!');
    await user.type(
      screen.getByTestId('confirmPassword-input'),
      'Password123!'
    );
    await user.click(screen.getByTestId('terms-checkbox'));

    const submitButton = screen.getByTestId('register-submit');
    await user.click(submitButton);

    expect(submitButton).toHaveTextContent('Creating Account...');
    expect(submitButton).toBeDisabled();

    // Resolve the promise
    resolveRegister!({
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
      expect(submitButton).toHaveTextContent('Create Account');
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('should call onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    renderWithProviders(<RegisterForm onCancel={onCancel} />);

    const cancelButton = screen.getByTestId('register-cancel');
    await user.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it('should not show cancel button when onCancel is not provided', () => {
    renderWithProviders(<RegisterForm />);

    expect(screen.queryByTestId('register-cancel')).not.toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    renderWithProviders(<RegisterForm />);

    const usernameInput = screen.getByTestId('username-input');
    const emailInput = screen.getByTestId('email-input');
    const passwordInput = screen.getByTestId('password-input');

    expect(usernameInput).toHaveAttribute('aria-invalid', 'false');
    expect(emailInput).toHaveAttribute('aria-invalid', 'false');
    expect(passwordInput).toHaveAttribute('aria-invalid', 'false');

    // Check for proper labeling
    expect(screen.getByLabelText('Username *')).toBe(usernameInput);
    expect(screen.getByLabelText('Email Address *')).toBe(emailInput);
    expect(screen.getByLabelText('Password *')).toBe(passwordInput);
  });

  it('should show password help text', () => {
    renderWithProviders(<RegisterForm />);

    expect(
      screen.getByText(
        'Must be 8+ characters with uppercase, lowercase, number, and special character'
      )
    ).toBeInTheDocument();
  });

  it('should have links to terms and privacy policy', () => {
    renderWithProviders(<RegisterForm />);

    expect(screen.getByTestId('terms-link')).toBeInTheDocument();
    expect(screen.getByTestId('privacy-link')).toBeInTheDocument();
  });
});
