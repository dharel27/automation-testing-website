import React from 'react';
import {
  Toast as ToastType,
  NotificationType,
} from '../../contexts/NotificationContext';

interface ToastProps {
  toast: ToastType;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const getToastStyles = (type: NotificationType): string => {
    const baseStyles =
      'mb-4 p-4 rounded-lg shadow-lg border-l-4 transition-all duration-300 ease-in-out';

    switch (type) {
      case NotificationType.SUCCESS:
        return `${baseStyles} bg-green-50 border-green-400 text-green-800 dark:bg-green-900 dark:text-green-200`;
      case NotificationType.ERROR:
        return `${baseStyles} bg-red-50 border-red-400 text-red-800 dark:bg-red-900 dark:text-red-200`;
      case NotificationType.WARNING:
        return `${baseStyles} bg-yellow-50 border-yellow-400 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`;
      case NotificationType.INFO:
      default:
        return `${baseStyles} bg-blue-50 border-blue-400 text-blue-800 dark:bg-blue-900 dark:text-blue-200`;
    }
  };

  const getIcon = (type: NotificationType): string => {
    switch (type) {
      case NotificationType.SUCCESS:
        return '✓';
      case NotificationType.ERROR:
        return '✕';
      case NotificationType.WARNING:
        return '⚠';
      case NotificationType.INFO:
      default:
        return 'ℹ';
    }
  };

  return (
    <div
      className={getToastStyles(toast.type)}
      data-testid={`toast-${toast.type}`}
      data-toast-id={toast.id}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start">
          <span
            className="text-lg mr-3 mt-0.5"
            aria-hidden="true"
            data-testid="toast-icon"
          >
            {getIcon(toast.type)}
          </span>
          <div className="flex-1">
            <h4
              className="font-semibold text-sm mb-1"
              data-testid="toast-title"
            >
              {toast.title}
            </h4>
            <p className="text-sm opacity-90" data-testid="toast-message">
              {toast.message}
            </p>
            {toast.data && (
              <details className="mt-2">
                <summary className="text-xs cursor-pointer opacity-75 hover:opacity-100">
                  Additional Data
                </summary>
                <pre className="text-xs mt-1 p-2 bg-black bg-opacity-10 rounded overflow-auto">
                  {JSON.stringify(toast.data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
        <button
          onClick={() => onClose(toast.id)}
          className="ml-4 text-lg opacity-60 hover:opacity-100 transition-opacity"
          aria-label="Close notification"
          data-testid="toast-close-button"
        >
          ×
        </button>
      </div>
      <div className="text-xs opacity-60 mt-2">
        {new Date(toast.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastType[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onClose,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 z-50 w-96 max-w-full"
      data-testid="toast-container"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
};
