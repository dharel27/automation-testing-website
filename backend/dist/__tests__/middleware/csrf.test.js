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
import cookieParser from 'cookie-parser';
import { csrfProtection, getCsrfToken } from '../../middleware/csrf';
describe('CSRF Protection Middleware', () => {
    let app;
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
        it('should generate CSRF token', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app).get('/csrf-token').expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.csrfToken).toBeDefined();
            expect(typeof response.body.data.csrfToken).toBe('string');
            expect(response.body.data.csrfToken).toMatch(/^[a-f0-9]+\.[a-f0-9]+$/);
        }));
        it('should set CSRF token in cookie', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app).get('/csrf-token').expect(200);
            expect(response.headers['set-cookie']).toBeDefined();
            const cookieHeader = response.headers['set-cookie'][0];
            expect(cookieHeader).toContain('csrf-token=');
        }));
    });
    describe('CSRF Token Validation', () => {
        let csrfToken;
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            app.get('/csrf-token', getCsrfToken);
            app.post('/protected', (req, res) => {
                res.json({ success: true, message: 'Protected route accessed' });
            });
            // Get CSRF token first
            const tokenResponse = yield request(app).get('/csrf-token');
            csrfToken = tokenResponse.body.data.csrfToken;
        }));
        it('should allow GET requests without CSRF token', () => __awaiter(void 0, void 0, void 0, function* () {
            app.get('/test', (req, res) => {
                res.json({ success: true });
            });
            yield request(app).get('/test').expect(200);
        }));
        it('should allow HEAD requests without CSRF token', () => __awaiter(void 0, void 0, void 0, function* () {
            app.head('/test', (req, res) => {
                res.status(200).end();
            });
            yield request(app).head('/test').expect(200);
        }));
        it('should allow OPTIONS requests without CSRF token', () => __awaiter(void 0, void 0, void 0, function* () {
            app.options('/test', (req, res) => {
                res.status(200).end();
            });
            yield request(app).options('/test').expect(200);
        }));
        it('should reject POST requests without CSRF token', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .post('/protected')
                .send({ data: 'test' })
                .expect(403);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('CSRF_TOKEN_MISSING');
        }));
        it('should reject POST requests with invalid CSRF token', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .post('/protected')
                .set('x-csrf-token', 'invalid-token')
                .send({ data: 'test' })
                .expect(403);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('CSRF_TOKEN_INVALID');
        }));
        it('should accept POST requests with valid CSRF token in header', () => __awaiter(void 0, void 0, void 0, function* () {
            yield request(app)
                .post('/protected')
                .set('x-csrf-token', csrfToken)
                .send({ data: 'test' })
                .expect(200);
        }));
        it('should accept POST requests with valid CSRF token in body', () => __awaiter(void 0, void 0, void 0, function* () {
            yield request(app)
                .post('/protected')
                .send({ data: 'test', _csrf: csrfToken })
                .expect(200);
        }));
        it('should reject requests with malformed CSRF token', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .post('/protected')
                .set('x-csrf-token', 'malformed-token-without-dot')
                .send({ data: 'test' })
                .expect(403);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('CSRF_TOKEN_INVALID');
        }));
        it('should reject PUT requests without CSRF token', () => __awaiter(void 0, void 0, void 0, function* () {
            app.put('/protected', (req, res) => {
                res.json({ success: true });
            });
            const response = yield request(app)
                .put('/protected')
                .send({ data: 'test' })
                .expect(403);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('CSRF_TOKEN_MISSING');
        }));
        it('should reject DELETE requests without CSRF token', () => __awaiter(void 0, void 0, void 0, function* () {
            app.delete('/protected', (req, res) => {
                res.json({ success: true });
            });
            const response = yield request(app).delete('/protected').expect(403);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('CSRF_TOKEN_MISSING');
        }));
    });
    describe('CSRF Configuration', () => {
        it('should use custom header name', () => __awaiter(void 0, void 0, void 0, function* () {
            const customApp = express();
            customApp.use(express.json());
            customApp.use(cookieParser());
            customApp.use(csrfProtection({ headerName: 'x-custom-csrf' }));
            customApp.get('/csrf-token', getCsrfToken);
            customApp.post('/protected', (req, res) => {
                res.json({ success: true });
            });
            // Get CSRF token
            const tokenResponse = yield request(customApp).get('/csrf-token');
            const csrfToken = tokenResponse.body.data.csrfToken;
            // Should reject with standard header
            yield request(customApp)
                .post('/protected')
                .set('x-csrf-token', csrfToken)
                .send({ data: 'test' })
                .expect(403);
            // Should accept with custom header
            yield request(customApp)
                .post('/protected')
                .set('x-custom-csrf', csrfToken)
                .send({ data: 'test' })
                .expect(200);
        }));
        it('should use custom cookie name', () => __awaiter(void 0, void 0, void 0, function* () {
            const customApp = express();
            customApp.use(express.json());
            customApp.use(cookieParser());
            customApp.use(csrfProtection({ cookieName: 'custom-csrf-token' }));
            customApp.get('/csrf-token', getCsrfToken);
            const response = yield request(customApp).get('/csrf-token').expect(200);
            const cookieHeader = response.headers['set-cookie'][0];
            expect(cookieHeader).toContain('custom-csrf-token=');
        }));
    });
});
