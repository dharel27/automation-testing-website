var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import request from 'supertest';
import app from '../../index';
import { getDatabase } from '../../database/connection';
import { User } from '../../models/User';
import { Session } from '../../models/Session';
describe('Security Integration Tests', () => {
    let db;
    let userModel;
    let sessionModel;
    let testUser;
    let accessToken;
    let refreshToken;
    let csrfToken;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        db = yield getDatabase();
        userModel = new User(db);
        sessionModel = new Session(db);
    }));
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        // Clean up database
        yield db.run('DELETE FROM users');
        yield db.run('DELETE FROM sessions');
        // Create test user
        testUser = yield userModel.create({
            username: 'testuser',
            email: 'test@example.com',
            password: 'Password123!',
            role: 'user',
            profile: {},
        });
        // Get CSRF token
        const csrfResponse = yield request(app).get('/api/csrf-token');
        csrfToken = csrfResponse.body.data.csrfToken;
    }));
    describe('Authentication Security', () => {
        it('should enforce rate limiting on login attempts', () => __awaiter(void 0, void 0, void 0, function* () {
            const loginData = {
                email: 'test@example.com',
                password: 'wrongpassword',
            };
            // Make multiple failed login attempts
            for (let i = 0; i < 6; i++) {
                const response = yield request(app)
                    .post('/api/auth/login')
                    .set('x-csrf-token', csrfToken)
                    .send(loginData);
                if (i < 5) {
                    expect(response.status).toBe(401); // Invalid credentials
                }
                else {
                    expect(response.status).toBe(429); // Rate limited
                    expect(response.body.error.code).toBe('AUTH_RATE_LIMIT_EXCEEDED');
                }
            }
        }));
        it('should sanitize malicious input in registration', () => __awaiter(void 0, void 0, void 0, function* () {
            const maliciousData = {
                username: '<script>alert("xss")</script>testuser',
                email: 'test2@example.com',
                password: 'Password123!',
                profile: {
                    firstName: '<img src="x" onerror="alert(1)">John',
                    lastName: 'Doe<svg onload="alert(1)">',
                },
            };
            const response = yield request(app)
                .post('/api/auth/register')
                .set('x-csrf-token', csrfToken)
                .send(maliciousData)
                .expect(201);
            expect(response.body.data.user.username).toBe('testuser');
            expect(response.body.data.user.profile.firstName).toBe('John');
            expect(response.body.data.user.profile.lastName).toBe('Doe');
        }));
        it('should validate password strength', () => __awaiter(void 0, void 0, void 0, function* () {
            const weakPasswordData = {
                username: 'testuser2',
                email: 'test2@example.com',
                password: 'weak',
            };
            const response = yield request(app)
                .post('/api/auth/register')
                .set('x-csrf-token', csrfToken)
                .send(weakPasswordData)
                .expect(400);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
            expect(response.body.error.details).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    field: 'password',
                    message: expect.stringContaining('Password must contain'),
                }),
            ]));
        }));
        it('should require CSRF token for state-changing operations', () => __awaiter(void 0, void 0, void 0, function* () {
            const loginData = {
                email: 'test@example.com',
                password: 'Password123!',
            };
            // Should fail without CSRF token
            const response = yield request(app)
                .post('/api/auth/login')
                .send(loginData)
                .expect(403);
            expect(response.body.error.code).toBe('CSRF_TOKEN_MISSING');
        }));
    });
    describe('Token Refresh Security', () => {
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            // Login to get tokens
            const loginResponse = yield request(app)
                .post('/api/auth/login')
                .set('x-csrf-token', csrfToken)
                .send({
                email: 'test@example.com',
                password: 'Password123!',
            });
            accessToken = loginResponse.body.data.accessToken;
            refreshToken = loginResponse.body.data.refreshToken;
        }));
        it('should refresh tokens with valid refresh token', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .post('/api/auth/refresh')
                .set('x-csrf-token', csrfToken)
                .send({ refreshToken })
                .expect(200);
            expect(response.body.data.accessToken).toBeDefined();
            expect(response.body.data.refreshToken).toBeDefined();
            expect(response.body.data.accessToken).not.toBe(accessToken);
            expect(response.body.data.refreshToken).not.toBe(refreshToken);
        }));
        it('should reject invalid refresh token', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .post('/api/auth/refresh')
                .set('x-csrf-token', csrfToken)
                .send({ refreshToken: 'invalid-token' })
                .expect(401);
            expect(response.body.error.code).toBe('INVALID_REFRESH_TOKEN');
        }));
        it('should revoke all sessions on logout-all', () => __awaiter(void 0, void 0, void 0, function* () {
            // Create multiple sessions by logging in multiple times
            const session2Response = yield request(app)
                .post('/api/auth/login')
                .set('x-csrf-token', csrfToken)
                .send({
                email: 'test@example.com',
                password: 'Password123!',
            });
            // Verify we have multiple sessions
            const sessionsBeforeLogout = yield sessionModel.findValidByUserId(testUser.id);
            expect(sessionsBeforeLogout.length).toBeGreaterThan(1);
            // Logout from all devices
            yield request(app)
                .post('/api/auth/logout-all')
                .set('Authorization', `Bearer ${accessToken}`)
                .set('x-csrf-token', csrfToken)
                .expect(200);
            // Verify all sessions are revoked
            const sessionsAfterLogout = yield sessionModel.findValidByUserId(testUser.id);
            expect(sessionsAfterLogout.length).toBe(0);
        }));
    });
    describe('Input Validation Security', () => {
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            // Login to get access token
            const loginResponse = yield request(app)
                .post('/api/auth/login')
                .set('x-csrf-token', csrfToken)
                .send({
                email: 'test@example.com',
                password: 'Password123!',
            });
            accessToken = loginResponse.body.data.accessToken;
        }));
        it('should validate email format in profile update', () => __awaiter(void 0, void 0, void 0, function* () {
            const invalidData = {
                email: 'invalid-email-format',
            };
            const response = yield request(app)
                .put('/api/auth/profile')
                .set('Authorization', `Bearer ${accessToken}`)
                .set('x-csrf-token', csrfToken)
                .send(invalidData)
                .expect(400);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        }));
        it('should validate username format in profile update', () => __awaiter(void 0, void 0, void 0, function* () {
            const invalidData = {
                username: 'ab', // Too short
            };
            const response = yield request(app)
                .put('/api/auth/profile')
                .set('Authorization', `Bearer ${accessToken}`)
                .set('x-csrf-token', csrfToken)
                .send(invalidData)
                .expect(400);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        }));
        it('should sanitize XSS attempts in profile update', () => __awaiter(void 0, void 0, void 0, function* () {
            const maliciousData = {
                profile: {
                    firstName: '<script>alert("xss")</script>John',
                    lastName: '<img src="x" onerror="alert(1)">Doe',
                },
            };
            const response = yield request(app)
                .put('/api/auth/profile')
                .set('Authorization', `Bearer ${accessToken}`)
                .set('x-csrf-token', csrfToken)
                .send(maliciousData)
                .expect(200);
            expect(response.body.data.user.profile.firstName).toBe('John');
            expect(response.body.data.user.profile.lastName).toBe('Doe');
        }));
    });
    describe('File Upload Security', () => {
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            // Login to get access token
            const loginResponse = yield request(app)
                .post('/api/auth/login')
                .set('x-csrf-token', csrfToken)
                .send({
                email: 'test@example.com',
                password: 'Password123!',
            });
            accessToken = loginResponse.body.data.accessToken;
        }));
        it('should enforce rate limiting on file uploads', () => __awaiter(void 0, void 0, void 0, function* () {
            // This test would need to be adjusted based on the actual rate limit configuration
            // and might require mocking or using a test-specific configuration
            const fileBuffer = Buffer.from('test file content');
            // Make multiple upload requests
            for (let i = 0; i < 12; i++) {
                const response = yield request(app)
                    .post('/api/files/upload')
                    .set('Authorization', `Bearer ${accessToken}`)
                    .set('x-csrf-token', csrfToken)
                    .attach('files', fileBuffer, 'test.txt');
                if (i < 10) {
                    expect([200, 201]).toContain(response.status);
                }
                else {
                    expect(response.status).toBe(429); // Rate limited
                }
            }
        }));
        it('should require authentication for file upload', () => __awaiter(void 0, void 0, void 0, function* () {
            const fileBuffer = Buffer.from('test file content');
            const response = yield request(app)
                .post('/api/files/upload')
                .set('x-csrf-token', csrfToken)
                .attach('files', fileBuffer, 'test.txt')
                .expect(401);
            expect(response.body.error.code).toBe('MISSING_ACCESS_TOKEN');
        }));
    });
    describe('Security Headers', () => {
        it('should set security headers on all responses', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app).get('/api/health').expect(200);
            expect(response.headers['x-frame-options']).toBe('DENY');
            expect(response.headers['x-content-type-options']).toBe('nosniff');
            expect(response.headers['x-xss-protection']).toBe('1; mode=block');
            expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
            expect(response.headers['content-security-policy']).toContain("default-src 'self'");
        }));
    });
    describe('General Rate Limiting', () => {
        it('should apply general rate limiting to API endpoints', () => __awaiter(void 0, void 0, void 0, function* () {
            // Make many requests to trigger rate limiting
            // Note: This test might need adjustment based on actual rate limit configuration
            const promises = [];
            for (let i = 0; i < 105; i++) {
                promises.push(request(app).get('/api/health'));
            }
            const responses = yield Promise.all(promises);
            const rateLimitedResponses = responses.filter((r) => r.status === 429);
            // Should have some rate limited responses
            expect(rateLimitedResponses.length).toBeGreaterThan(0);
        }));
    });
});
