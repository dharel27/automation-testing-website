import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';
import { csrfProtection, getCsrfToken } from '../../middleware/csrf';

describe('CSRF Protection Middleware', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(cookieParser());
    app.use(csrfProtection());
  });

  describe('CSRF Token Generation', () => {
    beforeEach(() => {
      app.get('/csrf-token', getCsrfToken);
    });

    it('should generate CSRF token', async () => {
      const response = await request(app).get('/csrf-token').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.csrfToken).toBeDefined();
      expect(typeof response.body.data.csrfToken).toBe('string');
      expect(response.body.data.csrfToken).toMatch(/^[a-f0-9]+\.[a-f0-9]+$/);
    });

    it('should set CSRF token in cookie', async () => {
      const response = await request(app).get('/csrf-token').expect(200);

      expect(response.headers['set-cookie']).toBeDefined();
      const cookieHeader = response.headers['set-cookie'][0];
      expect(cookieHeader).toContain('csrf-token=');
    });
  });

  describe('CSRF Token Validation', () => {
    let csrfToken: string;

    beforeEach(async () => {
      app.get('/csrf-token', getCsrfToken);
      app.post('/protected', (req, res) => {
        res.json({ success: true, message: 'Protected route accessed' });
      });

      // Get CSRF token first
      const tokenResponse = await request(app).get('/csrf-token');
      csrfToken = tokenResponse.body.data.csrfToken;
    });

    it('should allow GET requests without CSRF token', async () => {
      app.get('/test', (req, res) => {
        res.json({ success: true });
      });

      await request(app).get('/test').expect(200);
    });

    it('should allow HEAD requests without CSRF token', async () => {
      app.head('/test', (req, res) => {
        res.status(200).end();
      });

      await request(app).head('/test').expect(200);
    });

    it('should allow OPTIONS requests without CSRF token', async () => {
      app.options('/test', (req, res) => {
        res.status(200).end();
      });

      await request(app).options('/test').expect(200);
    });

    it('should reject POST requests without CSRF token', async () => {
      const response = await request(app)
        .post('/protected')
        .send({ data: 'test' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CSRF_TOKEN_MISSING');
    });

    it('should reject POST requests with invalid CSRF token', async () => {
      const response = await request(app)
        .post('/protected')
        .set('x-csrf-token', 'invalid-token')
        .send({ data: 'test' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CSRF_TOKEN_INVALID');
    });

    it('should accept POST requests with valid CSRF token in header', async () => {
      await request(app)
        .post('/protected')
        .set('x-csrf-token', csrfToken)
        .send({ data: 'test' })
        .expect(200);
    });

    it('should accept POST requests with valid CSRF token in body', async () => {
      await request(app)
        .post('/protected')
        .send({ data: 'test', _csrf: csrfToken })
        .expect(200);
    });

    it('should reject requests with malformed CSRF token', async () => {
      const response = await request(app)
        .post('/protected')
        .set('x-csrf-token', 'malformed-token-without-dot')
        .send({ data: 'test' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CSRF_TOKEN_INVALID');
    });

    it('should reject PUT requests without CSRF token', async () => {
      app.put('/protected', (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .put('/protected')
        .send({ data: 'test' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CSRF_TOKEN_MISSING');
    });

    it('should reject DELETE requests without CSRF token', async () => {
      app.delete('/protected', (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app).delete('/protected').expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('CSRF_TOKEN_MISSING');
    });
  });

  describe('CSRF Configuration', () => {
    it('should use custom header name', async () => {
      const customApp = express();
      customApp.use(express.json());
      customApp.use(cookieParser());
      customApp.use(csrfProtection({ headerName: 'x-custom-csrf' }));
      customApp.get('/csrf-token', getCsrfToken);
      customApp.post('/protected', (req, res) => {
        res.json({ success: true });
      });

      // Get CSRF token
      const tokenResponse = await request(customApp).get('/csrf-token');
      const csrfToken = tokenResponse.body.data.csrfToken;

      // Should reject with standard header
      await request(customApp)
        .post('/protected')
        .set('x-csrf-token', csrfToken)
        .send({ data: 'test' })
        .expect(403);

      // Should accept with custom header
      await request(customApp)
        .post('/protected')
        .set('x-custom-csrf', csrfToken)
        .send({ data: 'test' })
        .expect(200);
    });

    it('should use custom cookie name', async () => {
      const customApp = express();
      customApp.use(express.json());
      customApp.use(cookieParser());
      customApp.use(csrfProtection({ cookieName: 'custom-csrf-token' }));
      customApp.get('/csrf-token', getCsrfToken);

      const response = await request(customApp).get('/csrf-token').expect(200);

      const cookieHeader = response.headers['set-cookie'][0];
      expect(cookieHeader).toContain('custom-csrf-token=');
    });
  });
});
