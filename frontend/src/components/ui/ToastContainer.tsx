import React, { useEffect } from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import Toast from './Toast';

interface ToastContainerProps {
  position?:
    | 'top-right'
    | 'top-left'
    | 'bottom-right'
    | 'bottom-left'
    | 'top-center'
    | 'bottom-center';
  maxToasts?: number;
}

const ToastContainer: React.FC<ToastContainerProps> = ({
  position = 'top-right',
  maxToasts = 5,
}) => {
  const { notifications, removeNotification, addNotification } =
    useNotifications();

  // Listen for global error events and show user-friendly notifications
  useEffect(() => {
    const handleOnlineStatus = () => {
      if (navigator.onLine) {
        addNotification({
          type: 'success',
          title: 'Connection Restored',
          message: 'You are back online.',
          duration: 3000,
        });
      } else {
        addNotification({
          type: 'warning',
          title: 'Connection Lost',
          message: 'You are currently offline. Some features may not work.',
          duration: 5000,
        });
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Check if there are any pending notifications when user returns
        const pendingErrors = localStorage.getItem('error_reports');
        if (pendingErrors) {
          try {
            const errors = JSON.parse(pendingErrors);
            const recentErrors = errors.filter(
              (error: any) =>
                new Date(error.timestamp) > new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
            );

            if (recentErrors.length > 0) {
              addNotification({
                type: 'info',
                title: 'System Status',
                message: `${recentErrors.length} issue(s) occurred while you were away.`,
                duration: 4000,
              });
            }
          } catch (error) {
            // Silently fail
          }
        }
      }
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [addNotification]);

  const getPositionStyles = () => {
    const baseStyles =
      'fixed z-50 pointer-events-none transition-all duration-300';

    switch (position) {
      case 'top-left':
        return `${baseStyles} top-4 left-4`;
      case 'top-center':
        return `${baseStyles} top-4 left-1/2 transform -translate-x-1/2`;
      case 'top-right':
        return `${baseStyles} top-4 right-4`;
      case 'bottom-left':
        return `${baseStyles} bottom-4 left-4`;
      case 'bottom-center':
        return `${baseStyles} bottom-4 left-1/2 transform -translate-x-1/2`;
      case 'bottom-right':
        return `${baseStyles} bottom-4 right-4`;
      default:
        return `${baseStyles} top-4 right-4`;
    }
  };

  // Limit the number of visible toasts and prioritize by type
  const prioritizedNotifications = notifications
    .sort((a, b) => {
      const priority = { error: 4, warning: 3, success: 2, info: 1 };
      return (priority[b.type] || 0) - (priority[a.type] || 0);
    })
    .slice(0, maxToasts);

  if (prioritizedNotifications.length === 0) {
    return null;
  }

  return (
    <div
      className={getPositionStyles()}
      data-testid="toast-container"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      <div className="w-80 max-w-sm pointer-events-auto space-y-2">
        {prioritizedNotifications.map((notification, index) => (
          <div
            key={notification.id}
            className="toast-enter-active"
            style={{
              animationDelay: `${index * 100}ms`,
              zIndex: 1000 - index,
            }}
          >
            <Toast notification={notification} onClose={removeNotification} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ToastContainer;
