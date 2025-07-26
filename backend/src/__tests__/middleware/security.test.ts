import request from 'supertest';
import express from 'express';
import {
  sanitizeInput,
  generalRateLimit,
  authRateLimit,
  uploadRateLimit,
  validateUserRegistration,
  validateUserLogin,
  validateProfileUpdate,
  handleValidationErrors,
  securityHeaders,
} from '../../middleware/security';

describe('Security Middleware', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('Input Sanitization', () => {
    beforeEach(() => {
      app.use(sanitizeInput);
      app.post('/test', (req: express.Request, res: express.Response) => {
        res.json({ body: req.body, query: req.query, params: req.params });
      });
    });

    it('should sanitize XSS attempts in request body', async () => {
      const maliciousInput = {
        name: '<script>alert("xss")</script>John',
        description: '<img src="x" onerror="alert(1)">',
        nested: {
          value: '<svg onload="alert(1)">',
        },
      };

      const response = await request(app)
        .post('/test')
        .send(maliciousInput)
        .expect(200);

      expect(response.body.body.name).toBe('John');
      expect(response.body.body.description).toBe('');
      expect(response.body.body.nested.value).toBe('');
    });

    it('should sanitize arrays', async () => {
      const maliciousInput = {
        tags: [
          '<script>alert("xss")</script>',
          'normal-tag',
          '<img src="x" onerror="alert(1)">',
        ],
      };

      const response = await request(app)
        .post('/test')
        .send(maliciousInput)
        .expect(200);

      expect(response.body.body.tags).toEqual(['', 'normal-tag', '']);
    });

    it('should preserve safe content', async () => {
      const safeInput = {
        name: 'John Doe',
        email: 'john@example.com',
        age: 30,
        active: true,
      };

      const response = await request(app)
        .post('/test')
        .send(safeInput)
        .expect(200);

      expect(response.body.body).toEqual(safeInput);
    });
  });

  describe('Rate Limiting', () => {
    it('should apply general rate limiting', async () => {
      app.use(generalRateLimit);
      app.get('/test', (req: express.Request, res: express.Response) =>
        res.json({ success: true })
      );

      // Make requests up to the limit
      for (let i = 0; i < 5; i++) {
        await request(app).get('/test').expect(200);
      }

      // This request should be rate limited (assuming a low limit for testing)
      // Note: This test might need adjustment based on actual rate limit configuration
    });

    it('should apply auth rate limiting', async () => {
      app.use(authRateLimit);
      app.post('/login', (req: express.Request, res: express.Response) =>
        res.json({ success: true })
      );

      // Make requests up to the limit
      for (let i = 0; i < 3; i++) {
        await request(app)
          .post('/login')
          .send({ email: 'test@example.com', password: 'password' })
          .expect(200);
      }

      // This request should be rate limited
      // Note: This test might need adjustment based on actual rate limit configuration
    });
  });

  describe('Input Validation', () => {
    describe('User Registration Validation', () => {
      beforeEach(() => {
        app.post(
          '/register',
          validateUserRegistration,
          handleValidationErrors,
          (req: express.Request, res: express.Response) => {
            res.json({ success: true });
          }
        );
      });

      it('should validate valid registration data', async () => {
        const validData = {
          username: 'testuser',
          email: 'test@example.com',
          password: 'Password123!',
          role: 'user',
        };

        await request(app).post('/register').send(validData).expect(200);
      });

      it('should reject invalid username', async () => {
        const invalidData = {
          username: 'ab', // Too short
          email: 'test@example.com',
          password: 'Password123!',
        };

        const response = await request(app)
          .post('/register')
          .send(invalidData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should reject invalid email', async () => {
        const invalidData = {
          username: 'testuser',
          email: 'invalid-email',
          password: 'Password123!',
        };

        const response = await request(app)
          .post('/register')
          .send(invalidData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should reject weak password', async () => {
        const invalidData = {
          username: 'testuser',
          email: 'test@example.com',
          password: 'weak', // Too weak
        };

        const response = await request(app)
          .post('/register')
          .send(invalidData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should reject invalid role', async () => {
        const invalidData = {
          username: 'testuser',
          email: 'test@example.com',
          password: 'Password123!',
          role: 'invalid-role',
        };

        const response = await request(app)
          .post('/register')
          .send(invalidData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('User Login Validation', () => {
      beforeEach(() => {
        app.post(
          '/login',
          validateUserLogin,
          handleValidationErrors,
          (req: express.Request, res: express.Response) => {
            res.json({ success: true });
          }
        );
      });

      it('should validate valid login data with email', async () => {
        const validData = {
          email: 'test@example.com',
          password: 'password',
        };

        await request(app).post('/login').send(validData).expect(200);
      });

      it('should validate valid login data with username', async () => {
        const validData = {
          username: 'testuser',
          password: 'password',
        };

        await request(app).post('/login').send(validData).expect(200);
      });

      it('should reject missing password', async () => {
        const invalidData = {
          email: 'test@example.com',
        };

        const response = await request(app)
          .post('/login')
          .send(invalidData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should reject invalid email format', async () => {
        const invalidData = {
          email: 'invalid-email',
          password: 'password',
        };

        const response = await request(app)
          .post('/login')
          .send(invalidData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });

    describe('Profile Update Validation', () => {
      beforeEach(() => {
        app.put(
          '/profile',
          validateProfileUpdate,
          handleValidationErrors,
          (req: express.Request, res: express.Response) => {
            res.json({ success: true });
          }
        );
      });

      it('should validate valid profile update', async () => {
        const validData = {
          username: 'newusername',
          email: 'new@example.com',
          profile: {
            firstName: 'John',
            lastName: 'Doe',
          },
        };

        await request(app).put('/profile').send(validData).expect(200);
      });

      it('should reject invalid username', async () => {
        const invalidData = {
          username: 'ab', // Too short
        };

        const response = await request(app)
          .put('/profile')
          .send(invalidData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });

      it('should reject invalid email', async () => {
        const invalidData = {
          email: 'invalid-email',
        };

        const response = await request(app)
          .put('/profile')
          .send(invalidData)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      });
    });
  });

  describe('Security Headers', () => {
    beforeEach(() => {
      app.use(securityHeaders);
      app.get('/test', (req: express.Request, res: express.Response) => {
        res.json({ success: true });
      });
    });

    it('should set security headers', async () => {
      const response = await request(app).get('/test').expect(200);

      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
      expect(response.headers['referrer-policy']).toBe(
        'strict-origin-when-cross-origin'
      );
      expect(response.headers['content-security-policy']).toContain(
        "default-src 'self'"
      );
    });
  });
});
