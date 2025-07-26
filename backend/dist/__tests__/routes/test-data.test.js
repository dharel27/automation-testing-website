/**
 * Tests for test data management routes
 */
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
import { db } from '../../database/connection';
describe('Test Data Routes', () => {
    beforeEach(() => __awaiter(void 0, void 0, void 0, function* () {
        // Clean up database before each test
        yield db.run('DELETE FROM sessions');
        yield db.run('DELETE FROM file_records');
        yield db.run('DELETE FROM products');
        yield db.run('DELETE FROM users');
        yield db.run('DELETE FROM sqlite_sequence');
    }));
    describe('POST /api/test-data/reset', () => {
        it('should reset all test data', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .post('/api/test-data/reset')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('All test data has been reset');
            expect(response.body.timestamp).toBeDefined();
        }));
    });
    describe('POST /api/test-data/seed/users', () => {
        it('should seed test users', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .post('/api/test-data/seed/users')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(4); // 4 test users
            expect(response.body.data[0]).toMatchObject({
                username: 'testuser1',
                email: 'test1@example.com',
                role: 'user',
                profile: {
                    firstName: 'John',
                    lastName: 'Doe',
                },
            });
        }));
        it('should include admin and guest users', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .post('/api/test-data/seed/users')
                .expect(200);
            const users = response.body.data;
            const adminUser = users.find((u) => u.role === 'admin');
            const guestUser = users.find((u) => u.role === 'guest');
            expect(adminUser).toBeDefined();
            expect(adminUser.email).toBe('admin@example.com');
            expect(guestUser).toBeDefined();
            expect(guestUser.email).toBe('guest@example.com');
        }));
    });
    describe('POST /api/test-data/seed/products', () => {
        it('should seed test products', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .post('/api/test-data/seed/products')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(5); // 5 test products
            expect(response.body.data[0]).toMatchObject({
                name: 'Test Product 1',
                category: 'Electronics',
                price: 29.99,
                inStock: true,
                tags: ['test', 'electronics', 'automation'],
            });
        }));
        it('should include products with different categories', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .post('/api/test-data/seed/products')
                .expect(200);
            const products = response.body.data;
            const categories = [...new Set(products.map((p) => p.category))];
            expect(categories).toContain('Electronics');
            expect(categories).toContain('Books');
            expect(categories).toContain('Home');
            expect(categories).toContain('Clothing');
        }));
    });
    describe('POST /api/test-data/seed/all', () => {
        it('should seed all test data', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .post('/api/test-data/seed/all')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.users).toBe(4);
            expect(response.body.data.products).toBe(5);
            expect(response.body.seededData.users).toHaveLength(4);
            expect(response.body.seededData.products).toHaveLength(5);
        }));
        it('should reset data before seeding', () => __awaiter(void 0, void 0, void 0, function* () {
            // First seed some data
            yield request(app).post('/api/test-data/seed/users');
            // Then seed all (which should reset first)
            const response = yield request(app)
                .post('/api/test-data/seed/all')
                .expect(200);
            // Should still have exactly the expected counts
            expect(response.body.data.users).toBe(4);
            expect(response.body.data.products).toBe(5);
        }));
    });
    describe('POST /api/test-data/seed/large-dataset', () => {
        it('should generate large dataset with default count', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .post('/api/test-data/seed/large-dataset')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.count).toBe(1000);
            expect(response.body.data.categories).toBeGreaterThan(0);
            expect(response.body.data.sampleProducts).toHaveLength(5);
        }));
        it('should generate custom count dataset', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .post('/api/test-data/seed/large-dataset')
                .send({ count: 100 })
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.count).toBe(100);
        }));
        it('should limit maximum count', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .post('/api/test-data/seed/large-dataset')
                .send({ count: 20000 }) // Above the 10000 limit
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.count).toBe(10000); // Should be capped
        }));
        it('should generate products with performance testing attributes', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .post('/api/test-data/seed/large-dataset')
                .send({ count: 10 })
                .expect(200);
            const sampleProduct = response.body.data.sampleProducts[0];
            expect(sampleProduct.name).toContain('Performance Test Product');
            expect(sampleProduct.priority).toBeDefined();
            expect(sampleProduct.value).toBeDefined();
            expect(sampleProduct.active).toBeDefined();
        }));
    });
    describe('GET /api/test-data/status', () => {
        it('should return current data counts', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .get('/api/test-data/status')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toMatchObject({
                users: 0,
                products: 0,
                sessions: 0,
                files: 0,
            });
        }));
        it('should return correct counts after seeding', () => __awaiter(void 0, void 0, void 0, function* () {
            // Seed some data
            yield request(app).post('/api/test-data/seed/users');
            yield request(app).post('/api/test-data/seed/products');
            const response = yield request(app)
                .get('/api/test-data/status')
                .expect(200);
            expect(response.body.data).toMatchObject({
                users: 4,
                products: 5,
                sessions: 0,
                files: 0,
            });
        }));
    });
    describe('POST /api/test-data/create-test-user', () => {
        it('should create test user with default values', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .post('/api/test-data/create-test-user')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toMatchObject({
                username: 'automation-user',
                email: 'automation@test.com',
                role: 'user',
                profile: {
                    firstName: 'Automation',
                    lastName: 'Test',
                },
            });
        }));
        it('should create test user with custom values', () => __awaiter(void 0, void 0, void 0, function* () {
            const userData = {
                username: 'custom-user',
                email: 'custom@test.com',
                password: 'custom123',
                role: 'admin',
                profile: {
                    firstName: 'Custom',
                    lastName: 'User',
                },
            };
            const response = yield request(app)
                .post('/api/test-data/create-test-user')
                .send(userData)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toMatchObject({
                username: 'custom-user',
                email: 'custom@test.com',
                role: 'admin',
                profile: {
                    firstName: 'Custom',
                    lastName: 'User',
                },
            });
        }));
        it('should return error if user already exists', () => __awaiter(void 0, void 0, void 0, function* () {
            const userData = {
                email: 'duplicate@test.com',
            };
            // Create user first time
            yield request(app)
                .post('/api/test-data/create-test-user')
                .send(userData)
                .expect(200);
            // Try to create same user again
            const response = yield request(app)
                .post('/api/test-data/create-test-user')
                .send(userData)
                .expect(409);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('USER_EXISTS');
        }));
    });
    describe('Error handling', () => {
        it('should handle database errors gracefully', () => __awaiter(void 0, void 0, void 0, function* () {
            // Close database connection to simulate error
            yield db.close();
            const response = yield request(app)
                .post('/api/test-data/reset')
                .expect(500);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('RESET_ERROR');
            expect(response.body.error.message).toBe('Failed to reset test data');
        }));
    });
    describe('Response format', () => {
        it('should have consistent response format for success', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .post('/api/test-data/reset')
                .expect(200);
            expect(response.body).toMatchObject({
                success: true,
                message: expect.any(String),
                timestamp: expect.any(String),
            });
            // Validate timestamp format
            expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
        }));
        it('should have consistent response format for errors', () => __awaiter(void 0, void 0, void 0, function* () {
            // Create duplicate user to trigger error
            yield request(app)
                .post('/api/test-data/create-test-user')
                .send({ email: 'test@example.com' });
            const response = yield request(app)
                .post('/api/test-data/create-test-user')
                .send({ email: 'test@example.com' })
                .expect(409);
            expect(response.body).toMatchObject({
                success: false,
                error: {
                    code: expect.any(String),
                    message: expect.any(String),
                },
                timestamp: expect.any(String),
            });
        }));
    });
});
