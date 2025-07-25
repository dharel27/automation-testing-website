var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { authenticateToken, optionalAuth, requireRole, requireAdmin, requireUserOrAdmin, requireAuth, generateToken, verifyToken, } from '../../middleware/auth';
import { getDatabase } from '../../database/connection';
import { User } from '../../models/User';
import { Session } from '../../models/Session';
// Mock dependencies
jest.mock('../../database/connection');
jest.mock('../../models/User');
jest.mock('../../models/Session');
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(),
    verify: jest.fn(),
    JsonWebTokenError: class JsonWebTokenError extends Error {
        constructor(message) {
            super(message);
            this.name = 'JsonWebTokenError';
        }
    },
}));
import jwt from 'jsonwebtoken';
const mockGetDatabase = getDatabase;
describe('Auth Middleware', () => {
    let mockReq;
    let mockRes;
    let mockNext;
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
        mockReq = {
            headers: {},
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        mockNext = jest.fn();
        mockDb = {};
        mockUserModel = {
            findById: jest.fn(),
        };
        mockSessionModel = {
            findValidByUserId: jest.fn(),
        };
        mockGetDatabase.mockResolvedValue(mockDb);
        User.mockImplementation(() => mockUserModel);
        Session.mockImplementation(() => mockSessionModel);
        jest.clearAllMocks();
    });
    describe('generateToken', () => {
        it('should generate a valid JWT token', () => {
            const mockToken = 'mock-jwt-token';
            jwt.sign.mockReturnValue(mockToken);
            const token = generateToken(mockUser);
            expect(jwt.sign).toHaveBeenCalledWith({
                userId: mockUser.id,
                username: mockUser.username,
                email: mockUser.email,
                role: mockUser.role,
            }, expect.any(String), { expiresIn: expect.any(String) });
            expect(token).toBe(mockToken);
        });
    });
    describe('verifyToken', () => {
        it('should verify and return JWT payload', () => {
            const mockPayload = {
                userId: 'user-1',
                username: 'testuser',
                email: 'test@example.com',
                role: 'user',
            };
            jwt.verify.mockReturnValue(mockPayload);
            const result = verifyToken('mock-token');
            expect(jwt.verify).toHaveBeenCalledWith('mock-token', expect.any(String));
            expect(result).toEqual(mockPayload);
        });
    });
    describe('authenticateToken', () => {
        it('should authenticate valid token and attach user to request', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockToken = 'valid-token';
            const mockPayload = {
                userId: 'user-1',
                username: 'testuser',
                email: 'test@example.com',
                role: 'user',
            };
            mockReq.headers = { authorization: `Bearer ${mockToken}` };
            jwt.verify.mockReturnValue(mockPayload);
            mockUserModel.findById.mockResolvedValue(mockUser);
            mockSessionModel.findValidByUserId.mockResolvedValue([]);
            yield authenticateToken(mockReq, mockRes, mockNext);
            expect(jwt.verify).toHaveBeenCalledWith(mockToken, expect.any(String));
            expect(mockUserModel.findById).toHaveBeenCalledWith('user-1');
            expect(mockReq.user).toEqual(mockUser);
            expect(mockNext).toHaveBeenCalled();
        }));
        it('should return 401 when no token provided', () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.headers = {};
            yield authenticateToken(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'MISSING_TOKEN',
                    message: 'Access token is required',
                },
                timestamp: expect.any(String),
            });
            expect(mockNext).not.toHaveBeenCalled();
        }));
        it('should return 401 when token is invalid', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockToken = 'invalid-token';
            mockReq.headers = { authorization: `Bearer ${mockToken}` };
            jwt.verify.mockImplementation(() => {
                throw new jwt.JsonWebTokenError('Invalid token');
            });
            yield authenticateToken(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'INVALID_TOKEN',
                    message: 'Invalid access token',
                },
                timestamp: expect.any(String),
            });
            expect(mockNext).not.toHaveBeenCalled();
        }));
        it('should return 401 when user not found', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockToken = 'valid-token';
            const mockPayload = {
                userId: 'user-1',
                username: 'testuser',
                email: 'test@example.com',
                role: 'user',
            };
            mockReq.headers = { authorization: `Bearer ${mockToken}` };
            jwt.verify.mockReturnValue(mockPayload);
            mockUserModel.findById.mockResolvedValue(null);
            yield authenticateToken(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'User not found',
                },
                timestamp: expect.any(String),
            });
            expect(mockNext).not.toHaveBeenCalled();
        }));
        it('should return 500 on unexpected error', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockToken = 'valid-token';
            mockReq.headers = { authorization: `Bearer ${mockToken}` };
            jwt.verify.mockImplementation(() => {
                throw new Error('Unexpected error');
            });
            yield authenticateToken(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'AUTH_ERROR',
                    message: 'Authentication error',
                },
                timestamp: expect.any(String),
            });
            expect(mockNext).not.toHaveBeenCalled();
        }));
    });
    describe('optionalAuth', () => {
        it('should continue without authentication when no token provided', () => __awaiter(void 0, void 0, void 0, function* () {
            mockReq.headers = {};
            yield optionalAuth(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalled();
            expect(mockReq.user).toBeUndefined();
        }));
        it('should authenticate when valid token provided', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockToken = 'valid-token';
            const mockPayload = {
                userId: 'user-1',
                username: 'testuser',
                email: 'test@example.com',
                role: 'user',
            };
            mockReq.headers = { authorization: `Bearer ${mockToken}` };
            jwt.verify.mockReturnValue(mockPayload);
            mockUserModel.findById.mockResolvedValue(mockUser);
            mockSessionModel.findValidByUserId.mockResolvedValue([]);
            yield optionalAuth(mockReq, mockRes, mockNext);
            expect(mockReq.user).toEqual(mockUser);
            expect(mockNext).toHaveBeenCalled();
        }));
        it('should continue without authentication when token verification fails', () => __awaiter(void 0, void 0, void 0, function* () {
            const mockToken = 'invalid-token';
            mockReq.headers = { authorization: `Bearer ${mockToken}` };
            jwt.verify.mockImplementation(() => {
                throw new jwt.JsonWebTokenError('Invalid token');
            });
            yield optionalAuth(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalled();
            expect(mockReq.user).toBeUndefined();
        }));
    });
    describe('requireRole', () => {
        it('should allow access when user has required role', () => {
            mockReq.user = Object.assign(Object.assign({}, mockUser), { role: 'admin' });
            const middleware = requireRole('admin', 'user');
            middleware(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });
        it('should deny access when user does not have required role', () => {
            mockReq.user = Object.assign(Object.assign({}, mockUser), { role: 'guest' });
            const middleware = requireRole('admin', 'user');
            middleware(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'INSUFFICIENT_PERMISSIONS',
                    message: 'Access denied. Required roles: admin, user',
                },
                timestamp: expect.any(String),
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
        it('should deny access when user is not authenticated', () => {
            mockReq.user = undefined;
            const middleware = requireRole('user');
            middleware(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'AUTHENTICATION_REQUIRED',
                    message: 'Authentication required',
                },
                timestamp: expect.any(String),
            });
            expect(mockNext).not.toHaveBeenCalled();
        });
    });
    describe('requireAdmin', () => {
        it('should allow access for admin user', () => {
            mockReq.user = Object.assign(Object.assign({}, mockUser), { role: 'admin' });
            requireAdmin(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });
        it('should deny access for non-admin user', () => {
            mockReq.user = Object.assign(Object.assign({}, mockUser), { role: 'user' });
            requireAdmin(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockNext).not.toHaveBeenCalled();
        });
    });
    describe('requireUserOrAdmin', () => {
        it('should allow access for user', () => {
            mockReq.user = Object.assign(Object.assign({}, mockUser), { role: 'user' });
            requireUserOrAdmin(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });
        it('should allow access for admin', () => {
            mockReq.user = Object.assign(Object.assign({}, mockUser), { role: 'admin' });
            requireUserOrAdmin(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalled();
        });
        it('should deny access for guest', () => {
            mockReq.user = Object.assign(Object.assign({}, mockUser), { role: 'guest' });
            requireUserOrAdmin(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(403);
            expect(mockNext).not.toHaveBeenCalled();
        });
    });
    describe('requireAuth', () => {
        it('should allow access for any authenticated user', () => {
            const roles = ['admin', 'user', 'guest'];
            roles.forEach((role) => {
                jest.clearAllMocks();
                mockReq.user = Object.assign(Object.assign({}, mockUser), { role });
                requireAuth(mockReq, mockRes, mockNext);
                expect(mockNext).toHaveBeenCalled();
            });
        });
        it('should deny access for unauthenticated user', () => {
            mockReq.user = undefined;
            requireAuth(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockNext).not.toHaveBeenCalled();
        });
    });
});
