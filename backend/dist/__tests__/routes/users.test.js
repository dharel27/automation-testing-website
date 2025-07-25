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
import { generateToken } from '../../middleware/auth';
describe('Users API', () => {
    let db;
    let userModel;
    let adminToken;
    let userToken;
    let adminUser;
    let regularUser;
    beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
        db = yield getDatabase();
        userModel = new User(db);
        // Create admin user for testing
        adminUser = yield userModel.create({
            username: 'admin',
            email: 'admin@test.com',
            password: 'password123',
            role: 'admin',
            profile: {
                firstName: 'Admin',
                lastName: 'User',
            },
        });
        // Create regular user for testing
        regularUser = yield userModel.create({
            username: 'testuser',
            email: 'user@test.com',
            password: 'password123',
            role: 'user',
            profile: {
                firstName: 'Test',
                lastName: 'User',
            },
        });
        adminToken = generateToken(adminUser);
        userToken = generateToken(regularUser);
    }));
    afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
        // Clean up test data
        yield userModel.delete(adminUser.id);
        yield userModel.delete(regularUser.id);
    }));
    describe('GET /api/users', () => {
        it('should get all users with pagination', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app).get('/api/users').expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeInstanceOf(Array);
            expect(response.body.pagination).toBeDefined();
            expect(response.body.pagination.page).toBe(1);
            expect(response.body.pagination.limit).toBe(10);
            expect(response.body.data.length).toBeGreaterThanOrEqual(2);
            // Check that passwords are not included
            response.body.data.forEach((user) => {
                expect(user.password).toBeUndefined();
            });
        }));
        it('should support pagination parameters', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .get('/api/users?page=1&limit=1')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(1);
            expect(response.body.pagination.page).toBe(1);
            expect(response.body.pagination.limit).toBe(1);
        }));
    });
    describe('GET /api/users/:id', () => {
        it('should get user by ID when authenticated as admin', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .get(`/api/users/${regularUser.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(regularUser.id);
            expect(response.body.data.username).toBe(regularUser.username);
            expect(response.body.data.password).toBeUndefined();
        }));
        it('should get own profile when authenticated as user', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .get(`/api/users/${regularUser.id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(regularUser.id);
            expect(response.body.data.password).toBeUndefined();
        }));
        it('should deny access to other users profile', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .get(`/api/users/${adminUser.id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('ACCESS_DENIED');
        }));
        it('should require authentication', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .get(`/api/users/${regularUser.id}`)
                .expect(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('MISSING_TOKEN');
        }));
        it('should return 404 for non-existent user', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .get('/api/users/non-existent-id')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('USER_NOT_FOUND');
        }));
    });
    describe('POST /api/users', () => {
        it('should create new user when authenticated as admin', () => __awaiter(void 0, void 0, void 0, function* () {
            const newUserData = {
                username: 'newuser',
                email: 'newuser@test.com',
                password: 'password123',
                role: 'user',
                profile: {
                    firstName: 'New',
                    lastName: 'User',
                },
            };
            const response = yield request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(newUserData)
                .expect(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.username).toBe(newUserData.username);
            expect(response.body.data.email).toBe(newUserData.email);
            expect(response.body.data.password).toBeUndefined();
            // Clean up
            yield userModel.delete(response.body.data.id);
        }));
        it('should require admin role', () => __awaiter(void 0, void 0, void 0, function* () {
            const newUserData = {
                username: 'newuser2',
                email: 'newuser2@test.com',
                password: 'password123',
            };
            const response = yield request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${userToken}`)
                .send(newUserData)
                .expect(403);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
        }));
        it('should validate required fields', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({})
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        }));
        it('should validate email format', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                username: 'testuser',
                email: 'invalid-email',
                password: 'password123',
            })
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        }));
        it('should validate password length', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                username: 'testuser',
                email: 'test@test.com',
                password: '123',
            })
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        }));
        it('should prevent duplicate email', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                username: 'testuser2',
                email: regularUser.email,
                password: 'password123',
            })
                .expect(409);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('USER_EXISTS');
        }));
        it('should prevent duplicate username', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .post('/api/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                username: regularUser.username,
                email: 'different@test.com',
                password: 'password123',
            })
                .expect(409);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('USER_EXISTS');
        }));
    });
    describe('PUT /api/users/:id', () => {
        it('should update own profile', () => __awaiter(void 0, void 0, void 0, function* () {
            const updateData = {
                profile: {
                    firstName: 'Updated',
                    lastName: 'Name',
                },
            };
            const response = yield request(app)
                .put(`/api/users/${regularUser.id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send(updateData)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.profile.firstName).toBe('Updated');
            expect(response.body.data.profile.lastName).toBe('Name');
        }));
        it('should allow admin to update any user', () => __awaiter(void 0, void 0, void 0, function* () {
            const updateData = {
                username: 'updatedusername',
            };
            const response = yield request(app)
                .put(`/api/users/${regularUser.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.username).toBe('updatedusername');
            // Restore original username
            yield userModel.update(regularUser.id, { username: 'testuser' });
        }));
        it('should prevent non-admin from changing role', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .put(`/api/users/${regularUser.id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ role: 'admin' })
                .expect(403);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('ACCESS_DENIED');
        }));
        it('should prevent access to other users', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .put(`/api/users/${adminUser.id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ username: 'hacker' })
                .expect(403);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('ACCESS_DENIED');
        }));
        it('should validate email format', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .put(`/api/users/${regularUser.id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .send({ email: 'invalid-email' })
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('VALIDATION_ERROR');
        }));
        it('should return 404 for non-existent user', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .put('/api/users/non-existent-id')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ username: 'test' })
                .expect(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('USER_NOT_FOUND');
        }));
    });
    describe('DELETE /api/users/:id', () => {
        it('should delete user when authenticated as admin', () => __awaiter(void 0, void 0, void 0, function* () {
            // Create a user to delete
            const userToDelete = yield userModel.create({
                username: 'todelete',
                email: 'todelete@test.com',
                password: 'password123',
                role: 'user',
            });
            const response = yield request(app)
                .delete(`/api/users/${userToDelete.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.message).toBe('User deleted successfully');
            // Verify user is deleted
            const deletedUser = yield userModel.findById(userToDelete.id);
            expect(deletedUser).toBeNull();
        }));
        it('should require admin role', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .delete(`/api/users/${regularUser.id}`)
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('INSUFFICIENT_PERMISSIONS');
        }));
        it('should prevent admin from deleting themselves', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .delete(`/api/users/${adminUser.id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('CANNOT_DELETE_SELF');
        }));
        it('should return 404 for non-existent user', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .delete('/api/users/non-existent-id')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(404);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('USER_NOT_FOUND');
        }));
    });
});
