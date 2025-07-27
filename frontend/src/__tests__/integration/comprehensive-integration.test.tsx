/**
 * Comprehensive Integration Tests
 * Tests the integration between frontend components and backend APIs
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../contexts/AuthContext';
import { NotificationProvider } from '../../contexts/NotificationContext';
import { PerformanceProvider } from '../../contexts/PerformanceContext';
import App from '../../App';

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <AuthProvider>
      <NotificationProvider>
        <PerformanceProvider>{children}</PerformanceProvider>
      </NotificationProvider>
    </AuthProvider>
  </BrowserRouter>
);

describe('Comprehensive Integration Tests', () => {
  beforeEach(() => {
    mockFetch.mockClear();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Authentication Flow Integration', () => {
    it('should complete full authentication flow', async () => {
      const user = userEvent.setup();

      // Mock successful registration
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            user: {
              id: '1',
              username: 'testuser',
              email: 'test@example.com',
              role: 'user',
            },
            token: 'mock-token',
          },
        }),
      });

      render(<App />, { wrapper: TestWrapper });

      // Navigate to registration
      const registerLink = screen.getByText(/register/i);
      await user.click(registerLink);

      // Fill registration form
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.type(
        screen.getByLabelText(/confirm password/i),
        'password123'
      );

      // Submit registration
      const submitButton = screen.getByRole('button', { name: /register/i });
      await user.click(submitButton);

      // Verify API call was made
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/register'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('testuser'),
        })
      );

      // Verify user is redirected and authenticated
      await waitFor(() => {
        expect(localStorage.getItem('token')).toBe('mock-token');
      });
    });

    it('should handle login with existing user', async () => {
      const user = userEvent.setup();

      // Mock successful login
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            user: {
              id: '1',
              username: 'admin',
              email: 'admin@example.com',
              role: 'admin',
            },
            token: 'admin-token',
          },
        }),
      });

      render(<App />, { wrapper: TestWrapper });

      // Navigate to login
      const loginLink = screen.getByText(/login/i);
      await user.click(loginLink);

      // Fill login form
      await user.type(screen.getByLabelText(/email/i), 'admin@example.com');
      await user.type(screen.getByLabelText(/password/i), 'admin123');

      // Submit login
      const submitButton = screen.getByRole('button', { name: /login/i });
      await user.click(submitButton);

      // Verify API call and authentication
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/login'),
        expect.objectContaining({
          method: 'POST',
        })
      );

      await waitFor(() => {
        expect(localStorage.getItem('token')).toBe('admin-token');
      });
    });

    it('should handle logout flow', async () => {
      const user = userEvent.setup();

      // Set up authenticated state
      localStorage.setItem('token', 'test-token');
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: '1',
          username: 'testuser',
          email: 'test@example.com',
        })
      );

      // Mock logout API call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { message: 'Logged out successfully' },
        }),
      });

      render(<App />, { wrapper: TestWrapper });

      // Find and click logout button
      const logoutButton = screen.getByText(/logout/i);
      await user.click(logoutButton);

      // Verify logout API call
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/logout'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );

      // Verify user is logged out
      await waitFor(() => {
        expect(localStorage.getItem('token')).toBeNull();
        expect(localStorage.getItem('user')).toBeNull();
      });
    });
  });

  describe('Data Management Integration', () => {
    beforeEach(() => {
      // Set up authenticated state
      localStorage.setItem('token', 'admin-token');
      localStorage.setItem(
        'user',
        JSON.stringify({
          id: '1',
          username: 'admin',
          email: 'admin@example.com',
          role: 'admin',
        })
      );
    });

    it('should perform CRUD operations on users', async () => {
      const user = userEvent.setup();

      // Mock API responses
      const mockUsers = {
        success: true,
        data: {
          users: [
            {
              id: '1',
              username: 'admin',
              email: 'admin@example.com',
              role: 'admin',
            },
            {
              id: '2',
              username: 'user1',
              email: 'user1@example.com',
              role: 'user',
            },
          ],
          pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
        },
      };

      // Mock GET users
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUsers,
      });

      render(<App />, { wrapper: TestWrapper });

      // Navigate to data table
      const dataTableLink = screen.getByText(/data table/i);
      await user.click(dataTableLink);

      // Wait for users to load
      await waitFor(() => {
        expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      });

      // Test CREATE operation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            user: {
              id: '3',
              username: 'newuser',
              email: 'new@example.com',
              role: 'user',
            },
          },
        }),
      });

      const addButton = screen.getByText(/add user/i);
      await user.click(addButton);

      // Fill form in modal
      await user.type(screen.getByLabelText(/username/i), 'newuser');
      await user.type(screen.getByLabelText(/email/i), 'new@example.com');

      const saveButton = screen.getByText(/save/i);
      await user.click(saveButton);

      // Verify CREATE API call
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/users'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer admin-token',
          }),
        })
      );

      // Test UPDATE operation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            user: {
              id: '2',
              username: 'updateduser',
              email: 'user1@example.com',
              role: 'user',
            },
          },
        }),
      });

      const editButton = screen.getAllByText(/edit/i)[0];
      await user.click(editButton);

      const usernameInput = screen.getByDisplayValue('user1');
      await user.clear(usernameInput);
      await user.type(usernameInput, 'updateduser');

      const updateButton = screen.getByText(/update/i);
      await user.click(updateButton);

      // Verify UPDATE API call
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/users/2'),
        expect.objectContaining({
          method: 'PUT',
        })
      );

      // Test DELETE operation
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { message: 'User deleted successfully' },
        }),
      });

      const deleteButton = screen.getAllByText(/delete/i)[0];
      await user.click(deleteButton);

      // Confirm deletion
      const confirmButton = screen.getByText(/confirm/i);
      await user.click(confirmButton);

      // Verify DELETE API call
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/users/'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    it('should handle search and filtering', async () => {
      const user = userEvent.setup();

      // Mock search results
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            users: [
              {
                id: '1',
                username: 'admin',
                email: 'admin@example.com',
                role: 'admin',
              },
            ],
            pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
          },
        }),
      });

      render(<App />, { wrapper: TestWrapper });

      // Navigate to data table
      const dataTableLink = screen.getByText(/data table/i);
      await user.click(dataTableLink);

      // Perform search
      const searchInput = screen.getByPlaceholderText(/search/i);
      await user.type(searchInput, 'admin');

      // Verify search API call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/users?search=admin'),
          expect.any(Object)
        );
      });
    });
  });

  describe('Form Validation Integration', () => {
    it('should validate forms with backend validation', async () => {
      const user = userEvent.setup();

      // Mock validation error response
      mockFetch.mockRejectedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Email already exists',
            details: {
              email: 'This email is already registered',
            },
          },
        }),
      });

      render(<App />, { wrapper: TestWrapper });

      // Navigate to registration
      const registerLink = screen.getByText(/register/i);
      await user.click(registerLink);

      // Fill form with existing email
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/email/i), 'existing@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');

      const submitButton = screen.getByRole('button', { name: /register/i });
      await user.click(submitButton);

      // Verify error message is displayed
      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
      });
    });

    it('should handle contact form submission', async () => {
      const user = userEvent.setup();

      // Mock successful form submission
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { message: 'Message sent successfully' },
        }),
      });

      render(<App />, { wrapper: TestWrapper });

      // Navigate to forms page
      const formsLink = screen.getByText(/forms/i);
      await user.click(formsLink);

      // Fill contact form
      await user.type(screen.getByLabelText(/name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/message/i), 'Test message');

      const submitButton = screen.getByRole('button', {
        name: /send message/i,
      });
      await user.click(submitButton);

      // Verify API call
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/contact'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('John Doe'),
        })
      );

      // Verify success message
      await waitFor(() => {
        expect(
          screen.getByText(/message sent successfully/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('API Testing Interface Integration', () => {
    beforeEach(() => {
      localStorage.setItem('token', 'admin-token');
    });

    it('should test API endpoints through interface', async () => {
      const user = userEvent.setup();

      // Mock API response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          success: true,
          data: { users: [] },
        }),
      });

      render(<App />, { wrapper: TestWrapper });

      // Navigate to API testing page
      const apiTestingLink = screen.getByText(/api testing/i);
      await user.click(apiTestingLink);

      // Select endpoint
      const endpointSelect = screen.getByLabelText(/endpoint/i);
      await user.selectOptions(endpointSelect, 'GET /api/users');

      // Send request
      const sendButton = screen.getByText(/send request/i);
      await user.click(sendButton);

      // Verify API call was made
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/users'),
        expect.objectContaining({
          method: 'GET',
        })
      );

      // Verify response is displayed
      await waitFor(() => {
        expect(screen.getByText(/200/)).toBeInTheDocument();
        expect(screen.getByText(/success/i)).toBeInTheDocument();
      });
    });

    it('should handle API error responses', async () => {
      const user = userEvent.setup();

      // Mock error response
      mockFetch.mockRejectedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({
          success: false,
          error: { message: 'Internal server error' },
        }),
      });

      render(<App />, { wrapper: TestWrapper });

      // Navigate to API testing page
      const apiTestingLink = screen.getByText(/api testing/i);
      await user.click(apiTestingLink);

      // Select error endpoint
      const endpointSelect = screen.getByLabelText(/endpoint/i);
      await user.selectOptions(endpointSelect, 'GET /api/test/error/500');

      // Send request
      const sendButton = screen.getByText(/send request/i);
      await user.click(sendButton);

      // Verify error response is displayed
      await waitFor(() => {
        expect(screen.getByText(/500/)).toBeInTheDocument();
        expect(screen.getByText(/internal server error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Performance Integration', () => {
    it('should handle large dataset loading', async () => {
      const user = userEvent.setup();

      // Mock large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i.toString(),
        name: `Item ${i}`,
        value: Math.random() * 100,
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { items: largeDataset },
        }),
      });

      render(<App />, { wrapper: TestWrapper });

      // Navigate to performance test page
      const performanceLink = screen.getByText(/performance/i);
      await user.click(performanceLink);

      // Load large dataset
      const loadButton = screen.getByText(/load large dataset/i);
      await user.click(loadButton);

      // Verify loading state
      expect(screen.getByText(/loading/i)).toBeInTheDocument();

      // Wait for data to load
      await waitFor(
        () => {
          expect(screen.getByText(/1000 items loaded/i)).toBeInTheDocument();
        },
        { timeout: 10000 }
      );

      // Verify performance metrics are displayed
      expect(screen.getByText(/load time/i)).toBeInTheDocument();
    });

    it('should handle file upload with progress', async () => {
      const user = userEvent.setup();

      // Mock file upload response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          data: { fileId: 'test-file-id', url: '/uploads/test-file.txt' },
        }),
      });

      render(<App />, { wrapper: TestWrapper });

      // Navigate to performance test page
      const performanceLink = screen.getByText(/performance/i);
      await user.click(performanceLink);

      // Create test file
      const file = new File(['test content'], 'test.txt', {
        type: 'text/plain',
      });

      // Upload file
      const fileInput = screen.getByLabelText(/upload file/i);
      await user.upload(fileInput, file);

      // Verify upload progress
      await waitFor(() => {
        expect(screen.getByText(/uploading/i)).toBeInTheDocument();
      });

      // Verify upload completion
      await waitFor(() => {
        expect(screen.getByText(/upload complete/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();

      // Mock network error
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<App />, { wrapper: TestWrapper });

      // Navigate to login
      const loginLink = screen.getByText(/login/i);
      await user.click(loginLink);

      // Attempt login
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password');

      const submitButton = screen.getByRole('button', { name: /login/i });
      await user.click(submitButton);

      // Verify error message is displayed
      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('should handle 404 errors', async () => {
      // Mock 404 response
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          error: { message: 'Not found' },
        }),
      });

      render(<App />, { wrapper: TestWrapper });

      // Navigate to non-existent page
      window.history.pushState({}, '', '/non-existent-page');

      // Verify 404 page is displayed
      await waitFor(() => {
        expect(screen.getByText(/page not found/i)).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Features Integration', () => {
    it('should handle WebSocket connections for real-time updates', async () => {
      // Mock WebSocket
      const mockWebSocket = {
        send: vi.fn(),
        close: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        readyState: WebSocket.OPEN,
      };

      global.WebSocket = vi.fn(() => mockWebSocket) as any;

      render(<App />, { wrapper: TestWrapper });

      // Navigate to real-time page
      const realTimeLink = screen.getByText(/real time/i);
      await user.click(realTimeLink);

      // Verify WebSocket connection is established
      expect(global.WebSocket).toHaveBeenCalledWith(
        expect.stringContaining('ws://')
      );

      // Simulate real-time message
      const messageHandler = mockWebSocket.addEventListener.mock.calls.find(
        (call) => call[0] === 'message'
      )?.[1];

      if (messageHandler) {
        messageHandler({
          data: JSON.stringify({
            type: 'notification',
            data: { message: 'Real-time update' },
          }),
        });
      }

      // Verify real-time update is displayed
      await waitFor(() => {
        expect(screen.getByText(/real-time update/i)).toBeInTheDocument();
      });
    });
  });
});
