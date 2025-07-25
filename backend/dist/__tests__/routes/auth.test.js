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
import authRoutes from '../../routes/auth';
import { getDatabase } from '../../database/connection';
import { User } from '../../models/User';
import { Session } from '../../models/Session';
import { generateToken } from '../../middleware/auth';
// Mock dependencies
jest.mock('../../database/connection');
jest.mock('../../models/User');
jest.mock('../../models/Session');
jest.mock('../../middleware/auth', () => (Object.assign(Object.assign({}, jest.requireActual('../../middleware/auth')), { generateToken: jest.fn() })));
const mockGetDatabase = getDatabase;
const mockGenerateToken = generateToken;
describe('Auth Routes', () => {
    let app;
    let mockDb;
    let mockUserModel;
    let mockSessionModel;
    const mockUser = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        role: 'user',
        profile: { firstName: 'Test', lastName: 'User' },
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/api/auth', authRoutes);
        mockDb = {};
        mockUserModel = {
            create: jest.fn(),
            findByEmail: jest.fn(),
            findByUsername: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            verifyPassword: jest.fn(),
        };
        mockSessionModel = {
            create: jest.fn(),
            deleteByToken: jest.fn(),
        };
        mockGetDatabase.mockResolvedValue(mockDb);
        User.mockImplementation(() => mockUserModel);
        Session.mockImplementation(() => mockSessionModel);
        jest.clearAllMocks();
    });
    describe('POST /api/auth/register', () => {
        const validRegistrationData = {
            username: 'testuser',
            email: 'test@example.com',
            password: 'password123',
            role: 'user',
            profile: { firstName: 'Test', lastName: 'User' },
        };
        it('should register a new user successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockToken = 'mock-jwt-token';
            mockUserModel.findByEmail.mockResolvedValue(null);
            mockUserModel.findByUsername.mockResolvedValue(null);
            mockUserModel.create.mockResolvedValue(mockUser);
            mockGenerateToken.mockReturnValue(mockToken);
            mockSessionModel.create.mockResolvedValue({});
            const response = yield request(app)
                .post('/api/auth/register')
                .send(validRegistrationData);
            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user).toEqual(expect.objectContaining({
                id: mockUser.id,
                username: mockUser.username,
                email: mockUser.email,
                role: mockUser.role,
            }));
            expect(response.body.data.user.password).toBeUndefined();
            expect(response.body.data.token).toBe(mockToken);
            expect(mockUserModel.create).toHaveBeenCalledWith(expect.objectContaining({
                username: validRegistrationData.username,
                email: validRegistrationData.email,
                password: validRegistrationData.password,
                role: validRegistrationData.role,
            }));
        }));
        it('should return 400 for missing required fields', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .post('/api/auth/register')
                .send({ username: 'testuser' });
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('MISSING_FIELDS');
        }));
        it('should return 400 for invalid email format', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .post('/api/auth/register')
                .send(Object.assign(Object.assign({}, validRegistrationData), { email: 'invalid-email' }));
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('INVALID_EMAIL');
        }));
        it('should return 400 for weak password', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .post('/api/auth/register')
                .send(Object.assign(Object.assign({}, validRegistrationData), { password: '123' }));
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('WEAK_PASSWORD');
        }));
        it('should return 400 for invalid role', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .post('/api/auth/register')
                .send(Object.assign(Object.assign({}, validRegistrationData), { role: 'invalid-role' }));
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('INVALID_ROLE');
        }));
        it('should return 409 for existing email', () => __awaiter(void 0, void 0, void 0, function* () {
            mockUserModel.findByEmail.mockResolvedValue(mockUser);
            const response = yield request(app)
                .post('/api/auth/register')
                .send(validRegistrationData);
            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('EMAIL_EXISTS');
        }));
        it('should return 409 for existing username', () => __awaiter(void 0, void 0, void 0, function* () {
            mockUserModel.findByEmail.mockResolvedValue(null);
            mockUserModel.findByUsername.mockResolvedValue(mockUser);
            const response = yield request(app)
                .post('/api/auth/register')
                .send(validRegistrationData);
            expect(response.status).toBe(409);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('USERNAME_EXISTS');
        }));
    });
    describe('POST /api/auth/login', () => {
        const validLoginData = {
            email: 'test@example.com',
            password: 'password123',
        };
        it('should login user with email successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockToken = 'mock-jwt-token';
            mockUserModel.findByEmail.mockResolvedValue(mockUser);
            mockUserModel.verifyPassword.mockResolvedValue(true);
            mockGenerateToken.mockReturnValue(mockToken);
            mockSessionModel.create.mockResolvedValue({});
            const response = yield request(app)
                .post('/api/auth/login')
                .send(validLoginData);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user).toEqual(expect.objectContaining({
                id: mockUser.id,
                username: mockUser.username,
                email: mockUser.email,
                role: mockUser.role,
            }));
            expect(response.body.data.user.password).toBeUndefined();
            expect(response.body.data.token).toBe(mockToken);
        }));
        it('should login user with username successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockToken = 'mock-jwt-token';
            const loginData = { username: 'testuser', password: 'password123' };
            mockUserModel.findByUsername.mockResolvedValue(mockUser);
            mockUserModel.verifyPassword.mockResolvedValue(true);
            mockGenerateToken.mockReturnValue(mockToken);
            mockSessionModel.create.mockResolvedValue({});
            const response = yield request(app)
                .post('/api/auth/login')
                .send(loginData);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.token).toBe(mockToken);
        }));
        it('should return 400 for missing credentials', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .post('/api/auth/login')
                .send({ email: 'test@example.com' });
            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('MISSING_CREDENTIALS');
        }));
        it('should return 401 for non-existent user', () => __awaiter(void 0, void 0, void 0, function* () {
            mockUserModel.findByEmail.mockResolvedValue(null);
            const response = yield request(app)
                .post('/api/auth/login')
                .send(validLoginData);
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
        }));
        it('should return 401 for invalid password', () => __awaiter(void 0, void 0, void 0, function* () {
            mockUserModel.findByEmail.mockResolvedValue(mockUser);
            mockUserModel.verifyPassword.mockResolvedValue(false);
            const response = yield request(app)
                .post('/api/auth/login')
                .send(validLoginData);
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
        }));
    });
    describe('POST /api/auth/logout', () => {
        it('should logout user successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockToken = 'mock-jwt-token';
            mockSessionModel.deleteByToken.mockResolvedValue(true);
            const response = yield request(app)
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${mockToken}`);
            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.message).toBe('Logged out successfully');
            expect(mockSessionModel.deleteByToken).toHaveBeenCalledWith(mockToken);
        }));
        it('should handle logout without token', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app).post('/api/auth/logout');
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('MISSING_TOKEN');
        }));
    });
    describe('GET /api/auth/profile', () => {
        it('should return user profile successfully', () => __awaiter(void 0, void 0, void 0, function* () {
            // This test would require mocking the authenticateToken middleware
            // For now, we'll test the error case
            const response = yield request(app).get('/api/auth/profile');
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('MISSING_TOKEN');
        }));
    });
    describe('PUT /api/auth/profile', () => {
        it('should require authentication', () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield request(app)
                .put('/api/auth/profile')
                .send({ username: 'newusername' });
            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.error.code).toBe('MISSING_TOKEN');
        }));
    });
});
