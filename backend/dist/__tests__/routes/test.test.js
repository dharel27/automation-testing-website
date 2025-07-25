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
import testRoutes from '../../routes/test';
import { globalErrorHandler } from '../../middleware/errorHandler';
describe('Test Routes', () => {
    let app;
    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/api/test', testRoutes);
        app.use(globalErrorHandler);
    });
    describe('GET /api/test/delay/:ms', () => {
        it('should simulate delay successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const startTime = Date.now();
            const response = yield request(app).get('/api/test/delay/100');
            const endTime = Date.now();
            const actualDelay = endTime - startTime;
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.delay).toBe(100);
            expect(response.body.data.message).toContain('100ms');
            expect(actualDelay).toBeGreaterThanOrEqual(90); // Allow some tolerance
        }));
        it('should reject invalid delay values', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app).get('/api/test/delay/invalid');
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('INVALID_DELAY');
        }));
        it('should reject negative delay values', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app).get('/api/test/delay/-100');
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('INVALID_DELAY');
        }));
        it('should reject delays that are too long', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app).get('/api/test/delay/31000');
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('DELAY_TOO_LONG');
        }));
    });
    describe('GET /api/test/error/:code', () => {
        const testCases = [
            { code: 400, expectedCode: 'BAD_REQUEST' },
            { code: 401, expectedCode: 'UNAUTHORIZED' },
            { code: 403, expectedCode: 'FORBIDDEN' },
            { code: 404, expectedCode: 'NOT_FOUND' },
            { code: 409, expectedCode: 'CONFLICT' },
            { code: 422, expectedCode: 'UNPROCESSABLE_ENTITY' },
            { code: 429, expectedCode: 'TOO_MANY_REQUESTS' },
            { code: 500, expectedCode: 'INTERNAL_SERVER_ERROR' },
            { code: 502, expectedCode: 'BAD_GATEWAY' },
            { code: 503, expectedCode: 'SERVICE_UNAVAILABLE' },
            { code: 504, expectedCode: 'GATEWAY_TIMEOUT' },
        ];
        testCases.forEach(({ code, expectedCode }) => {
            it(`should simulate ${code} error correctly`, () => __awaiter(void 0, void 0, void 0, function* () {
                const response = yield request(app).get(`/api/test/error/${code}`);
                expect(response.status).toBe(code);
                expect(response.body.success).toBe(false);
                expect(response.body.error.code).toBe(expectedCode);
                expect(response.body.error.message).toContain(`${code} error`);
            }));
        });
        it('should reject unsupported error codes', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app).get('/api/test/error/999');
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('UNSUPPORTED_ERROR_CODE');
        }));
    });
    describe('POST /api/test/echo', () => {
        it('should echo request data correctly', () => __awaiter(void 0, void 0, void 0, function* () {
            const testData = { message: 'Hello, World!' };
            const response = yield request(app).post('/api/test/echo').send(testData);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.method).toBe('POST');
            expect(response.body.data.body).toEqual(testData);
            expect(response.body.data.url).toBe('/api/test/echo');
        }));
        it('should handle empty request body', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app).post('/api/test/echo');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.body).toEqual({});
        }));
    });
    describe('GET /api/test/large-dataset', () => {
        it('should generate default dataset', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app).get('/api/test/large-dataset');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.items).toHaveLength(1000);
            expect(response.body.data.count).toBe(1000);
        }));
        it('should generate custom sized dataset', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app).get('/api/test/large-dataset?count=50');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.items).toHaveLength(50);
            expect(response.body.data.count).toBe(50);
        }));
        it('should reject datasets that are too large', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app).get('/api/test/large-dataset?count=20000');
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('DATASET_TOO_LARGE');
        }));
        it('should handle delay parameter', () => __awaiter(void 0, void 0, void 0, function* () {
            const startTime = Date.now();
            const response = yield request(app).get('/api/test/large-dataset?count=10&delay=100');
            const endTime = Date.now();
            const actualDelay = endTime - startTime;
            expect(response.status).toBe(200);
            expect(response.body.data.items).toHaveLength(10);
            expect(actualDelay).toBeGreaterThanOrEqual(90);
        }));
    });
    describe('GET /api/test/memory-intensive', () => {
        it('should handle default memory allocation', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app).get('/api/test/memory-intensive');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.allocatedBytes).toBe(1000000);
            expect(response.body.data.arrayLength).toBe(1000000);
        }));
        it('should handle custom memory allocation', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app).get('/api/test/memory-intensive?size=5000');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.allocatedBytes).toBe(5000);
            expect(response.body.data.arrayLength).toBe(5000);
        }));
        it('should reject memory allocation that is too large', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app).get('/api/test/memory-intensive?size=20000000');
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('MEMORY_LIMIT_EXCEEDED');
        }));
    });
    describe('GET /api/test/random-failure', () => {
        it('should handle 0% failure rate (always succeed)', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app).get('/api/test/random-failure?rate=0');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.failureRate).toBe(0);
        }));
        it('should handle 100% failure rate (always fail)', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app).get('/api/test/random-failure?rate=1');
            expect(response.status).toBe(500);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('RANDOM_FAILURE');
        }));
        it('should reject invalid failure rates', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app).get('/api/test/random-failure?rate=1.5');
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('INVALID_FAILURE_RATE');
        }));
        it('should reject negative failure rates', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app).get('/api/test/random-failure?rate=-0.1');
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('INVALID_FAILURE_RATE');
        }));
    });
    describe('GET /api/test/console-error', () => {
        const testCases = ['error', 'warn', 'info', 'debug'];
        testCases.forEach((type) => {
            it(`should generate console ${type} successfully`, () => __awaiter(void 0, void 0, void 0, function* () {
                const response = yield request(app).get(`/api/test/console-error?type=${type}`);
                expect(response.status).toBe(200);
                expect(response.body.success).toBe(true);
                expect(response.body.data.type).toBe(type);
                expect(response.body.data.message).toContain(`Console ${type} generated`);
            }));
        });
        it('should handle default error type', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app).get('/api/test/console-error');
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.type).toBe('error');
        }));
        it('should reject unsupported error types', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app).get('/api/test/console-error?type=invalid');
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('UNSUPPORTED_ERROR_TYPE');
        }));
    });
});
