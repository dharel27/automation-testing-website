import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  userId?: string;
  data?: any;
}

export interface Toast extends Notification {
  duration?: number;
  isVisible: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  toasts: Toast[];
  socket: Socket | null;
  isConnected: boolean;
  addToast: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeToast: (id: string) => void;
  clearNotifications: () => void;
  simulateNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    // Initialize WebSocket connection
    const newSocket = io('http://localhost:3001');

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setIsConnected(false);
    });

    // Listen for notifications
    newSocket.on('notification', (notification: Notification) => {
      console.log('Received notification:', notification);

      // Add to notifications list
      setNotifications((prev) => [...prev, notification]);

      // Add as toast
      const toast: Toast = {
        ...notification,
        isVisible: true,
        duration: getToastDuration(notification.type),
      };

      setToasts((prev) => [...prev, toast]);

      // Auto-remove toast after duration
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, toast.duration);
    });

    // Listen for notifications cleared event
    newSocket.on('notifications-cleared', () => {
      setNotifications([]);
      setToasts([]);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, []);

  const getToastDuration = (type: NotificationType): number => {
    switch (type) {
      case NotificationType.ERROR:
        return 8000; // 8 seconds for errors
      case NotificationType.WARNING:
        return 6000; // 6 seconds for warnings
      case NotificationType.SUCCESS:
        return 4000; // 4 seconds for success
      case NotificationType.INFO:
      default:
        return 5000; // 5 seconds for info
    }
  };

  const addToast = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    const toast: Toast = {
      ...notification,
      id: `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      isVisible: true,
      duration: getToastDuration(notification.type),
    };

    setToasts((prev) => [...prev, toast]);
    setNotifications((prev) => [...prev, toast]);

    // Auto-remove toast after duration
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, toast.duration);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const clearNotifications = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/notifications', {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications([]);
        setToasts([]);
      }
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  };

  const simulateNotifications = async () => {
    try {
      const response = await fetch(
        'http://localhost:3001/api/notifications/simulate',
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to simulate notifications');
      }
    } catch (error) {
      console.error('Failed to simulate notifications:', error);
      addToast({
        type: NotificationType.ERROR,
        title: 'Simulation Error',
        message: 'Failed to start notification simulation',
      });
    }
  };

  const value: NotificationContextType = {
    notifications,
    toasts,
    socket,
    isConnected,
    addToast,
    removeToast,
    clearNotifications,
    simulateNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      'useNotifications must be used within a NotificationProvider'
    );
  }
  return context;
};
