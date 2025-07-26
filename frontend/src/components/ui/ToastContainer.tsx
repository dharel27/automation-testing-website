import React from 'react';
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
  const { notifications, removeNotification } = useNotifications();

  const getPositionStyles = () => {
    const baseStyles = 'fixed z-50 pointer-events-none';

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

  // Limit the number of visible toasts
  const visibleNotifications = notifications.slice(0, maxToasts);

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className={getPositionStyles()} data-testid="toast-container">
      <div className="w-80 max-w-sm pointer-events-auto">
        {visibleNotifications.map((notification) => (
          <Toast
            key={notification.id}
            notification={notification}
            onClose={removeNotification}
          />
        ))}
      </div>
    </div>
  );
};

export default ToastContainer;
