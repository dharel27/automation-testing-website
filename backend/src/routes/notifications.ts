import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// In-memory storage for notifications (in production, use a database)
interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  userId?: string;
  read: boolean;
}

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
    data: filteredNotifications.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ),
  });
});

// Create a new notification
router.post('/', (req: Request, res: Response) => {
  const { type, title, message, userId } = req.body;

  if (!type || !title || !message) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Type, title, and message are required',
      },
    });
  }

  const notification: Notification = {
    id: uuidv4(),
    type,
    title,
    message,
    timestamp: new Date(),
    userId,
    read: false,
  };

  notifications.push(notification);

  // Emit to all connected clients or specific user
  const io = req.app.get('io');
  if (userId) {
    io.to(`user_${userId}`).emit('notification', notification);
  } else {
    io.emit('notification', notification);
  }

  res.status(201).json({
    success: true,
    data: notification,
  });
});

// Mark notification as read
router.patch('/:id/read', (req: Request, res: Response) => {
  const { id } = req.params;

  const notification = notifications.find((n) => n.id === id);
  if (!notification) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Notification not found',
      },
    });
  }

  notification.read = true;

  res.json({
    success: true,
    data: notification,
  });
});

// Delete notification
router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;

  const index = notifications.findIndex((n) => n.id === id);
  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Notification not found',
      },
    });
  }

  notifications.splice(index, 1);

  res.json({
    success: true,
    data: { message: 'Notification deleted successfully' },
  });
});

// Simulate real-time notifications (for testing)
router.post('/simulate', (req: Request, res: Response) => {
  const { count = 1, interval = 1000, userId } = req.body;

  let sent = 0;
  const intervalId = setInterval(() => {
    if (sent >= count) {
      clearInterval(intervalId);
      return;
    }

    const types: Array<'info' | 'success' | 'warning' | 'error'> = [
      'info',
      'success',
      'warning',
      'error',
    ];
    const randomType = types[Math.floor(Math.random() * types.length)];

    const notification: Notification = {
      id: uuidv4(),
      type: randomType,
      title: `Test Notification ${sent + 1}`,
      message: `This is a simulated ${randomType} notification for testing purposes.`,
      timestamp: new Date(),
      userId,
      read: false,
    };

    notifications.push(notification);

    const io = req.app.get('io');
    if (userId) {
      io.to(`user_${userId}`).emit('notification', notification);
    } else {
      io.emit('notification', notification);
    }

    sent++;
  }, interval);

  res.json({
    success: true,
    data: { message: `Simulating ${count} notifications every ${interval}ms` },
  });
});

// Export function to clear notifications for testing
export const clearNotifications = () => {
  notifications.length = 0;
};

export default router;
