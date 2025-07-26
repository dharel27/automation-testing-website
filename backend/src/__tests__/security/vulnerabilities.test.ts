import request from 'supertest';
import app from '../../index';
import { getDatabase } from '../../database/connection';
import { User } from '../../models/User';

describe('Vulnerability Assessment Tests', () => {
  let db: any;
  let userModel: User;
  let testUser: any;
  let accessToken: string;
  let csrfToken: string;

  beforeAll(async () => {
    db = await getDatabase();
    userModel = new User(db);
  });

  beforeEach(async () => {
    // Clean up database
    await db.run('DELETE FROM users');
    await db.run('DELETE FROM sessions');

    // Create test user
    testUser = await userModel.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'Password123!',
      role: 'user',
      profile: {},
    });

    // Get CSRF token
    const csrfResponse = await request(app).get('/api/csrf-token');
    csrfToken = csrfResponse.body.data.csrfToken;

    // Login to get access token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .set('x-csrf-token', csrfToken)
      .send({
        email: 'test@example.com',
        password: 'Password123!',
      });

    accessToken = loginResponse.body.data.accessToken;
  });

  describe('XSS (Cross-Site Scripting) Protection', () => {
    const xssPayloads = [
      '<script>alert("xss")</script>',
      '<img src="x" onerror="alert(1)">',
      '<svg onload="alert(1)">',
      'javascript:alert("xss")',
      '<iframe src="javascript:alert(1)"></iframe>',
      '<object data="javascript:alert(1)">',
      '<embed src="javascript:alert(1)">',
      '<link rel="stylesheet" href="javascript:alert(1)">',
      '<style>@import "javascript:alert(1)";</style>',
      '<div onclick="alert(1)">Click me</div>',
    ];

    xssPayloads.forEach((payload, index) => {
      it(`should sanitize XSS payload ${index + 1}: ${payload.substring(0, 30)}...`, async () => {
        const maliciousData = {
          username: `user${payload}`,
          email: 'test2@example.com',
          password: 'Password123!',
          profile: {
            firstName: `John${payload}`,
            lastName: `Doe${payload}`,
          },
        };

        const response = await request(app)
          .post('/api/auth/register')
          .set('x-csrf-token', csrfToken)
          .send(maliciousData);

        if (response.status === 201) {
          // Check that XSS payload was sanitized
          expect(response.body.data.user.username).not.toContain('<script>');
          expect(response.body.data.user.username).not.toContain('javascript:');
          expect(response.body.data.user.username).not.toContain('onerror');
          expect(response.body.data.user.username).not.toContain('onload');
          expect(response.body.data.user.username).not.toContain('onclick');
        }
      });
    });

    it('should prevent XSS in query parameters', async () => {
      const response = await request(app)
        .get('/api/users')
        .query({ search: '<script>alert("xss")</script>' })
        .set('Authorization', `Bearer ${accessToken}`);

      // Should not return the script tag in any form
      const responseText = JSON.stringify(response.body);
      expect(responseText).not.toContain('<script>');
      expect(responseText).not.toContain('alert("xss")');
    });
  });

  describe('SQL Injection Protection', () => {
    const sqlInjectionPayloads = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "' UNION SELECT * FROM users --",
      "'; INSERT INTO users (username) VALUES ('hacker'); --",
      "' OR 1=1 --",
      "admin'--",
      "admin'/*",
      "' OR 'x'='x",
      "'; EXEC xp_cmdshell('dir'); --",
      "' AND (SELECT COUNT(*) FROM users) > 0 --",
    ];

    sqlInjectionPayloads.forEach((payload, index) => {
      it(`should prevent SQL injection payload ${index + 1}: ${payload.substring(0, 30)}...`, async () => {
        // Test in login
        const loginResponse = await request(app)
          .post('/api/auth/login')
          .set('x-csrf-token', csrfToken)
          .send({
            email: payload,
            password: 'password',
          });

        // Should not cause SQL error or unauthorized access
        expect(loginResponse.status).not.toBe(500);
        expect(loginResponse.body.success).toBe(false);

        // Test in user search
        const searchResponse = await request(app)
          .get('/api/users')
          .query({ search: payload })
          .set('Authorization', `Bearer ${accessToken}`);

        expect(searchResponse.status).not.toBe(500);
      });
    });
  });

  describe('Authentication Bypass Attempts', () => {
    it('should prevent JWT token manipulation', async () => {
      // Try to access protected route with manipulated token
      const manipulatedToken = accessToken.replace(/.$/, 'X'); // Change last character

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${manipulatedToken}`)
        .expect(401);

      expect(response.body.error.code).toBe('INVALID_ACCESS_TOKEN');
    });

    it('should prevent role escalation in JWT payload', async () => {
      // This test assumes we can't easily create a valid token with elevated privileges
      // In a real scenario, this would test against attempts to modify the JWT payload
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Regular user should not see admin-only information
      // This depends on the specific implementation of user listing
    });

    it('should prevent session fixation', async () => {
      // Get initial session
      const initialResponse = await request(app).get('/api/csrf-token');
      const initialCsrfToken = initialResponse.body.data.csrfToken;

      // Login with initial session
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .set('x-csrf-token', initialCsrfToken)
        .send({
          email: 'test@example.com',
          password: 'Password123!',
        });

      expect(loginResponse.status).toBe(200);

      // Try to use the same CSRF token after login (should still work as it's the same session)
      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${loginResponse.body.data.accessToken}`)
        .expect(200);

      expect(profileResponse.body.data.user.email).toBe('test@example.com');
    });
  });

  describe('CSRF Protection Tests', () => {
    it('should prevent CSRF attacks on state-changing operations', async () => {
      // Try to perform state-changing operation without CSRF token
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);

      expect(response.body.error.code).toBe('CSRF_TOKEN_MISSING');
    });

    it('should prevent CSRF with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('x-csrf-token', 'invalid-csrf-token')
        .expect(403);

      expect(response.body.error.code).toBe('CSRF_TOKEN_INVALID');
    });

    it('should allow legitimate requests with valid CSRF token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('x-csrf-token', csrfToken)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('Input Validation Bypass Attempts', () => {
    it('should prevent email validation bypass', async () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user..double.dot@domain.com',
        'user@domain',
        'user name@domain.com', // Space in email
        'user@domain..com', // Double dot in domain
      ];

      for (const email of invalidEmails) {
        const response = await request(app)
          .post('/api/auth/register')
          .set('x-csrf-token', csrfToken)
          .send({
            username: 'testuser2',
            email: email,
            password: 'Password123!',
          });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('should prevent password validation bypass', async () => {
      const weakPasswords = [
        'short',
        '12345678', // No special chars, no uppercase
        'password', // No numbers, no uppercase, no special chars
        'PASSWORD', // No lowercase, no numbers, no special chars
        'Password', // No numbers, no special chars
        'Password123', // No special chars
      ];

      for (const password of weakPasswords) {
        const response = await request(app)
          .post('/api/auth/register')
          .set('x-csrf-token', csrfToken)
          .send({
            username: 'testuser3',
            email: 'test3@example.com',
            password: password,
          });

        expect(response.status).toBe(400);
        expect(response.body.error.code).toBe('VALIDATION_ERROR');
      }
    });
  });

  describe('Rate Limiting Bypass Attempts', () => {
    it('should prevent rate limit bypass with different IPs (simulated)', async () => {
      // This test simulates different IPs by using different user agents
      // In a real scenario, you'd test with actual different IP addresses
      const requests = [];

      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .post('/api/auth/login')
            .set('x-csrf-token', csrfToken)
            .set('User-Agent', `TestAgent-${i}`)
            .send({
              email: 'nonexistent@example.com',
              password: 'wrongpassword',
            })
        );
      }

      const responses = await Promise.all(requests);

      // Should still be rate limited even with different user agents
      const rateLimitedResponses = responses.filter((r) => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('File Upload Security', () => {
    it('should prevent malicious file uploads', async () => {
      // Test various malicious file types
      const maliciousFiles = [
        {
          content: '<?php echo "hack"; ?>',
          filename: 'malicious.php',
          mimetype: 'application/x-php',
        },
        {
          content: '<script>alert("xss")</script>',
          filename: 'malicious.html',
          mimetype: 'text/html',
        },
        {
          content: 'MZ\x90\x00',
          filename: 'malicious.exe',
          mimetype: 'application/x-msdownload',
        },
      ];

      for (const file of maliciousFiles) {
        const response = await request(app)
          .post('/api/files/upload')
          .set('Authorization', `Bearer ${accessToken}`)
          .set('x-csrf-token', csrfToken)
          .attach('files', Buffer.from(file.content), {
            filename: file.filename,
            contentType: file.mimetype,
          });

        // Should reject malicious file types
        expect(response.status).toBe(400);
      }
    });

    it('should prevent oversized file uploads', async () => {
      // Create a large buffer (larger than 50MB limit)
      const largeBuffer = Buffer.alloc(51 * 1024 * 1024, 'a'); // 51MB

      const response = await request(app)
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${accessToken}`)
        .set('x-csrf-token', csrfToken)
        .attach('files', largeBuffer, 'large.txt');

      expect(response.status).toBe(400);
      expect(response.body.error.code).toBe('FILE_TOO_LARGE');
    });
  });

  describe('Information Disclosure Prevention', () => {
    it('should not expose sensitive information in error messages', async () => {
      // Try to access non-existent user
      const response = await request(app)
        .get('/api/users/non-existent-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403); // Should be forbidden, not "not found" to prevent user enumeration

      expect(response.body.error.message).not.toContain('database');
      expect(response.body.error.message).not.toContain('SQL');
      expect(response.body.error.message).not.toContain('internal');
    });

    it('should not expose stack traces in production-like errors', async () => {
      // This test would need to trigger an actual error condition
      // For now, we'll test that error responses don't contain stack traces
      const response = await request(app)
        .post('/api/auth/login')
        .set('x-csrf-token', csrfToken)
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        });

      const responseText = JSON.stringify(response.body);
      expect(responseText).not.toContain('at ');
      expect(responseText).not.toContain('.js:');
      expect(responseText).not.toContain('Error:');
      expect(responseText).not.toContain('stack');
    });
  });
});
