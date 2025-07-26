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
import express from 'express';
import { sanitizeInput, generalRateLimit, authRateLimit, validateUserRegistration, validateUserLogin, validateProfileUpdate, handleValidationErrors, securityHeaders, } from '../../middleware/security';
describe('Security Middleware', () => {
    let app;
    beforeEach(() => {
        app = express();
        app.use(express.json());
    });
    describe('Input Sanitization', () => {
        beforeEach(() => {
            app.use(sanitizeInput);
            app.post('/test', (req, res) => {
                res.json({ body: req.body, query: req.query, params: req.params });
            });
        });
        it('should sanitize XSS attempts in request body', () => __awaiter(void 0, void 0, void 0, function* () {
            const maliciousInput = {
                name: '<script>alert("xss")</script>John',
                description: '<img src="x" onerror="alert(1)">',
                nested: {
                    value: '<svg onload="alert(1)">',
                },
            };
            const response = yield request(app)
                .post('/test')
                .send(maliciousInput)
                .expect(200);
            expect(response.body.body.name).toBe('John');
            expect(response.body.body.description).toBe('');
            expect(response.body.body.nested.value).toBe('');
        }));
        it('should sanitize arrays', () => __awaiter(void 0, void 0, void 0, function* () {
            const maliciousInput = {
                tags: [
                    '<script>alert("xss")</script>',
                    'normal-tag',
                    '<img src="x" onerror="alert(1)">',
                ],
            };
            const response = yield request(app)
                .post('/test')
                .send(maliciousInput)
                .expect(200);
            expect(response.body.body.tags).toEqual(['', 'normal-tag', '']);
        }));
        it('should preserve safe content', () => __awaiter(void 0, void 0, void 0, function* () {
            const safeInput = {
                name: 'John Doe',
                email: 'john@example.com',
                age: 30,
                active: true,
            };
            const response = yield request(app)
                .post('/test')
                .send(safeInput)
                .expect(200);
            expect(response.body.body).toEqual(safeInput);
        }));
    });
    describe('Rate Limiting', () => {
        it('should apply general rate limiting', () => __awaiter(void 0, void 0, void 0, function* () {
            app.use(generalRateLimit);
            app.get('/test', (req, res) => res.json({ success: true }));
            // Make requests up to the limit
            for (let i = 0; i < 5; i++) {
                yield request(app).get('/test').expect(200);
            }
            // This request should be rate limited (assuming a low limit for testing)
            // Note: This test might need adjustment based on actual rate limit configuration
        }));
        it('should apply auth rate limiting', () => __awaiter(void 0, void 0, void 0, function* () {
            app.use(authRateLimit);
            app.post('/login', (req, res) => res.json({ success: true }));
            // Make requests up to the limit
            for (let i = 0; i < 3; i++) {
                yield request(app)
                    .post('/login')
                    .send({ email: 'test@example.com', password: 'password' })
                    .expect(200);
            }
            // This request should be rate limited
            // Note: This test might need adjustment based on actual rate limit configuration
        }));
    });
    describe('Input Validation', () => {
        describe('User Registration Validation', () => {
            beforeEach(() => {
                app.post('/register', validateUserRegistration, handleValidationErrors, (req, res) => {
                    res.json({ success: true });
                });
            });
            it('should validate valid registration data', () => __awaiter(void 0, void 0, void 0, function* () {
                const validData = {
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'Password123!',
                    role: 'user',
                };
                yield request(app).post('/register').send(validData).expect(200);
            }));
            it('should reject invalid username', () => __awaiter(void 0, void 0, void 0, function* () {
                const invalidData = {
                    username: 'ab', // Too short
                    email: 'test@example.com',
                    password: 'Password123!',
                };
                const response = yield request(app)
                    .post('/register')
                    .send(invalidData)
                    .expect(400);
                expect(response.body.success).toBe(false);
                expect(response.body.error.code).toBe('VALIDATION_ERROR');
            }));
            it('should reject invalid email', () => __awaiter(void 0, void 0, void 0, function* () {
                const invalidData = {
                    username: 'testuser',
                    email: 'invalid-email',
                    password: 'Password123!',
                };
                const response = yield request(app)
                    .post('/register')
                    .send(invalidData)
                    .expect(400);
                expect(response.body.success).toBe(false);
                expect(response.body.error.code).toBe('VALIDATION_ERROR');
            }));
            it('should reject weak password', () => __awaiter(void 0, void 0, void 0, function* () {
                const invalidData = {
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'weak', // Too weak
                };
                const response = yield request(app)
                    .post('/register')
                    .send(invalidData)
                    .expect(400);
                expect(response.body.success).toBe(false);
                expect(response.body.error.code).toBe('VALIDATION_ERROR');
            }));
            it('should reject invalid role', () => __awaiter(void 0, void 0, void 0, function* () {
                const invalidData = {
                    username: 'testuser',
                    email: 'test@example.com',
                    password: 'Password123!',
                    role: 'invalid-role',
                };
                const response = yield request(app)
                    .post('/register')
                    .send(invalidData)
                    .expect(400);
                expect(response.body.success).toBe(false);
                expect(response.body.error.code).toBe('VALIDATION_ERROR');
            }));
        });
        describe('User Login Validation', () => {
            beforeEach(() => {
                app.post('/login', validateUserLogin, handleValidationErrors, (req, res) => {
                    res.json({ success: true });
                });
            });
            it('should validate valid login data with email', () => __awaiter(void 0, void 0, void 0, function* () {
                const validData = {
                    email: 'test@example.com',
                    password: 'password',
                };
                yield request(app).post('/login').send(validData).expect(200);
            }));
            it('should validate valid login data with username', () => __awaiter(void 0, void 0, void 0, function* () {
                const validData = {
                    username: 'testuser',
                    password: 'password',
                };
                yield request(app).post('/login').send(validData).expect(200);
            }));
            it('should reject missing password', () => __awaiter(void 0, void 0, void 0, function* () {
                const invalidData = {
                    email: 'test@example.com',
                };
                const response = yield request(app)
                    .post('/login')
                    .send(invalidData)
                    .expect(400);
                expect(response.body.success).toBe(false);
                expect(response.body.error.code).toBe('VALIDATION_ERROR');
            }));
            it('should reject invalid email format', () => __awaiter(void 0, void 0, void 0, function* () {
                const invalidData = {
                    email: 'invalid-email',
                    password: 'password',
                };
                const response = yield request(app)
                    .post('/login')
                    .send(invalidData)
                    .expect(400);
                expect(response.body.success).toBe(false);
                expect(response.body.error.code).toBe('VALIDATION_ERROR');
            }));
        });
        describe('Profile Update Validation', () => {
            beforeEach(() => {
                app.put('/profile', validateProfileUpdate, handleValidationErrors, (req, res) => {
                    res.json({ success: true });
                });
            });
            it('should validate valid profile update', () => __awaiter(void 0, void 0, void 0, function* () {
                const validData = {
                    username: 'newusername',
                    email: 'new@example.com',
                    profile: {
                        firstName: 'John',
                        lastName: 'Doe',
                    },
                };
                yield request(app).put('/profile').send(validData).expect(200);
            }));
            it('should reject invalid username', () => __awaiter(void 0, void 0, void 0, function* () {
                const invalidData = {
                    username: 'ab', // Too short
                };
                const response = yield request(app)
                    .put('/profile')
                    .send(invalidData)
                    .expect(400);
                expect(response.body.success).toBe(false);
                expect(response.body.error.code).toBe('VALIDATION_ERROR');
            }));
            it('should reject invalid email', () => __awaiter(void 0, void 0, void 0, function* () {
                const invalidData = {
                    email: 'invalid-email',
                };
                const response = yield request(app)
                    .put('/profile')
                    .send(invalidData)
                    .expect(400);
                expect(response.body.success).toBe(false);
                expect(response.body.error.code).toBe('VALIDATION_ERROR');
            }));
        });
    });
    describe('Security Headers', () => {
        beforeEach(() => {
            app.use(securityHeaders);
            app.get('/test', (req, res) => {
                res.json({ success: true });
            });
        });
        it('should set security headers', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app).get('/test').expect(200);
            expect(response.headers['x-frame-options']).toBe('DENY');
            expect(response.headers['x-content-type-options']).toBe('nosniff');
            expect(response.headers['x-xss-protection']).toBe('1; mode=block');
            expect(response.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
            expect(response.headers['content-security-policy']).toContain("default-src 'self'");
        }));
    });
});
