import React, { useState, useRef, useCallback } from 'react';
import { usePerformance } from '../../contexts/PerformanceContext';
import { useAsyncPerformanceMonitor } from '../../hooks/usePerformanceMonitor';

interface FileUploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  uploadedFile?: any;
  speed?: number; // bytes per second
  timeRemaining?: number; // seconds
}

interface FileUploadWithProgressProps {
  onUploadComplete?: (files: any[]) => void;
  onUploadError?: (error: string) => void;
  maxFileSize?: number; // in bytes
  maxFiles?: number;
  acceptedTypes?: string[];
  className?: string;
}

export default function FileUploadWithProgress({
  onUploadComplete,
  onUploadError,
  maxFileSize = 50 * 1024 * 1024, // 50MB default
  maxFiles = 10,
  acceptedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
    'text/csv',
    'application/json',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
    'application/x-zip-compressed',
  ],
  className = '',
}: FileUploadWithProgressProps) {
  const [uploadProgress, setUploadProgress] = useState<
    Map<string, FileUploadProgress>
  >(new Map());
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { recordApiCall, recordError } = usePerformance();
  const { measureAsync } = useAsyncPerformanceMonitor();

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatSpeed = (bytesPerSecond: number): string => {
    return formatFileSize(bytesPerSecond) + '/s';
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(maxFileSize)})`;
    }

    if (!acceptedTypes.includes(file.type)) {
      return `File type ${file.type} is not supported`;
    }

    return null;
  };

  const uploadFile = useCallback(
    async (file: File): Promise<any> => {
      const fileId = `${file.name}-${file.size}-${file.lastModified}`;
      const startTime = Date.now();
      let lastProgressTime = startTime;
      let lastProgressBytes = 0;

      // Initialize progress tracking
      setUploadProgress(
        (prev) =>
          new Map(
            prev.set(fileId, {
              file,
              progress: 0,
              status: 'uploading',
              speed: 0,
              timeRemaining: 0,
            })
          )
      );

      try {
        const formData = new FormData();
        formData.append('files', file);

        const result = await measureAsync(`upload-${file.name}`, async () => {
          const response = await fetch('/api/files/upload', {
            method: 'POST',
            body: formData,
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`,
            },
          });

          if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
          }

          // Simulate progress tracking for demonstration
          // In a real implementation, you'd use XMLHttpRequest or a library that supports progress
          const total = file.size;
          const chunks = 20; // Simulate 20 progress updates
          const chunkSize = total / chunks;

          for (let i = 1; i <= chunks; i++) {
            await new Promise((resolve) => setTimeout(resolve, 50)); // Simulate upload time

            const currentTime = Date.now();
            const currentBytes = (i / chunks) * total;
            const progress = (i / chunks) * 100;

            // Calculate speed and time remaining
            const timeDiff = (currentTime - lastProgressTime) / 1000; // seconds
            const bytesDiff = currentBytes - lastProgressBytes;
            const speed = timeDiff > 0 ? bytesDiff / timeDiff : 0;
            const remainingBytes = total - currentBytes;
            const timeRemaining = speed > 0 ? remainingBytes / speed : 0;

            setUploadProgress(
              (prev) =>
                new Map(
                  prev.set(fileId, {
                    file,
                    progress,
                    status: 'uploading',
                    speed,
                    timeRemaining,
                  })
                )
            );

            lastProgressTime = currentTime;
            lastProgressBytes = currentBytes;
          }

          return response.json();
        });

        const endTime = Date.now();
        const duration = endTime - startTime;

        // Record API call metrics
        recordApiCall({
          url: '/api/files/upload',
          method: 'POST',
          duration,
          status: 200,
          timestamp: endTime,
          size: file.size,
        });

        // Update progress to completed
        setUploadProgress(
          (prev) =>
            new Map(
              prev.set(fileId, {
                file,
                progress: 100,
                status: 'completed',
                uploadedFile: result.data.files[0],
                speed: file.size / (duration / 1000), // bytes per second
              })
            )
        );

        return result.data.files[0];
      } catch (error) {
        console.error('Upload error:', error);
        recordError(error as Error, 'file-upload');

        setUploadProgress(
          (prev) =>
            new Map(
              prev.set(fileId, {
                file,
                progress: 0,
                status: 'error',
                error: error instanceof Error ? error.message : 'Upload failed',
              })
            )
        );

        throw error;
      }
    },
    [recordApiCall, recordError, measureAsync]
  );

  const handleFiles = useCallback(
    async (files: FileList) => {
      const fileArray = Array.from(files);

      if (fileArray.length > maxFiles) {
        onUploadError?.(
          `Too many files selected. Maximum ${maxFiles} files allowed.`
        );
        return;
      }

      // Validate all files first
      const validationErrors: string[] = [];
      fileArray.forEach((file) => {
        const error = validateFile(file);
        if (error) {
          validationErrors.push(`${file.name}: ${error}`);
        }
      });

      if (validationErrors.length > 0) {
        onUploadError?.(validationErrors.join('\n'));
        return;
      }

      setIsUploading(true);

      try {
        // Upload files concurrently for better performance
        const uploadPromises = fileArray.map((file) => uploadFile(file));
        const uploadedFiles = await Promise.all(uploadPromises);

        onUploadComplete?.(uploadedFiles);
      } catch (error) {
        onUploadError?.(
          error instanceof Error ? error.message : 'Upload failed'
        );
      } finally {
        setIsUploading(false);
      }
    },
    [maxFiles, uploadFile, onUploadComplete, onUploadError]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFiles(files);
      }
    },
    [handleFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFiles(files);
      }
    },
    [handleFiles]
  );

  const clearProgress = useCallback(() => {
    setUploadProgress(new Map());
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setUploadProgress((prev) => {
      const newMap = new Map(prev);
      newMap.delete(fileId);
      return newMap;
    });
  }, []);

  const progressEntries = Array.from(uploadProgress.entries());
  const hasFiles = progressEntries.length > 0;
  const completedFiles = progressEntries.filter(
    ([, progress]) => progress.status === 'completed'
  );
  const errorFiles = progressEntries.filter(
    ([, progress]) => progress.status === 'error'
  );

  return (
    <div
      className={`w-full ${className}`}
      data-testid="file-upload-with-progress"
    >
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${
            isDragOver
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
        data-testid="file-drop-zone"
      >
        <div className="space-y-4">
          <div className="text-4xl text-gray-400">📁</div>
          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Maximum {maxFiles} files, up to {formatFileSize(maxFileSize)} each
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Supported: Images, Documents, Text files, Archives
            </p>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
        data-testid="file-input"
      />

      {/* Progress Display */}
      {hasFiles && (
        <div className="mt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Upload Progress
            </h3>
            <button
              onClick={clearProgress}
              className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              data-testid="clear-progress-btn"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-3">
            {progressEntries.map(([fileId, progress]) => (
              <div
                key={fileId}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                data-testid={`file-progress-${fileId}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {progress.file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(progress.file.size)}
                      {progress.speed && progress.speed > 0 && (
                        <span className="ml-2">
                          • {formatSpeed(progress.speed)}
                        </span>
                      )}
                      {progress.timeRemaining &&
                        progress.timeRemaining > 0 &&
                        progress.status === 'uploading' && (
                          <span className="ml-2">
                            • {formatTime(progress.timeRemaining)} remaining
                          </span>
                        )}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`
                      text-xs px-2 py-1 rounded-full font-medium
                      ${progress.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : ''}
                      ${progress.status === 'uploading' ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100' : ''}
                      ${progress.status === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100' : ''}
                      ${progress.status === 'pending' ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100' : ''}
                    `}
                    >
                      {progress.status === 'completed' && '✓ Complete'}
                      {progress.status === 'uploading' && '⏳ Uploading'}
                      {progress.status === 'error' && '✗ Error'}
                      {progress.status === 'pending' && '⏸ Pending'}
                    </span>
                    <button
                      onClick={() => removeFile(fileId)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      data-testid={`remove-file-${fileId}`}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      progress.status === 'error'
                        ? 'bg-red-500'
                        : progress.status === 'completed'
                          ? 'bg-green-500'
                          : 'bg-blue-500'
                    }`}
                    style={{ width: `${progress.progress}%` }}
                    data-testid={`progress-bar-${fileId}`}
                  />
                </div>

                {/* Error Message */}
                {progress.error && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    {progress.error}
                  </p>
                )}

                {/* Success Info */}
                {progress.status === 'completed' && progress.uploadedFile && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    File ID: {progress.uploadedFile.id}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {completedFiles.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Completed
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {errorFiles.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Errors
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {progressEntries.length}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
