import request from 'supertest';
import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import notificationRoutes, {
  clearNotifications,
} from '../../routes/notifications';

const app = express();
const server = createServer(app);
const io = new Server(server);

app.use(express.json());
app.set('io', io);
app.use('/api/notifications', notificationRoutes);

// Mock socket.io emit
const mockEmit = jest.fn();
const mockTo = jest.fn().mockReturnValue({ emit: mockEmit });
io.emit = mockEmit;
io.to = mockTo;

// Access the notifications array for testing
let notifications: any[];

describe('Notifications API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearNotifications();
  });

  describe('GET /api/notifications', () => {
    it('should return empty notifications initially', async () => {
      const response = await request(app).get('/api/notifications').expect(200);

      expect(response.body).toEqual({
        success: true,
        data: [],
      });
    });

    it('should return notifications sorted by timestamp (newest first)', async () => {
      // Create two notifications
      await request(app).post('/api/notifications').send({
        type: 'info',
        title: 'First Notification',
        message: 'First message',
      });

      // Wait a bit to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      await request(app).post('/api/notifications').send({
        type: 'success',
        title: 'Second Notification',
        message: 'Second message',
      });

      const response = await request(app).get('/api/notifications').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].title).toBe('Second Notification');
      expect(response.body.data[1].title).toBe('First Notification');
    });

    it('should filter notifications by userId', async () => {
      // Create notifications for different users
      await request(app).post('/api/notifications').send({
        type: 'info',
        title: 'User 1 Notification',
        message: 'Message for user 1',
        userId: 'user1',
      });

      await request(app).post('/api/notifications').send({
        type: 'info',
        title: 'User 2 Notification',
        message: 'Message for user 2',
        userId: 'user2',
      });

      await request(app).post('/api/notifications').send({
        type: 'info',
        title: 'Global Notification',
        message: 'Message for everyone',
      });

      const response = await request(app)
        .get('/api/notifications?userId=user1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2); // user1 notification + global notification
      expect(
        response.body.data.some((n: any) => n.title === 'User 1 Notification')
      ).toBe(true);
      expect(
        response.body.data.some((n: any) => n.title === 'Global Notification')
      ).toBe(true);
      expect(
        response.body.data.some((n: any) => n.title === 'User 2 Notification')
      ).toBe(false);
    });
  });

  describe('POST /api/notifications', () => {
    it('should create a new notification', async () => {
      const notificationData = {
        type: 'info',
        title: 'Test Notification',
        message: 'This is a test message',
      };

      const response = await request(app)
        .post('/api/notifications')
        .send(notificationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: expect.any(String),
        type: 'info',
        title: 'Test Notification',
        message: 'This is a test message',
        timestamp: expect.any(String),
        read: false,
      });
    });

    it('should create notification with userId', async () => {
      const notificationData = {
        type: 'success',
        title: 'User Notification',
        message: 'Message for specific user',
        userId: 'user123',
      };

      const response = await request(app)
        .post('/api/notifications')
        .send(notificationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe('user123');
    });

    it('should emit notification to all clients when no userId', async () => {
      const notificationData = {
        type: 'info',
        title: 'Global Notification',
        message: 'Message for everyone',
      };

      await request(app)
        .post('/api/notifications')
        .send(notificationData)
        .expect(201);

      expect(mockEmit).toHaveBeenCalledWith(
        'notification',
        expect.objectContaining({
          type: 'info',
          title: 'Global Notification',
          message: 'Message for everyone',
        })
      );
    });

    it('should emit notification to specific user room when userId provided', async () => {
      const notificationData = {
        type: 'info',
        title: 'User Notification',
        message: 'Message for specific user',
        userId: 'user123',
      };

      await request(app)
        .post('/api/notifications')
        .send(notificationData)
        .expect(201);

      expect(mockTo).toHaveBeenCalledWith('user_user123');
      expect(mockEmit).toHaveBeenCalledWith(
        'notification',
        expect.objectContaining({
          type: 'info',
          title: 'User Notification',
          message: 'Message for specific user',
          userId: 'user123',
        })
      );
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/notifications')
        .send({
          type: 'info',
          // missing title and message
        })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Type, title, and message are required',
        },
      });
    });

    it('should validate type field', async () => {
      const response = await request(app)
        .post('/api/notifications')
        .send({
          // missing type
          title: 'Test Title',
          message: 'Test message',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PATCH /api/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      // Create a notification first
      const createResponse = await request(app)
        .post('/api/notifications')
        .send({
          type: 'info',
          title: 'Test Notification',
          message: 'Test message',
        });

      const notificationId = createResponse.body.data.id;

      const response = await request(app)
        .patch(`/api/notifications/${notificationId}/read`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.read).toBe(true);
    });

    it('should return 404 for non-existent notification', async () => {
      const response = await request(app)
        .patch('/api/notifications/non-existent-id/read')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Notification not found',
        },
      });
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    it('should delete notification', async () => {
      // Create a notification first
      const createResponse = await request(app)
        .post('/api/notifications')
        .send({
          type: 'info',
          title: 'Test Notification',
          message: 'Test message',
        });

      const notificationId = createResponse.body.data.id;

      const response = await request(app)
        .delete(`/api/notifications/${notificationId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe(
        'Notification deleted successfully'
      );

      // Verify it's actually deleted
      const getResponse = await request(app)
        .get('/api/notifications')
        .expect(200);

      expect(getResponse.body.data).toHaveLength(0);
    });

    it('should return 404 for non-existent notification', async () => {
      const response = await request(app)
        .delete('/api/notifications/non-existent-id')
        .expect(404);

      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Notification not found',
        },
      });
    });
  });

  describe('POST /api/notifications/simulate', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should simulate notifications with default parameters', async () => {
      const response = await request(app)
        .post('/api/notifications/simulate')
        .send({})
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe(
        'Simulating 1 notifications every 1000ms'
      );

      // Fast-forward time to trigger the simulation
      jest.advanceTimersByTime(1000);

      // Check that notification was emitted
      expect(mockEmit).toHaveBeenCalledWith(
        'notification',
        expect.objectContaining({
          type: expect.any(String),
          title: 'Test Notification 1',
          message: expect.stringContaining('simulated'),
        })
      );
    });

    it('should simulate multiple notifications with custom parameters', async () => {
      const response = await request(app)
        .post('/api/notifications/simulate')
        .send({
          count: 3,
          interval: 500,
          userId: 'testuser',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe(
        'Simulating 3 notifications every 500ms'
      );

      // Fast-forward time to trigger all simulations
      jest.advanceTimersByTime(1500); // 3 * 500ms

      // Check that notifications were emitted to specific user
      expect(mockTo).toHaveBeenCalledWith('user_testuser');
      expect(mockEmit).toHaveBeenCalledTimes(3);
    });

    it('should generate different notification types', async () => {
      await request(app)
        .post('/api/notifications/simulate')
        .send({ count: 10, interval: 100 })
        .expect(200);

      // Fast-forward time to trigger all simulations
      jest.advanceTimersByTime(1000);

      // Check that different types were generated
      const emittedNotifications = mockEmit.mock.calls.map((call) => call[1]);
      const types = emittedNotifications.map((n: any) => n.type);
      const uniqueTypes = [...new Set(types)];

      // Should have at least 2 different types (statistically likely with 10 notifications)
      expect(uniqueTypes.length).toBeGreaterThan(1);
      expect(
        uniqueTypes.every((type) =>
          ['info', 'success', 'warning', 'error'].includes(type)
        )
      ).toBe(true);
    });
  });

  describe('Notification data structure', () => {
    it('should create notifications with correct structure', async () => {
      const response = await request(app)
        .post('/api/notifications')
        .send({
          type: 'warning',
          title: 'Warning Notification',
          message: 'This is a warning',
          userId: 'user456',
        })
        .expect(201);

      const notification = response.body.data;

      expect(notification).toMatchObject({
        id: expect.any(String),
        type: 'warning',
        title: 'Warning Notification',
        message: 'This is a warning',
        timestamp: expect.any(String),
        userId: 'user456',
        read: false,
      });

      // Verify timestamp is a valid date
      expect(new Date(notification.timestamp)).toBeInstanceOf(Date);
      expect(isNaN(new Date(notification.timestamp).getTime())).toBe(false);
    });

    it('should generate unique IDs for notifications', async () => {
      const response1 = await request(app).post('/api/notifications').send({
        type: 'info',
        title: 'Notification 1',
        message: 'Message 1',
      });

      const response2 = await request(app).post('/api/notifications').send({
        type: 'info',
        title: 'Notification 2',
        message: 'Message 2',
      });

      expect(response1.body.data.id).not.toBe(response2.body.data.id);
    });
  });
});
