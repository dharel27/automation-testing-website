import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ApiRequestBuilder } from '../ApiRequestBuilder';

describe('ApiRequestBuilder', () => {
  const mockOnRequest = vi.fn();

  beforeEach(() => {
    mockOnRequest.mockClear();
  });

  it('renders request builder form', () => {
    render(<ApiRequestBuilder onRequest={mockOnRequest} loading={false} />);

    expect(screen.getByTestId('api-request-builder')).toBeInTheDocument();
    expect(screen.getByTestId('method-select')).toBeInTheDocument();
    expect(screen.getByTestId('url-input')).toBeInTheDocument();
    expect(screen.getByTestId('headers-textarea')).toBeInTheDocument();
    expect(screen.getByTestId('send-request-button')).toBeInTheDocument();
  });

  it('renders preset endpoint buttons', () => {
    render(<ApiRequestBuilder onRequest={mockOnRequest} loading={false} />);

    expect(screen.getByTestId('preset-health-check')).toBeInTheDocument();
    expect(screen.getByTestId('preset-get-users')).toBeInTheDocument();
    expect(screen.getByTestId('preset-test-echo')).toBeInTheDocument();
  });

  it('allows selecting HTTP method', () => {
    render(<ApiRequestBuilder onRequest={mockOnRequest} loading={false} />);

    const methodSelect = screen.getByTestId('method-select');
    fireEvent.change(methodSelect, { target: { value: 'POST' } });

    expect(methodSelect).toHaveValue('POST');
  });

  it('shows request body textarea for POST method', () => {
    render(<ApiRequestBuilder onRequest={mockOnRequest} loading={false} />);

    const methodSelect = screen.getByTestId('method-select');
    fireEvent.change(methodSelect, { target: { value: 'POST' } });

    expect(screen.getByTestId('body-textarea')).toBeInTheDocument();
  });

  it('hides request body textarea for GET method', () => {
    render(<ApiRequestBuilder onRequest={mockOnRequest} loading={false} />);

    const methodSelect = screen.getByTestId('method-select');
    fireEvent.change(methodSelect, { target: { value: 'GET' } });

    expect(screen.queryByTestId('body-textarea')).not.toBeInTheDocument();
  });

  it('calls onRequest when form is submitted with valid data', () => {
    render(<ApiRequestBuilder onRequest={mockOnRequest} loading={false} />);

    const urlInput = screen.getByTestId('url-input');
    fireEvent.change(urlInput, { target: { value: '/api/test' } });

    const sendButton = screen.getByTestId('send-request-button');
    fireEvent.click(sendButton);

    expect(mockOnRequest).toHaveBeenCalledWith(
      'GET',
      'http://localhost:3001/api/test',
      { 'Content-Type': 'application/json' },
      ''
    );
  });

  it('handles full URLs correctly', () => {
    render(<ApiRequestBuilder onRequest={mockOnRequest} loading={false} />);

    const urlInput = screen.getByTestId('url-input');
    fireEvent.change(urlInput, {
      target: { value: 'https://api.example.com/test' },
    });

    const sendButton = screen.getByTestId('send-request-button');
    fireEvent.click(sendButton);

    expect(mockOnRequest).toHaveBeenCalledWith(
      'GET',
      'https://api.example.com/test',
      { 'Content-Type': 'application/json' },
      ''
    );
  });

  it('validates JSON headers before submission', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<ApiRequestBuilder onRequest={mockOnRequest} loading={false} />);

    const headersTextarea = screen.getByTestId('headers-textarea');
    fireEvent.change(headersTextarea, { target: { value: 'invalid json' } });

    const sendButton = screen.getByTestId('send-request-button');
    fireEvent.click(sendButton);

    expect(alertSpy).toHaveBeenCalledWith('Invalid JSON in headers');
    expect(mockOnRequest).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  it('validates JSON body for POST requests', () => {
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    render(<ApiRequestBuilder onRequest={mockOnRequest} loading={false} />);

    const methodSelect = screen.getByTestId('method-select');
    fireEvent.change(methodSelect, { target: { value: 'POST' } });

    const bodyTextarea = screen.getByTestId('body-textarea');
    fireEvent.change(bodyTextarea, { target: { value: 'invalid json' } });

    const sendButton = screen.getByTestId('send-request-button');
    fireEvent.click(sendButton);

    expect(alertSpy).toHaveBeenCalledWith('Invalid JSON in request body');
    expect(mockOnRequest).not.toHaveBeenCalled();

    alertSpy.mockRestore();
  });

  it('applies preset endpoint configuration when clicked', () => {
    render(<ApiRequestBuilder onRequest={mockOnRequest} loading={false} />);

    const echoPreset = screen.getByTestId('preset-test-echo');
    fireEvent.click(echoPreset);

    expect(screen.getByTestId('method-select')).toHaveValue('POST');
    expect(screen.getByTestId('url-input')).toHaveValue('/api/test/echo');
    expect(screen.getByTestId('body-textarea')).toBeInTheDocument();
  });

  it('formats JSON when format button is clicked', () => {
    render(<ApiRequestBuilder onRequest={mockOnRequest} loading={false} />);

    const headersTextarea = screen.getByTestId('headers-textarea');
    fireEvent.change(headersTextarea, {
      target: { value: '{"test":"value"}' },
    });

    const formatButton = screen.getByText('Format JSON');
    fireEvent.click(formatButton);

    expect(headersTextarea).toHaveValue('{\n  "test": "value"\n}');
  });

  it('shows loading state when loading prop is true', () => {
    render(<ApiRequestBuilder onRequest={mockOnRequest} loading={true} />);

    const sendButton = screen.getByTestId('send-request-button');
    expect(sendButton).toBeDisabled();
    expect(screen.getByText('Sending...')).toBeInTheDocument();
  });

  it('includes request body in POST request', () => {
    render(<ApiRequestBuilder onRequest={mockOnRequest} loading={false} />);

    const methodSelect = screen.getByTestId('method-select');
    fireEvent.change(methodSelect, { target: { value: 'POST' } });

    const bodyTextarea = screen.getByTestId('body-textarea');
    fireEvent.change(bodyTextarea, {
      target: { value: '{"message": "test"}' },
    });

    const sendButton = screen.getByTestId('send-request-button');
    fireEvent.click(sendButton);

    expect(mockOnRequest).toHaveBeenCalledWith(
      'POST',
      'http://localhost:3001/api/health',
      { 'Content-Type': 'application/json' },
      '{"message": "test"}'
    );
  });

  it('includes custom headers in request', () => {
    render(<ApiRequestBuilder onRequest={mockOnRequest} loading={false} />);

    const headersTextarea = screen.getByTestId('headers-textarea');
    fireEvent.change(headersTextarea, {
      target: {
        value: '{"Authorization": "Bearer token123", "X-Custom": "value"}',
      },
    });

    const sendButton = screen.getByTestId('send-request-button');
    fireEvent.click(sendButton);

    expect(mockOnRequest).toHaveBeenCalledWith(
      'GET',
      'http://localhost:3001/api/health',
      {
        Authorization: 'Bearer token123',
        'X-Custom': 'value',
      },
      ''
    );
  });

  it('handles all HTTP methods', () => {
    const methods = [
      'GET',
      'POST',
      'PUT',
      'DELETE',
      'PATCH',
      'HEAD',
      'OPTIONS',
    ];

    methods.forEach((method) => {
      const { unmount } = render(
        <ApiRequestBuilder onRequest={mockOnRequest} loading={false} />
      );

      const methodSelect = screen.getByTestId('method-select');
      fireEvent.change(methodSelect, { target: { value: method } });

      expect(methodSelect).toHaveValue(method);

      unmount();
    });
  });
});
