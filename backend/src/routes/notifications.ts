import { Router, Request, Response } from 'express';
import { Server } from 'socket.io';
import logger from '../utils/logger';

const router = Router();

// Notification types
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

// In-memory storage for demo purposes
const notifications: Notification[] = [];

// Get all notifications
router.get('/', (req: Request, res: Response) => {
  const { userId } = req.query;

  let filteredNotifications = notifications;
  if (userId) {
    filteredNotifications = notifications.filter(
      (n) => !n.userId || n.userId === userId
    );
  }

  res.json({
    success: true,
    data: filteredNotifications.slice(-50), // Return last 50 notifications
    timestamp: new Date().toISOString(),
  });
});

// Create a new notification
router.post('/', (req: Request, res: Response) => {
  const { type, title, message, userId, data } = req.body;

  if (!type || !title || !message) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Type, title, and message are required',
      },
      timestamp: new Date().toISOString(),
    });
  }

  const notification: Notification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: type as NotificationType,
    title,
    message,
    timestamp: new Date(),
    userId,
    data,
  };

  notifications.push(notification);

  // Emit to all connected clients
  const io: Server = req.app.get('io');
  if (io) {
    if (userId) {
      // Send to specific user if userId provided
      io.to(`user_${userId}`).emit('notification', notification);
    } else {
      // Broadcast to all clients in notifications room
      io.to('notifications').emit('notification', notification);
    }
  }

  logger.info(`Notification created: ${notification.id}`);

  res.status(201).json({
    success: true,
    data: notification,
    timestamp: new Date().toISOString(),
  });
});

// Simulate real-time notifications for testing
router.post('/simulate', (req: Request, res: Response) => {
  const io: Server = req.app.get('io');

  if (!io) {
    return res.status(500).json({
      success: false,
      error: {
        code: 'WEBSOCKET_ERROR',
        message: 'WebSocket server not available',
      },
      timestamp: new Date().toISOString(),
    });
  }

  const notificationTypes = [
    {
      type: NotificationType.INFO,
      title: 'System Update',
      message: 'System maintenance scheduled for tonight',
    },
    {
      type: NotificationType.SUCCESS,
      title: 'Task Completed',
      message: 'Your data export has been completed successfully',
    },
    {
      type: NotificationType.WARNING,
      title: 'Storage Warning',
      message: 'You are running low on storage space',
    },
    {
      type: NotificationType.ERROR,
      title: 'Connection Error',
      message: 'Failed to connect to external service',
    },
  ];

  let count = 0;
  const interval = setInterval(() => {
    if (count >= 5) {
      clearInterval(interval);
      return;
    }

    const randomNotif =
      notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
    const notification: Notification = {
      id: `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: randomNotif.type,
      title: randomNotif.title,
      message: `${randomNotif.message} (${count + 1}/5)`,
      timestamp: new Date(),
      data: { simulation: true, count: count + 1 },
    };

    notifications.push(notification);
    io.to('notifications').emit('notification', notification);

    logger.info(`Simulated notification sent: ${notification.id}`);
    count++;
  }, 2000);

  res.json({
    success: true,
    message:
      'Simulation started - 5 notifications will be sent over 10 seconds',
    timestamp: new Date().toISOString(),
  });
});

// Clear all notifications
router.delete('/', (req: Request, res: Response) => {
  const clearedCount = notifications.length;
  notifications.length = 0;

  const io: Server = req.app.get('io');
  if (io) {
    io.to('notifications').emit('notifications-cleared');
  }

  res.json({
    success: true,
    message: `Cleared ${clearedCount} notifications`,
    timestamp: new Date().toISOString(),
  });
});

export default router;
