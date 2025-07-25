import request from 'supertest';
import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import notificationRoutes, {
  NotificationType,
} from '../../routes/notifications.js';

describe('Notifications Routes', () => {
  let app: express.Application;
  let server: any;
  let io: Server;

  beforeEach(() => {
    app = express();
    server = createServer(app);
    io = new Server(server);

    app.use(express.json());
    app.set('io', io);
    app.use('/api/notifications', notificationRoutes);
  });

  afterEach(() => {
    server.close();
  });

  describe('GET /api/notifications', () => {
    it('should return empty notifications list initially', async () => {
      const response = await request(app).get('/api/notifications').expect(200);

      expect(response.body).toEqual({
        success: true,
        data: [],
        timestamp: expect.any(String),
      });
    });

    it('should return notifications after creating some', async () => {
      // Create a notification first
      await request(app).post('/api/notifications').send({
        type: NotificationType.INFO,
        title: 'Test Notification',
        message: 'Test message',
      });

      const response = await request(app).get('/api/notifications').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toMatchObject({
        type: NotificationType.INFO,
        title: 'Test Notification',
        message: 'Test message',
      });
    });

    it('should filter notifications by userId when provided', async () => {
      // Create notifications for different users
      await request(app).post('/api/notifications').send({
        type: NotificationType.INFO,
        title: 'User 1 Notification',
        message: 'Message for user 1',
        userId: 'user1',
      });

      await request(app).post('/api/notifications').send({
        type: NotificationType.INFO,
        title: 'User 2 Notification',
        message: 'Message for user 2',
        userId: 'user2',
      });

      await request(app).post('/api/notifications').send({
        type: NotificationType.INFO,
        title: 'Global Notification',
        message: 'Message for everyone',
      });

      // Get notifications for user1
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

    it('should limit notifications to last 50', async () => {
      // Create 60 notifications
      for (let i = 0; i < 60; i++) {
        await request(app)
          .post('/api/notifications')
          .send({
            type: NotificationType.INFO,
            title: `Notification ${i}`,
            message: `Message ${i}`,
          });
      }

      const response = await request(app).get('/api/notifications').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(50);
    });
  });

  describe('POST /api/notifications', () => {
    it('should create a new notification successfully', async () => {
      const notificationData = {
        type: NotificationType.SUCCESS,
        title: 'Test Success',
        message: 'This is a success message',
        userId: 'test-user',
        data: { testData: true },
      };

      const response = await request(app)
        .post('/api/notifications')
        .send(notificationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        id: expect.any(String),
        type: NotificationType.SUCCESS,
        title: 'Test Success',
        message: 'This is a success message',
        userId: 'test-user',
        data: { testData: true },
        timestamp: expect.any(String),
      });
    });

    it('should create notification without optional fields', async () => {
      const notificationData = {
        type: NotificationType.ERROR,
        title: 'Error Notification',
        message: 'Something went wrong',
      };

      const response = await request(app)
        .post('/api/notifications')
        .send(notificationData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        type: NotificationType.ERROR,
        title: 'Error Notification',
        message: 'Something went wrong',
      });
      expect(response.body.data.userId).toBeUndefined();
      expect(response.body.data.data).toBeUndefined();
    });

    it('should return validation error for missing required fields', async () => {
      const response = await request(app)
        .post('/api/notifications')
        .send({
          type: NotificationType.INFO,
          title: 'Test',
          // missing message
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toBe(
        'Type, title, and message are required'
      );
    });

    it('should return validation error for missing type', async () => {
      const response = await request(app)
        .post('/api/notifications')
        .send({
          title: 'Test',
          message: 'Test message',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return validation error for missing title', async () => {
      const response = await request(app)
        .post('/api/notifications')
        .send({
          type: NotificationType.INFO,
          message: 'Test message',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should generate unique notification IDs', async () => {
      const notificationData = {
        type: NotificationType.INFO,
        title: 'Test',
        message: 'Test message',
      };

      const response1 = await request(app)
        .post('/api/notifications')
        .send(notificationData);

      const response2 = await request(app)
        .post('/api/notifications')
        .send(notificationData);

      expect(response1.body.data.id).not.toBe(response2.body.data.id);
    });
  });

  describe('POST /api/notifications/simulate', () => {
    it('should start notification simulation successfully', async () => {
      const response = await request(app)
        .post('/api/notifications/simulate')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Simulation started');
    });

    it('should return error when WebSocket server is not available', async () => {
      // Create app without WebSocket server
      const appWithoutSocket = express();
      appWithoutSocket.use(express.json());
      appWithoutSocket.use('/api/notifications', notificationRoutes);

      const response = await request(appWithoutSocket)
        .post('/api/notifications/simulate')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('WEBSOCKET_ERROR');
      expect(response.body.error.message).toBe(
        'WebSocket server not available'
      );
    });
  });

  describe('DELETE /api/notifications', () => {
    it('should clear all notifications successfully', async () => {
      // Create some notifications first
      await request(app).post('/api/notifications').send({
        type: NotificationType.INFO,
        title: 'Test 1',
        message: 'Message 1',
      });

      await request(app).post('/api/notifications').send({
        type: NotificationType.INFO,
        title: 'Test 2',
        message: 'Message 2',
      });

      // Verify notifications exist
      let getResponse = await request(app).get('/api/notifications');
      expect(getResponse.body.data).toHaveLength(2);

      // Clear notifications
      const deleteResponse = await request(app)
        .delete('/api/notifications')
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);
      expect(deleteResponse.body.message).toBe('Cleared 2 notifications');

      // Verify notifications are cleared
      getResponse = await request(app).get('/api/notifications');
      expect(getResponse.body.data).toHaveLength(0);
    });

    it('should handle clearing when no notifications exist', async () => {
      const response = await request(app)
        .delete('/api/notifications')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Cleared 0 notifications');
    });
  });

  describe('Notification Types', () => {
    it('should accept all valid notification types', async () => {
      const types = [
        NotificationType.INFO,
        NotificationType.SUCCESS,
        NotificationType.WARNING,
        NotificationType.ERROR,
      ];

      for (const type of types) {
        const response = await request(app)
          .post('/api/notifications')
          .send({
            type,
            title: `${type} Notification`,
            message: `This is a ${type} message`,
          })
          .expect(201);

        expect(response.body.data.type).toBe(type);
      }
    });
  });

  describe('Response Format', () => {
    it('should return consistent response format for success', async () => {
      const response = await request(app).post('/api/notifications').send({
        type: NotificationType.INFO,
        title: 'Test',
        message: 'Test message',
      });

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('timestamp');
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });

    it('should return consistent response format for errors', async () => {
      const response = await request(app).post('/api/notifications').send({
        title: 'Test',
        message: 'Test message',
      });

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Data Persistence', () => {
    it('should persist notifications across requests', async () => {
      // Create notification
      await request(app).post('/api/notifications').send({
        type: NotificationType.INFO,
        title: 'Persistent Test',
        message: 'This should persist',
      });

      // Verify it exists in subsequent request
      const response = await request(app).get('/api/notifications');

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Persistent Test');
    });

    it('should maintain notification order', async () => {
      const notifications = [
        { title: 'First', message: 'First message' },
        { title: 'Second', message: 'Second message' },
        { title: 'Third', message: 'Third message' },
      ];

      // Create notifications in order
      for (const notif of notifications) {
        await request(app)
          .post('/api/notifications')
          .send({
            type: NotificationType.INFO,
            ...notif,
          });
      }

      const response = await request(app).get('/api/notifications');

      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0].title).toBe('First');
      expect(response.body.data[1].title).toBe('Second');
      expect(response.body.data[2].title).toBe('Third');
    });
  });
});
