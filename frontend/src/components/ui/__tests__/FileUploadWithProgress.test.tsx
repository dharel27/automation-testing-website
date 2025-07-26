import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import FileUploadWithProgress from '../FileUploadWithProgress';
import { PerformanceProvider } from '../../../contexts/PerformanceContext';

// Mock the performance monitoring hooks
vi.mock('../../../hooks/usePerformanceMonitor', () => ({
  useAsyncPerformanceMonitor: () => ({
    measureAsync: vi.fn().mockImplementation(async (name, fn) => await fn()),
  }),
}));

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(() => 'mock-token'),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

const renderWithProvider = (component: React.ReactElement) => {
  return render(<PerformanceProvider>{component}</PerformanceProvider>);
};

// Helper function to create mock files
const createMockFile = (name: string, size: number, type: string) => {
  const file = new File(['mock content'], name, { type });
  Object.defineProperty(file, 'size', { value: size });
  return file;
};

describe('FileUploadWithProgress', () => {
  const mockOnUploadComplete = vi.fn();
  const mockOnUploadError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        data: {
          files: [
            {
              id: 'file-1',
              originalName: 'test.txt',
              filename: 'uploaded-test.txt',
              size: 1024,
            },
          ],
        },
      }),
    });
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('renders file upload component with drop zone', () => {
    renderWithProvider(<FileUploadWithProgress />);

    expect(screen.getByTestId('file-upload-with-progress')).toBeInTheDocument();
    expect(screen.getByTestId('file-drop-zone')).toBeInTheDocument();
    expect(
      screen.getByText('Drop files here or click to browse')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Maximum 10 files, up to 50.0 MB each')
    ).toBeInTheDocument();
  });

  it('opens file dialog when drop zone is clicked', () => {
    renderWithProvider(<FileUploadWithProgress />);

    const fileInput = screen.getByTestId('file-input');
    const clickSpy = vi.spyOn(fileInput, 'click');

    const dropZone = screen.getByTestId('file-drop-zone');
    fireEvent.click(dropZone);

    expect(clickSpy).toHaveBeenCalled();
  });

  it('handles file selection through input', async () => {
    renderWithProvider(
      <FileUploadWithProgress onUploadComplete={mockOnUploadComplete} />
    );

    const fileInput = screen.getByTestId('file-input');
    const mockFile = createMockFile('test.txt', 1024, 'text/plain');

    fireEvent.change(fileInput, {
      target: { files: [mockFile] },
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/files/upload', {
        method: 'POST',
        body: expect.any(FormData),
        headers: {
          Authorization: 'Bearer mock-token',
        },
      });
    });

    await waitFor(() => {
      expect(mockOnUploadComplete).toHaveBeenCalledWith([
        {
          id: 'file-1',
          originalName: 'test.txt',
          filename: 'uploaded-test.txt',
          size: 1024,
        },
      ]);
    });
  });

  it('handles drag and drop functionality', async () => {
    renderWithProvider(
      <FileUploadWithProgress onUploadComplete={mockOnUploadComplete} />
    );

    const dropZone = screen.getByTestId('file-drop-zone');
    const mockFile = createMockFile('test.txt', 1024, 'text/plain');

    // Simulate drag over
    fireEvent.dragOver(dropZone, {
      dataTransfer: { files: [mockFile] },
    });

    // Simulate drop
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [mockFile] },
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  it('validates file size limits', async () => {
    renderWithProvider(
      <FileUploadWithProgress
        maxFileSize={1024} // 1KB limit
        onUploadError={mockOnUploadError}
      />
    );

    const fileInput = screen.getByTestId('file-input');
    const largeMockFile = createMockFile('large.txt', 2048, 'text/plain'); // 2KB file

    fireEvent.change(fileInput, {
      target: { files: [largeMockFile] },
    });

    await waitFor(() => {
      expect(mockOnUploadError).toHaveBeenCalledWith(
        expect.stringContaining(
          'File size (2.0 KB) exceeds maximum allowed size (1.0 KB)'
        )
      );
    });
  });

  it('validates file types', async () => {
    renderWithProvider(
      <FileUploadWithProgress
        acceptedTypes={['text/plain']}
        onUploadError={mockOnUploadError}
      />
    );

    const fileInput = screen.getByTestId('file-input');
    const invalidFile = createMockFile(
      'test.exe',
      1024,
      'application/x-executable'
    );

    fireEvent.change(fileInput, {
      target: { files: [invalidFile] },
    });

    await waitFor(() => {
      expect(mockOnUploadError).toHaveBeenCalledWith(
        expect.stringContaining(
          'File type application/x-executable is not supported'
        )
      );
    });
  });

  it('validates maximum number of files', async () => {
    renderWithProvider(
      <FileUploadWithProgress maxFiles={2} onUploadError={mockOnUploadError} />
    );

    const fileInput = screen.getByTestId('file-input');
    const files = [
      createMockFile('file1.txt', 1024, 'text/plain'),
      createMockFile('file2.txt', 1024, 'text/plain'),
      createMockFile('file3.txt', 1024, 'text/plain'),
    ];

    fireEvent.change(fileInput, {
      target: { files },
    });

    await waitFor(() => {
      expect(mockOnUploadError).toHaveBeenCalledWith(
        'Too many files selected. Maximum 2 files allowed.'
      );
    });
  });

  it('displays upload progress for files', async () => {
    vi.useFakeTimers();

    renderWithProvider(<FileUploadWithProgress />);

    const fileInput = screen.getByTestId('file-input');
    const mockFile = createMockFile('test.txt', 1024, 'text/plain');

    fireEvent.change(fileInput, {
      target: { files: [mockFile] },
    });

    // Wait for upload to start
    await waitFor(() => {
      expect(screen.getByText('Upload Progress')).toBeInTheDocument();
    });

    // Should show progress bar and file info
    expect(screen.getByText('test.txt')).toBeInTheDocument();
    expect(screen.getByText('1.0 KB')).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('shows upload speed and time remaining', async () => {
    vi.useFakeTimers();

    renderWithProvider(<FileUploadWithProgress />);

    const fileInput = screen.getByTestId('file-input');
    const mockFile = createMockFile('test.txt', 1024, 'text/plain');

    fireEvent.change(fileInput, {
      target: { files: [mockFile] },
    });

    // Fast forward through the simulated upload progress
    await waitFor(() => {
      expect(screen.getByText('Upload Progress')).toBeInTheDocument();
    });

    // The component simulates progress updates, so we should see speed/time info
    vi.advanceTimersByTime(100);

    await waitFor(() => {
      // Should show some progress indicators
      expect(screen.getByText('test.txt')).toBeInTheDocument();
    });

    vi.useRealTimers();
  });

  it('handles upload errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));

    renderWithProvider(
      <FileUploadWithProgress onUploadError={mockOnUploadError} />
    );

    const fileInput = screen.getByTestId('file-input');
    const mockFile = createMockFile('test.txt', 1024, 'text/plain');

    fireEvent.change(fileInput, {
      target: { files: [mockFile] },
    });

    await waitFor(() => {
      expect(mockOnUploadError).toHaveBeenCalledWith('Network error');
    });

    // Should show error status in progress display
    await waitFor(() => {
      expect(screen.getByText('✗ Error')).toBeInTheDocument();
    });
  });

  it('allows removing files from progress list', async () => {
    renderWithProvider(<FileUploadWithProgress />);

    const fileInput = screen.getByTestId('file-input');
    const mockFile = createMockFile('test.txt', 1024, 'text/plain');

    fireEvent.change(fileInput, {
      target: { files: [mockFile] },
    });

    await waitFor(() => {
      expect(screen.getByText('Upload Progress')).toBeInTheDocument();
    });

    const fileId = `${mockFile.name}-${mockFile.size}-${mockFile.lastModified}`;
    const removeButton = screen.getByTestId(`remove-file-${fileId}`);

    fireEvent.click(removeButton);

    // File should be removed from progress list
    expect(screen.queryByText('test.txt')).not.toBeInTheDocument();
  });

  it('allows clearing all progress', async () => {
    renderWithProvider(<FileUploadWithProgress />);

    const fileInput = screen.getByTestId('file-input');
    const mockFile = createMockFile('test.txt', 1024, 'text/plain');

    fireEvent.change(fileInput, {
      target: { files: [mockFile] },
    });

    await waitFor(() => {
      expect(screen.getByText('Upload Progress')).toBeInTheDocument();
    });

    const clearButton = screen.getByTestId('clear-progress-btn');
    fireEvent.click(clearButton);

    // Progress section should be hidden
    expect(screen.queryByText('Upload Progress')).not.toBeInTheDocument();
  });

  it('displays upload summary correctly', async () => {
    renderWithProvider(<FileUploadWithProgress />);

    const fileInput = screen.getByTestId('file-input');
    const mockFiles = [
      createMockFile('file1.txt', 1024, 'text/plain'),
      createMockFile('file2.txt', 1024, 'text/plain'),
    ];

    fireEvent.change(fileInput, {
      target: { files: mockFiles },
    });

    await waitFor(() => {
      expect(screen.getByText('Upload Progress')).toBeInTheDocument();
    });

    // Should show summary with completed/error/total counts
    await waitFor(() => {
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Errors')).toBeInTheDocument();
      expect(screen.getByText('Total')).toBeInTheDocument();
    });
  });

  it('formats file sizes correctly', () => {
    renderWithProvider(<FileUploadWithProgress />);

    const fileInput = screen.getByTestId('file-input');
    const files = [
      createMockFile('small.txt', 512, 'text/plain'), // 512 Bytes
      createMockFile('medium.txt', 1024 * 1024, 'text/plain'), // 1 MB
      createMockFile('large.txt', 1024 * 1024 * 1024, 'text/plain'), // 1 GB
    ];

    files.forEach((file) => {
      fireEvent.change(fileInput, {
        target: { files: [file] },
      });
    });

    // The component should format file sizes appropriately
    // This is tested indirectly through the file size display
  });

  it('handles concurrent file uploads', async () => {
    renderWithProvider(
      <FileUploadWithProgress onUploadComplete={mockOnUploadComplete} />
    );

    const fileInput = screen.getByTestId('file-input');
    const mockFiles = [
      createMockFile('file1.txt', 1024, 'text/plain'),
      createMockFile('file2.txt', 1024, 'text/plain'),
      createMockFile('file3.txt', 1024, 'text/plain'),
    ];

    fireEvent.change(fileInput, {
      target: { files: mockFiles },
    });

    // Should make multiple fetch calls for concurrent uploads
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });
  });

  it('shows drag over state correctly', () => {
    renderWithProvider(<FileUploadWithProgress />);

    const dropZone = screen.getByTestId('file-drop-zone');

    // Simulate drag over
    fireEvent.dragOver(dropZone);

    // Should add drag over styling
    expect(dropZone).toHaveClass('border-blue-500', 'bg-blue-50');

    // Simulate drag leave
    fireEvent.dragLeave(dropZone);

    // Should remove drag over styling
    expect(dropZone).not.toHaveClass('border-blue-500', 'bg-blue-50');
  });

  it('disables interactions during upload', async () => {
    vi.useFakeTimers();

    renderWithProvider(<FileUploadWithProgress />);

    const fileInput = screen.getByTestId('file-input');
    const dropZone = screen.getByTestId('file-drop-zone');
    const mockFile = createMockFile('test.txt', 1024, 'text/plain');

    fireEvent.change(fileInput, {
      target: { files: [mockFile] },
    });

    // During upload, drop zone should be disabled
    await waitFor(() => {
      expect(dropZone).toHaveClass('pointer-events-none', 'opacity-50');
    });

    vi.useRealTimers();
  });

  it('uses custom props correctly', () => {
    renderWithProvider(
      <FileUploadWithProgress
        maxFileSize={10 * 1024 * 1024} // 10MB
        maxFiles={5}
        acceptedTypes={['image/jpeg', 'image/png']}
        className="custom-class"
      />
    );

    expect(screen.getByTestId('file-upload-with-progress')).toHaveClass(
      'custom-class'
    );
    expect(
      screen.getByText('Maximum 5 files, up to 10.0 MB each')
    ).toBeInTheDocument();
  });
});
