import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import ApiTestingPage from '../ApiTestingPage';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ApiTestingPage', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it('renders API testing interface', () => {
    renderWithRouter(<ApiTestingPage />);

    expect(screen.getByText('API Testing Interface')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Test API endpoints with custom requests and view detailed responses'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('API Documentation')).toBeInTheDocument();
    expect(screen.getByText('Request Builder')).toBeInTheDocument();
  });

  it('displays API endpoints documentation', () => {
    renderWithRouter(<ApiTestingPage />);

    // Check for some key endpoints
    expect(screen.getByText('/api/health')).toBeInTheDocument();
    expect(screen.getByText('/api/users')).toBeInTheDocument();
    expect(screen.getByText('/api/test/delay/:ms')).toBeInTheDocument();
  });

  it('allows selecting HTTP method', () => {
    renderWithRouter(<ApiTestingPage />);

    const methodSelect = screen.getByTestId('method-select');
    expect(methodSelect).toBeInTheDocument();

    fireEvent.change(methodSelect, { target: { value: 'POST' } });
    expect(methodSelect).toHaveValue('POST');
  });

  it('allows entering URL', () => {
    renderWithRouter(<ApiTestingPage />);

    const urlInput = screen.getByTestId('url-input');
    expect(urlInput).toBeInTheDocument();

    fireEvent.change(urlInput, { target: { value: '/api/test/echo' } });
    expect(urlInput).toHaveValue('/api/test/echo');
  });

  it('allows editing headers', () => {
    renderWithRouter(<ApiTestingPage />);

    const headersTextarea = screen.getByTestId('headers-textarea');
    expect(headersTextarea).toBeInTheDocument();

    const newHeaders = '{"Authorization": "Bearer token123"}';
    fireEvent.change(headersTextarea, { target: { value: newHeaders } });
    expect(headersTextarea).toHaveValue(newHeaders);
  });

  it('shows request body textarea for POST requests', () => {
    renderWithRouter(<ApiTestingPage />);

    const methodSelect = screen.getByTestId('method-select');
    fireEvent.change(methodSelect, { target: { value: 'POST' } });

    expect(screen.getByTestId('body-textarea')).toBeInTheDocument();
  });

  it('hides request body textarea for GET requests', () => {
    renderWithRouter(<ApiTestingPage />);

    const methodSelect = screen.getByTestId('method-select');
    fireEvent.change(methodSelect, { target: { value: 'GET' } });

    expect(screen.queryByTestId('body-textarea')).not.toBeInTheDocument();
  });

  it('sends API request when form is submitted', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi
        .fn()
        .mockResolvedValue({ success: true, data: { message: 'Hello' } }),
    };

    mockFetch.mockResolvedValueOnce(mockResponse);

    renderWithRouter(<ApiTestingPage />);

    const sendButton = screen.getByTestId('send-request-button');
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/health',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });
  });

  it('displays loading state during request', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue({ success: true }),
    };

    mockFetch.mockImplementation(
      () =>
        new Promise((resolve) => setTimeout(() => resolve(mockResponse), 100))
    );

    renderWithRouter(<ApiTestingPage />);

    const sendButton = screen.getByTestId('send-request-button');
    fireEvent.click(sendButton);

    expect(screen.getByText('Sending...')).toBeInTheDocument();
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText('Sending...')).not.toBeInTheDocument();
    });
  });

  it('displays response after successful request', async () => {
    const mockResponseData = {
      success: true,
      data: { message: 'Hello, API!' },
    };
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({
        'content-type': 'application/json',
        'x-custom-header': 'test-value',
      }),
      json: vi.fn().mockResolvedValue(mockResponseData),
    };

    mockFetch.mockResolvedValueOnce(mockResponse);

    renderWithRouter(<ApiTestingPage />);

    const sendButton = screen.getByTestId('send-request-button');
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByTestId('api-response-display')).toBeInTheDocument();
      expect(screen.getByTestId('response-status')).toHaveTextContent('200');
      expect(screen.getByText('OK')).toBeInTheDocument();
    });

    // Check response body
    const responseBody = screen.getByTestId('response-body');
    expect(responseBody).toHaveTextContent(
      JSON.stringify(mockResponseData, null, 2)
    );
  });

  it('displays error response for failed request', async () => {
    const mockErrorResponse = {
      ok: false,
      status: 404,
      statusText: 'Not Found',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Resource not found' },
      }),
    };

    mockFetch.mockResolvedValueOnce(mockErrorResponse);

    renderWithRouter(<ApiTestingPage />);

    const urlInput = screen.getByTestId('url-input');
    fireEvent.change(urlInput, { target: { value: '/api/nonexistent' } });

    const sendButton = screen.getByTestId('send-request-button');
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByTestId('response-status')).toHaveTextContent('404');
      expect(screen.getByText('Not Found')).toBeInTheDocument();
    });
  });

  it('displays network error for failed fetch', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    renderWithRouter(<ApiTestingPage />);

    const sendButton = screen.getByTestId('send-request-button');
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByTestId('response-status')).toHaveTextContent('0');
      expect(screen.getAllByText('Network Error')[0]).toBeInTheDocument();
      expect(screen.getByTestId('error-message')).toHaveTextContent(
        'Network error'
      );
    });
  });

  it('validates JSON in headers before sending request', () => {
    renderWithRouter(<ApiTestingPage />);

    const headersTextarea = screen.getByTestId('headers-textarea');
    fireEvent.change(headersTextarea, { target: { value: 'invalid json' } });

    // Mock alert
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    const sendButton = screen.getByTestId('send-request-button');
    fireEvent.click(sendButton);

    expect(alertSpy).toHaveBeenCalledWith('Invalid JSON in headers');
    expect(mockFetch).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  it('validates JSON in request body for POST requests', () => {
    renderWithRouter(<ApiTestingPage />);

    const methodSelect = screen.getByTestId('method-select');
    fireEvent.change(methodSelect, { target: { value: 'POST' } });

    const bodyTextarea = screen.getByTestId('body-textarea');
    fireEvent.change(bodyTextarea, { target: { value: 'invalid json' } });

    // Mock alert
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    const sendButton = screen.getByTestId('send-request-button');
    fireEvent.click(sendButton);

    expect(alertSpy).toHaveBeenCalledWith('Invalid JSON in request body');
    expect(mockFetch).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  it('uses preset endpoints when clicked', () => {
    renderWithRouter(<ApiTestingPage />);

    const healthCheckPreset = screen.getByTestId('preset-get-health-check');
    fireEvent.click(healthCheckPreset);

    expect(screen.getByTestId('method-select')).toHaveValue('GET');
    expect(screen.getByTestId('url-input')).toHaveValue('/api/health');
  });

  it('expands endpoint documentation when clicked', () => {
    renderWithRouter(<ApiTestingPage />);

    const healthEndpoint = screen.getByTestId('endpoint-get--api-health');
    fireEvent.click(healthEndpoint);

    // Should show expanded documentation
    expect(screen.getByText('Responses')).toBeInTheDocument();
    expect(screen.getByText('API is healthy')).toBeInTheDocument();
  });

  it('allows copying response data', async () => {
    const mockResponseData = { success: true, data: { message: 'Hello' } };
    const mockResponse = {
      ok: true,
      status: 200,
      statusText: 'OK',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: vi.fn().mockResolvedValue(mockResponseData),
    };

    mockFetch.mockResolvedValueOnce(mockResponse);

    // Mock clipboard API
    const mockWriteText = vi.fn();
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    });

    renderWithRouter(<ApiTestingPage />);

    const sendButton = screen.getByTestId('send-request-button');
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByTestId('copy-response-button')).toBeInTheDocument();
    });

    const copyButton = screen.getByTestId('copy-response-button');
    fireEvent.click(copyButton);

    expect(mockWriteText).toHaveBeenCalledWith(
      JSON.stringify(mockResponseData, null, 2)
    );
  });
});
