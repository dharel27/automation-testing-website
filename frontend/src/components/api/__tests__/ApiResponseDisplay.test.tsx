import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { ApiResponseDisplay } from '../ApiResponseDisplay';
import { ApiResponse } from '../../../pages/ApiTestingPage';

describe('ApiResponseDisplay', () => {
  const mockSuccessResponse: ApiResponse = {
    status: 200,
    statusText: 'OK',
    headers: {
      'content-type': 'application/json',
      'x-custom-header': 'test-value',
    },
    data: { success: true, message: 'Hello, API!' },
    duration: 150,
  };

  const mockErrorResponse: ApiResponse = {
    status: 404,
    statusText: 'Not Found',
    headers: {
      'content-type': 'application/json',
    },
    data: {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Resource not found' },
    },
    duration: 75,
  };

  const mockNetworkErrorResponse: ApiResponse = {
    status: 0,
    statusText: 'Network Error',
    headers: {},
    data: null,
    duration: 5000,
    error: 'Failed to fetch',
  };

  it('shows loading indicator when loading is true', () => {
    render(<ApiResponseDisplay response={null} loading={true} />);

    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
    expect(screen.getByText('Sending request...')).toBeInTheDocument();
  });

  it('renders nothing when not loading and no response', () => {
    const { container } = render(
      <ApiResponseDisplay response={null} loading={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('displays successful response correctly', () => {
    render(
      <ApiResponseDisplay response={mockSuccessResponse} loading={false} />
    );

    expect(screen.getByTestId('api-response-display')).toBeInTheDocument();
    expect(screen.getByTestId('response-status')).toHaveTextContent('200');
    expect(screen.getByText('OK')).toBeInTheDocument();
    expect(screen.getByTestId('response-duration')).toHaveTextContent('150ms');
  });

  it('displays error response correctly', () => {
    render(<ApiResponseDisplay response={mockErrorResponse} loading={false} />);

    expect(screen.getByTestId('response-status')).toHaveTextContent('404');
    expect(screen.getByText('Not Found')).toBeInTheDocument();
    expect(screen.getByTestId('response-duration')).toHaveTextContent('75ms');
  });

  it('displays network error correctly', () => {
    render(
      <ApiResponseDisplay response={mockNetworkErrorResponse} loading={false} />
    );

    expect(screen.getByTestId('response-status')).toHaveTextContent('0');
    expect(screen.getByText('Network Error')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByTestId('error-message')).toHaveTextContent(
      'Failed to fetch'
    );
  });

  it('displays response headers', () => {
    render(
      <ApiResponseDisplay response={mockSuccessResponse} loading={false} />
    );

    const responseHeaders = screen.getByTestId('response-headers');
    expect(responseHeaders).toHaveTextContent('content-type: application/json');
    expect(responseHeaders).toHaveTextContent('x-custom-header: test-value');
  });

  it('displays response body with proper formatting', () => {
    render(
      <ApiResponseDisplay response={mockSuccessResponse} loading={false} />
    );

    const responseBody = screen.getByTestId('response-body');
    const expectedBody = JSON.stringify(mockSuccessResponse.data, null, 2);
    expect(responseBody).toHaveTextContent(expectedBody);
  });

  it('handles empty headers gracefully', () => {
    const responseWithNoHeaders: ApiResponse = {
      ...mockSuccessResponse,
      headers: {},
    };

    render(
      <ApiResponseDisplay response={responseWithNoHeaders} loading={false} />
    );

    const responseHeaders = screen.getByTestId('response-headers');
    expect(responseHeaders).toHaveTextContent('No headers');
  });

  it('handles empty response body gracefully', () => {
    const responseWithNoBody: ApiResponse = {
      ...mockSuccessResponse,
      data: null,
    };

    render(
      <ApiResponseDisplay response={responseWithNoBody} loading={false} />
    );

    const responseBody = screen.getByTestId('response-body');
    expect(responseBody).toHaveTextContent('No response body');
  });

  it('copies response to clipboard when copy button is clicked', async () => {
    const mockWriteText = vi.fn();
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    });

    render(
      <ApiResponseDisplay response={mockSuccessResponse} loading={false} />
    );

    const copyButton = screen.getByTestId('copy-response-button');
    fireEvent.click(copyButton);

    const expectedText = JSON.stringify(mockSuccessResponse.data, null, 2);
    expect(mockWriteText).toHaveBeenCalledWith(expectedText);
  });

  it('copies headers to clipboard when copy headers button is clicked', async () => {
    const mockWriteText = vi.fn();
    Object.assign(navigator, {
      clipboard: {
        writeText: mockWriteText,
      },
    });

    render(
      <ApiResponseDisplay response={mockSuccessResponse} loading={false} />
    );

    const copyHeadersButton = screen.getByTestId('copy-headers-button');
    fireEvent.click(copyHeadersButton);

    const expectedText = JSON.stringify(mockSuccessResponse.headers, null, 2);
    expect(mockWriteText).toHaveBeenCalledWith(expectedText);
  });

  it('falls back to document.execCommand for clipboard when navigator.clipboard is not available', async () => {
    // Mock the fallback scenario
    Object.assign(navigator, { clipboard: undefined });

    const mockExecCommand = vi.fn();
    const mockCreateElement = vi.fn().mockReturnValue({
      value: '',
      select: vi.fn(),
    });
    const mockAppendChild = vi.fn();
    const mockRemoveChild = vi.fn();

    Object.assign(document, {
      execCommand: mockExecCommand,
      createElement: mockCreateElement,
      body: {
        appendChild: mockAppendChild,
        removeChild: mockRemoveChild,
      },
    });

    render(
      <ApiResponseDisplay response={mockSuccessResponse} loading={false} />
    );

    const copyButton = screen.getByTestId('copy-response-button');
    fireEvent.click(copyButton);

    expect(mockCreateElement).toHaveBeenCalledWith('textarea');
    expect(mockExecCommand).toHaveBeenCalledWith('copy');
  });

  it('applies correct status color classes', () => {
    // Test different status codes
    const testCases = [
      { status: 200, expectedClass: 'text-green-600' },
      { status: 301, expectedClass: 'text-yellow-600' },
      { status: 404, expectedClass: 'text-red-600' },
      { status: 500, expectedClass: 'text-red-700' },
    ];

    testCases.forEach(({ status, expectedClass }) => {
      const response: ApiResponse = {
        ...mockSuccessResponse,
        status,
      };

      const { rerender } = render(
        <ApiResponseDisplay response={response} loading={false} />
      );

      const statusElement = screen.getByTestId('response-status');
      expect(statusElement).toHaveClass(expectedClass);

      rerender(<ApiResponseDisplay response={null} loading={false} />);
    });
  });

  it('displays response size information', () => {
    render(
      <ApiResponseDisplay response={mockSuccessResponse} loading={false} />
    );

    const responseText = JSON.stringify(mockSuccessResponse.data, null, 2);
    const expectedSize = new Blob([responseText]).size;

    expect(
      screen.getByText(`Response size: ${expectedSize} bytes`)
    ).toBeInTheDocument();
  });

  it('handles non-JSON response data', () => {
    const textResponse: ApiResponse = {
      ...mockSuccessResponse,
      data: 'Plain text response',
    };

    render(<ApiResponseDisplay response={textResponse} loading={false} />);

    const responseBody = screen.getByTestId('response-body');
    expect(responseBody).toHaveTextContent('Plain text response');
  });

  it('formats complex nested JSON correctly', () => {
    const complexResponse: ApiResponse = {
      ...mockSuccessResponse,
      data: {
        users: [
          { id: 1, name: 'John', profile: { age: 30, city: 'New York' } },
          { id: 2, name: 'Jane', profile: { age: 25, city: 'Los Angeles' } },
        ],
        pagination: { page: 1, limit: 10, total: 2 },
      },
    };

    render(<ApiResponseDisplay response={complexResponse} loading={false} />);

    const responseBody = screen.getByTestId('response-body');
    const expectedBody = JSON.stringify(complexResponse.data, null, 2);
    expect(responseBody).toHaveTextContent(expectedBody);
  });
});
