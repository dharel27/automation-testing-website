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
import errorRoutes from '../../routes/errors';
import { globalErrorHandler } from '../../middleware/errorHandler';
const app = express();
app.use(express.json());
app.use('/api/errors', errorRoutes);
app.use(globalErrorHandler);
describe('Error Routes', () => {
    describe('POST /api/errors', () => {
        it('should accept valid error report', () => __awaiter(void 0, void 0, void 0, function* () {
            const errorReport = {
                message: 'Test error message',
                timestamp: new Date().toISOString(),
                userAgent: 'Mozilla/5.0 Test',
                url: 'http://localhost:3000/test',
                errorType: 'javascript',
                severity: 'medium',
                sessionId: 'test-session-123',
            };
            const response = yield request(app)
                .post('/api/errors')
                .send(errorReport)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.message).toBe('Error report received successfully');
            expect(response.body.data.reportId).toMatch(/^error_\d+_[a-z0-9]+$/);
        }));
        it('should reject error report without message', () => __awaiter(void 0, void 0, void 0, function* () {
            const errorReport = {
                timestamp: new Date().toISOString(),
                userAgent: 'Mozilla/5.0 Test',
                url: 'http://localhost:3000/test',
                errorType: 'javascript',
                severity: 'medium',
            };
            const response = yield request(app)
                .post('/api/errors')
                .send(errorReport)
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('INVALID_ERROR_REPORT');
        }));
        it('should reject error report without timestamp', () => __awaiter(void 0, void 0, void 0, function* () {
            const errorReport = {
                message: 'Test error message',
                userAgent: 'Mozilla/5.0 Test',
                url: 'http://localhost:3000/test',
                errorType: 'javascript',
                severity: 'medium',
            };
            const response = yield request(app)
                .post('/api/errors')
                .send(errorReport)
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('INVALID_ERROR_REPORT');
        }));
        it('should handle different error types', () => __awaiter(void 0, void 0, void 0, function* () {
            const errorTypes = ['javascript', 'network', 'boundary', 'unhandled'];
            for (const errorType of errorTypes) {
                const errorReport = {
                    message: `Test ${errorType} error`,
                    timestamp: new Date().toISOString(),
                    userAgent: 'Mozilla/5.0 Test',
                    url: 'http://localhost:3000/test',
                    errorType,
                    severity: 'medium',
                };
                const response = yield request(app)
                    .post('/api/errors')
                    .send(errorReport)
                    .expect(200);
                expect(response.body.success).toBe(true);
            }
        }));
        it('should handle different severity levels', () => __awaiter(void 0, void 0, void 0, function* () {
            const severities = ['low', 'medium', 'high', 'critical'];
            for (const severity of severities) {
                const errorReport = {
                    message: `Test ${severity} error`,
                    timestamp: new Date().toISOString(),
                    userAgent: 'Mozilla/5.0 Test',
                    url: 'http://localhost:3000/test',
                    errorType: 'javascript',
                    severity,
                };
                const response = yield request(app)
                    .post('/api/errors')
                    .send(errorReport)
                    .expect(200);
                expect(response.body.success).toBe(true);
            }
        }));
    });
    describe('GET /api/errors', () => {
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            // Clear any existing errors
            yield request(app).delete('/api/errors');
            // Add some test error reports
            const testErrors = [
                {
                    message: 'JavaScript error 1',
                    timestamp: new Date().toISOString(),
                    userAgent: 'Mozilla/5.0 Test',
                    url: 'http://localhost:3000/test1',
                    errorType: 'javascript',
                    severity: 'high',
                    sessionId: 'session-1',
                },
                {
                    message: 'Network error 1',
                    timestamp: new Date().toISOString(),
                    userAgent: 'Mozilla/5.0 Test',
                    url: 'http://localhost:3000/test2',
                    errorType: 'network',
                    severity: 'medium',
                    sessionId: 'session-2',
                },
                {
                    message: 'Boundary error 1',
                    timestamp: new Date().toISOString(),
                    userAgent: 'Mozilla/5.0 Test',
                    url: 'http://localhost:3000/test3',
                    errorType: 'boundary',
                    severity: 'critical',
                    sessionId: 'session-1',
                },
            ];
            for (const error of testErrors) {
                yield request(app).post('/api/errors').send(error);
            }
        }));
        it('should return paginated error reports', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app).get('/api/errors').expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.reports).toHaveLength(3);
            expect(response.body.data.pagination).toMatchObject({
                page: 1,
                limit: 50,
                total: 3,
                totalPages: 1,
            });
        }));
        it('should filter by severity', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .get('/api/errors?severity=high')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.reports).toHaveLength(1);
            expect(response.body.data.reports[0].severity).toBe('high');
        }));
        it('should filter by error type', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .get('/api/errors?errorType=network')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.reports).toHaveLength(1);
            expect(response.body.data.reports[0].errorType).toBe('network');
        }));
        it('should filter by session ID', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .get('/api/errors?sessionId=session-1')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.reports).toHaveLength(2);
            expect(response.body.data.reports.every((r) => r.sessionId === 'session-1')).toBe(true);
        }));
        it('should handle pagination', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .get('/api/errors?page=1&limit=2')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.reports).toHaveLength(2);
            expect(response.body.data.pagination).toMatchObject({
                page: 1,
                limit: 2,
                total: 3,
                totalPages: 2,
            });
        }));
        it('should sort by timestamp (newest first)', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app).get('/api/errors').expect(200);
            expect(response.body.success).toBe(true);
            const reports = response.body.data.reports;
            for (let i = 1; i < reports.length; i++) {
                const current = new Date(reports[i].timestamp);
                const previous = new Date(reports[i - 1].timestamp);
                expect(current.getTime()).toBeLessThanOrEqual(previous.getTime());
            }
        }));
    });
    describe('GET /api/errors/stats', () => {
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            // Clear any existing errors
            yield request(app).delete('/api/errors');
            // Add test error reports with different characteristics
            const testErrors = [
                {
                    message: 'Error 1',
                    timestamp: new Date().toISOString(),
                    userAgent: 'Mozilla/5.0 Test',
                    url: 'http://localhost:3000/test',
                    errorType: 'javascript',
                    severity: 'high',
                },
                {
                    message: 'Error 1', // Duplicate message
                    timestamp: new Date().toISOString(),
                    userAgent: 'Mozilla/5.0 Test',
                    url: 'http://localhost:3000/test',
                    errorType: 'network',
                    severity: 'medium',
                },
                {
                    message: 'Error 2',
                    timestamp: new Date().toISOString(),
                    userAgent: 'Mozilla/5.0 Test',
                    url: 'http://localhost:3000/test',
                    errorType: 'javascript',
                    severity: 'critical',
                },
            ];
            for (const error of testErrors) {
                yield request(app).post('/api/errors').send(error);
            }
        }));
        it('should return error statistics', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app).get('/api/errors/stats').expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toMatchObject({
                total: 3,
                last24Hours: 3,
                lastWeek: 3,
                bySeverity: {
                    high: 1,
                    medium: 1,
                    critical: 1,
                },
                byType: {
                    javascript: 2,
                    network: 1,
                },
            });
            expect(response.body.data.topMessages).toHaveLength(2);
            expect(response.body.data.topMessages[0]).toMatchObject({
                message: 'Error 1',
                count: 2,
            });
        }));
        it('should handle empty error list', () => __awaiter(void 0, void 0, void 0, function* () {
            yield request(app).delete('/api/errors');
            const response = yield request(app).get('/api/errors/stats').expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toMatchObject({
                total: 0,
                last24Hours: 0,
                lastWeek: 0,
                bySeverity: {},
                byType: {},
                topMessages: [],
                oldestReport: null,
                newestReport: null,
            });
        }));
    });
    describe('DELETE /api/errors', () => {
        beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
            // Add some test errors
            const testError = {
                message: 'Test error to be cleared',
                timestamp: new Date().toISOString(),
                userAgent: 'Mozilla/5.0 Test',
                url: 'http://localhost:3000/test',
                errorType: 'javascript',
                severity: 'medium',
            };
            yield request(app).post('/api/errors').send(testError);
        }));
        it('should clear all error reports', () => __awaiter(void 0, void 0, void 0, function* () {
            // Verify errors exist
            const beforeResponse = yield request(app).get('/api/errors');
            expect(beforeResponse.body.data.reports.length).toBeGreaterThan(0);
            // Clear errors
            const response = yield request(app).delete('/api/errors').expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.message).toContain('Cleared');
            expect(response.body.data.clearedCount).toBeGreaterThan(0);
            // Verify errors are cleared
            const afterResponse = yield request(app).get('/api/errors');
            expect(afterResponse.body.data.reports).toHaveLength(0);
        }));
        it('should handle clearing empty error list', () => __awaiter(void 0, void 0, void 0, function* () {
            // Clear first
            yield request(app).delete('/api/errors');
            // Clear again
            const response = yield request(app).delete('/api/errors').expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.clearedCount).toBe(0);
        }));
    });
    describe('Error handling', () => {
        it('should handle malformed JSON', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .post('/api/errors')
                .set('Content-Type', 'application/json')
                .send('invalid json')
                .expect(400);
            expect(response.body.success).toBe(false);
        }));
        it('should handle missing content-type', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .post('/api/errors')
                .send('not json')
                .expect(400);
            expect(response.body.success).toBe(false);
        }));
    });
});
