import React, { useEffect, useState } from 'react';
import { Notification } from '../../contexts/NotificationContext';

interface ToastProps {
  notification: Notification;
  onClose: (id: string) => void;
  autoClose?: boolean;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({
  notification,
  onClose,
  autoClose = true,
  duration = 5000,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!autoClose) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      setProgress((remaining / duration) * 100);

      if (remaining === 0) {
        setIsVisible(false);
        setTimeout(() => onClose(notification.id), 300);
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [autoClose, duration, notification.id, onClose]);

  const getToastStyles = () => {
    const baseStyles =
      'relative overflow-hidden rounded-lg shadow-lg p-4 mb-3 transition-all duration-300 transform';

    if (!isVisible) {
      return `${baseStyles} translate-x-full opacity-0`;
    }

    switch (notification.type) {
      case 'success':
        return `${baseStyles} bg-green-50 border-l-4 border-green-400 text-green-800`;
      case 'error':
        return `${baseStyles} bg-red-50 border-l-4 border-red-400 text-red-800`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800`;
      case 'info':
      default:
        return `${baseStyles} bg-blue-50 border-l-4 border-blue-400 text-blue-800`;
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return (
          <svg
            className="w-5 h-5 text-green-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'error':
        return (
          <svg
            className="w-5 h-5 text-red-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'warning':
        return (
          <svg
            className="w-5 h-5 text-yellow-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg
            className="w-5 h-5 text-blue-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  const getProgressBarColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-400';
      case 'error':
        return 'bg-red-400';
      case 'warning':
        return 'bg-yellow-400';
      case 'info':
      default:
        return 'bg-blue-400';
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(notification.id), 300);
  };

  return (
    <div
      className={getToastStyles()}
      role="alert"
      aria-live="polite"
      data-testid={`toast-${notification.type}`}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">{getIcon()}</div>
        <div className="ml-3 flex-1">
          <h4 className="text-sm font-medium" data-testid="toast-title">
            {notification.title}
          </h4>
          <p className="mt-1 text-sm opacity-90" data-testid="toast-message">
            {notification.message}
          </p>
          <p className="mt-1 text-xs opacity-75" data-testid="toast-timestamp">
            {new Date(notification.timestamp).toLocaleTimeString()}
          </p>
        </div>
        <div className="ml-4 flex-shrink-0">
          <button
            type="button"
            className="inline-flex rounded-md p-1.5 hover:bg-black hover:bg-opacity-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent focus:ring-current"
            onClick={handleClose}
            data-testid="toast-close-button"
            aria-label="Close notification"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {autoClose && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black bg-opacity-10">
          <div
            className={`h-full transition-all duration-75 ease-linear ${getProgressBarColor()}`}
            style={{ width: `${progress}%` }}
            data-testid="toast-progress"
          />
        </div>
      )}
    </div>
  );
};

export default Toast;
