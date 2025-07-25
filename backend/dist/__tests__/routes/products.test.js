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
import { Product } from '../../models/Product';
import { generateToken } from '../../middleware/auth';
describe('Products API', () => {
    let db;
    let userModel;
    let productModel;
    let adminToken;
    let userToken;
    let adminUser;
    let regularUser;
    let testProduct;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        db = yield getDatabase();
        userModel = new User(db);
        productModel = new Product(db);
        // Create admin user for testing
        adminUser = yield userModel.create({
            username: 'admin_products',
            email: 'admin_products@test.com',
            password: 'password123',
            role: 'admin',
        });
        // Create regular user for testing
        regularUser = yield userModel.create({
            username: 'user_products',
            email: 'user_products@test.com',
            password: 'password123',
            role: 'user',
        });
        adminToken = generateToken(adminUser);
        userToken = generateToken(regularUser);
        // Create test product
        testProduct = yield productModel.create({
            name: 'Test Product',
            description: 'A test product for API testing',
            price: 29.99,
            category: 'Electronics',
            inStock: true,
            tags: ['test', 'electronics'],
        });
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Clean up test data
        yield productModel.delete(testProduct.id);
        yield userModel.delete(adminUser.id);
        yield userModel.delete(regularUser.id);
    }));
    describe('GET /api/products', () => {
        it('should get all products with pagination', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app).get('/api/products').expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.pagination).toBeDefined();
            expect(response.body.pagination.page).toBe(1);
            expect(response.body.pagination.limit).toBe(10);
            expect(response.body.data.length).toBeGreaterThanOrEqual(1);
        }));
        it('should support pagination parameters', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .get('/api/products?page=1&limit=1')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.pagination.page).toBe(1);
            expect(response.body.pagination.limit).toBe(1);
        }));
        it('should support search by query', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .get('/api/products?q=Test')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBeGreaterThanOrEqual(1);
            expect(response.body.data[0].name).toContain('Test');
        }));
        it('should support filtering by category', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .get('/api/products?category=Electronics')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBeGreaterThanOrEqual(1);
            expect(response.body.data[0].category).toBe('Electronics');
        }));
        it('should support price range filtering', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .get('/api/products?minPrice=20&maxPrice=50')
                .expect(200);
            expect(response.body.success).toBe(true);
            response.body.data.forEach((product) => {
                expect(product.price).toBeGreaterThanOrEqual(20);
                expect(product.price).toBeLessThanOrEqual(50);
            });
        }));
        it('should support stock filtering', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .get('/api/products?inStock=true')
                .expect(200);
            expect(response.body.success).toBe(true);
            response.body.data.forEach((product) => {
                expect(product.inStock).toBe(true);
            });
        }));
        it('should support tag filtering', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .get('/api/products?tags=test')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.length).toBeGreaterThanOrEqual(1);
            expect(response.body.data[0].tags).toContain('test');
        }));
    });
    describe('GET /api/products/search', () => {
        it('should search products with same functionality as GET /products', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .get('/api/products/search?q=Test&category=Electronics')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.pagination).toBeDefined();
        }));
    });
    describe('GET /api/products/categories', () => {
        it('should get all product categories', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .get('/api/products/categories')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.data).toContain('Electronics');
        }));
    });
    describe('GET /api/products/:id', () => {
        it('should get product by ID', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .get(`/api/products/${testProduct.id}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(testProduct.id);
            expect(response.body.data.name).toBe(testProduct.name);
            expect(response.body.data.price).toBe(testProduct.price);
        }));
        it('should return 404 for non-existent product', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .get('/api/products/non-existent-id')
                .expect(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND');
        }));
    });
    describe('POST /api/products', () => {
        it('should create new product when authenticated as user', () => __awaiter(void 0, void 0, void 0, function* () {
            const newProductData = {
                name: 'New Test Product',
                description: 'A new test product',
                price: 49.99,
                category: 'Books',
                inStock: true,
                tags: ['new', 'test'],
            };
            const response = yield request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${userToken}`)
                .send(newProductData)
                .expect(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe(newProductData.name);
            expect(response.body.data.price).toBe(newProductData.price);
            expect(response.body.data.category).toBe(newProductData.category);
            // Clean up
            yield productModel.delete(response.body.data.id);
        }));
        it('should create new product when authenticated as admin', () => __awaiter(void 0, void 0, void 0, function* () {
            const newProductData = {
                name: 'Admin Test Product',
                description: 'An admin test product',
                price: 99.99,
                category: 'Admin',
                inStock: false,
            };
            const response = yield request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(newProductData)
                .expect(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe(newProductData.name);
            // Clean up
            yield productModel.delete(response.body.data.id);
        }));
        it('should require authentication', () => __awaiter(void 0, void 0, void 0, function* () {
            const newProductData = {
                name: 'Unauthorized Product',
                description: 'Should not be created',
                price: 10.0,
                category: 'Test',
            };
            const response = yield request(app)
                .post('/api/products')
                .send(newProductData)
                .expect(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('MISSING_TOKEN');
        }));
        it('should validate required fields', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${userToken}`)
                .send({})
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        }));
        it('should validate price is a non-negative number', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                name: 'Test Product',
                description: 'Test',
                price: -10,
                category: 'Test',
            })
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        }));
        it('should validate tags is an array', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .post('/api/products')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                name: 'Test Product',
                description: 'Test',
                price: 10,
                category: 'Test',
                tags: 'not-an-array',
            })
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        }));
    });
    describe('PUT /api/products/:id', () => {
        it('should update product when authenticated as user', () => __awaiter(void 0, void 0, void 0, function* () {
            const updateData = {
                name: 'Updated Test Product',
                price: 39.99,
            };
            const response = yield request(app)
                .put(`/api/products/${testProduct.id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send(updateData)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe('Updated Test Product');
            expect(response.body.data.price).toBe(39.99);
            // Restore original name
            yield productModel.update(testProduct.id, {
                name: 'Test Product',
                price: 29.99,
            });
        }));
        it('should update product when authenticated as admin', () => __awaiter(void 0, void 0, void 0, function* () {
            const updateData = {
                description: 'Updated by admin',
            };
            const response = yield request(app)
                .put(`/api/products/${testProduct.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.description).toBe('Updated by admin');
            // Restore original description
            yield productModel.update(testProduct.id, {
                description: 'A test product for API testing',
            });
        }));
        it('should require authentication', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .put(`/api/products/${testProduct.id}`)
                .send({ name: 'Unauthorized Update' })
                .expect(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('MISSING_TOKEN');
        }));
        it('should validate price if provided', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .put(`/api/products/${testProduct.id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ price: -5 })
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        }));
        it('should validate tags if provided', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .put(`/api/products/${testProduct.id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ tags: 'not-an-array' })
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        }));
        it('should return 404 for non-existent product', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .put('/api/products/non-existent-id')
                .set('Authorization', `Bearer ${userToken}`)
                .send({ name: 'Test' })
                .expect(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND');
        }));
    });
    describe('DELETE /api/products/:id', () => {
        it('should delete product when authenticated as user', () => __awaiter(void 0, void 0, void 0, function* () {
            // Create a product to delete
            const productToDelete = yield productModel.create({
                name: 'To Delete',
                description: 'Will be deleted',
                price: 10.0,
                category: 'Test',
            });
            const response = yield request(app)
                .delete(`/api/products/${productToDelete.id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.message).toBe('Product deleted successfully');
            // Verify product is deleted
            const deletedProduct = yield productModel.findById(productToDelete.id);
            expect(deletedProduct).toBeNull();
        }));
        it('should delete product when authenticated as admin', () => __awaiter(void 0, void 0, void 0, function* () {
            // Create a product to delete
            const productToDelete = yield productModel.create({
                name: 'Admin Delete',
                description: 'Will be deleted by admin',
                price: 15.0,
                category: 'Test',
            });
            const response = yield request(app)
                .delete(`/api/products/${productToDelete.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.message).toBe('Product deleted successfully');
        }));
        it('should require authentication', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .delete(`/api/products/${testProduct.id}`)
                .expect(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('MISSING_TOKEN');
        }));
        it('should return 404 for non-existent product', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .delete('/api/products/non-existent-id')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('PRODUCT_NOT_FOUND');
        }));
    });
});
