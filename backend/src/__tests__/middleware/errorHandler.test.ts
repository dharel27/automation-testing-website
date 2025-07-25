import request from 'supertest';
import express from 'express';
import {
  AppError,
  globalErrorHandler,
  notFoundHandler,
  catchAsync,
} from '../../middleware/errorHandler';

describe('Error Handler Middleware', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('AppError class', () => {
    it('should create an operational error with correct properties', () => {
      const error = new AppError('Test error', 400, 'TEST_ERROR');

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe('TEST_ERROR');
      expect(error.isOperational).toBe(true);
    });

    it('should create an error without code', () => {
      const error = new AppError('Test error', 500);

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.code).toBeUndefined();
      expect(error.isOperational).toBe(true);
    });
  });

  describe('catchAsync wrapper', () => {
    it('should catch async errors and pass them to next', async () => {
      const asyncHandler = catchAsync(async (req: any, res: any, next: any) => {
        throw new AppError('Async error', 400, 'ASYNC_ERROR');
      });

      app.get('/test', asyncHandler);
      app.use(globalErrorHandler);

      const response = await request(app).get('/test');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Async error');
      expect(response.body.error.code).toBe('ASYNC_ERROR');
    });

    it('should handle promise rejections', async () => {
      const asyncHandler = catchAsync(async (req: any, res: any, next: any) => {
        await Promise.reject(
          new AppError('Promise rejection', 500, 'PROMISE_ERROR')
        );
      });

      app.get('/test', asyncHandler);
      app.use(globalErrorHandler);

      const response = await request(app).get('/test');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Promise rejection');
    });
  });

  describe('notFoundHandler', () => {
    it('should create 404 error for unmatched routes', async () => {
      app.use(notFoundHandler);
      app.use(globalErrorHandler);

      const response = await request(app).get('/nonexistent');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.message).toContain('/nonexistent');
    });
  });

  describe('globalErrorHandler', () => {
    beforeEach(() => {
      // Set NODE_ENV to development for testing
      process.env.NODE_ENV = 'development';
    });

    afterEach(() => {
      delete process.env.NODE_ENV;
    });

    it('should handle operational errors correctly', async () => {
      app.get('/test', (req, res, next) => {
        next(new AppError('Operational error', 400, 'OPERATIONAL_ERROR'));
      });
      app.use(globalErrorHandler);

      const response = await request(app).get('/test');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Operational error');
      expect(response.body.error.code).toBe('OPERATIONAL_ERROR');
      expect(response.body.timestamp).toBeDefined();
    });

    it('should handle non-operational errors', async () => {
      app.get('/test', (req, res, next) => {
        const error = new Error('Non-operational error');
        next(error);
      });
      app.use(globalErrorHandler);

      const response = await request(app).get('/test');

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toBe('Non-operational error');
    });

    it('should include stack trace in development mode', async () => {
      process.env.NODE_ENV = 'development';

      app.get('/test', (req, res, next) => {
        next(new AppError('Dev error', 400, 'DEV_ERROR'));
      });
      app.use(globalErrorHandler);

      const response = await request(app).get('/test');

      expect(response.status).toBe(400);
      expect(response.body.stack).toBeDefined();
    });

    it('should not include stack trace in production mode', async () => {
      process.env.NODE_ENV = 'production';

      app.get('/test', (req, res, next) => {
        next(new AppError('Prod error', 400, 'PROD_ERROR'));
      });
      app.use(globalErrorHandler);

      const response = await request(app).get('/test');

      expect(response.status).toBe(400);
      expect(response.body.stack).toBeUndefined();
    });

    it('should handle JWT errors', async () => {
      app.get('/test', (req, res, next) => {
        const error = new Error('jwt malformed');
        error.name = 'JsonWebTokenError';
        next(error);
      });
      app.use(globalErrorHandler);

      const response = await request(app).get('/test');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    it('should handle JWT expired errors', async () => {
      app.get('/test', (req, res, next) => {
        const error = new Error('jwt expired');
        error.name = 'TokenExpiredError';
        next(error);
      });
      app.use(globalErrorHandler);

      const response = await request(app).get('/test');

      expect(response.status).toBe(401);
      expect(response.body.error.code).toBe('TOKEN_EXPIRED');
    });

    it('should set default status code for errors without statusCode', async () => {
      app.get('/test', (req, res, next) => {
        const error = new Error('Error without status code');
        next(error);
      });
      app.use(globalErrorHandler);

      const response = await request(app).get('/test');

      expect(response.status).toBe(500);
    });
  });
});
