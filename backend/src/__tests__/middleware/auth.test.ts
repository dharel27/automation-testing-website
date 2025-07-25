import { Request, Response, NextFunction } from 'express';
import {
  authenticateToken,
  optionalAuth,
  requireRole,
  requireAdmin,
  requireUserOrAdmin,
  requireAuth,
  generateToken,
  verifyToken,
  AuthenticatedRequest,
  JWTPayload,
} from '../../middleware/auth';
import { getDatabase } from '../../database/connection';
import { User, UserData } from '../../models/User';
import { Session } from '../../models/Session';

// Mock dependencies
jest.mock('../../database/connection');
jest.mock('../../models/User');
jest.mock('../../models/Session');

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
  JsonWebTokenError: class JsonWebTokenError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'JsonWebTokenError';
    }
  },
}));

import jwt from 'jsonwebtoken';

const mockGetDatabase = getDatabase as jest.MockedFunction<typeof getDatabase>;

describe('Auth Middleware', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let mockDb: any;
  let mockUserModel: jest.Mocked<User>;
  let mockSessionModel: jest.Mocked<Session>;

  const mockUser: UserData = {
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
    } as any;
    mockSessionModel = {
      findValidByUserId: jest.fn(),
    } as any;

    mockGetDatabase.mockResolvedValue(mockDb);
    (User as jest.MockedClass<typeof User>).mockImplementation(
      () => mockUserModel
    );
    (Session as jest.MockedClass<typeof Session>).mockImplementation(
      () => mockSessionModel
    );

    jest.clearAllMocks();
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const mockToken = 'mock-jwt-token';
      (jwt.sign as jest.Mock).mockReturnValue(mockToken);

      const token = generateToken(mockUser);

      expect(jwt.sign).toHaveBeenCalledWith(
        {
          userId: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
          role: mockUser.role,
        },
        expect.any(String),
        { expiresIn: expect.any(String) }
      );
      expect(token).toBe(mockToken);
    });
  });

  describe('verifyToken', () => {
    it('should verify and return JWT payload', () => {
      const mockPayload: JWTPayload = {
        userId: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
      };
      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

      const result = verifyToken('mock-token');

      expect(jwt.verify).toHaveBeenCalledWith('mock-token', expect.any(String));
      expect(result).toEqual(mockPayload);
    });
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token and attach user to request', async () => {
      const mockToken = 'valid-token';
      const mockPayload: JWTPayload = {
        userId: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
      };

      mockReq.headers = { authorization: `Bearer ${mockToken}` };
      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);
      mockUserModel.findById.mockResolvedValue(mockUser);
      mockSessionModel.findValidByUserId.mockResolvedValue([]);

      await authenticateToken(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(jwt.verify).toHaveBeenCalledWith(mockToken, expect.any(String));
      expect(mockUserModel.findById).toHaveBeenCalledWith('user-1');
      expect(mockReq.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 when no token provided', async () => {
      mockReq.headers = {};

      await authenticateToken(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

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
    });

    it('should return 401 when token is invalid', async () => {
      const mockToken = 'invalid-token';
      mockReq.headers = { authorization: `Bearer ${mockToken}` };
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Invalid token');
      });

      await authenticateToken(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

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
    });

    it('should return 401 when user not found', async () => {
      const mockToken = 'valid-token';
      const mockPayload: JWTPayload = {
        userId: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
      };

      mockReq.headers = { authorization: `Bearer ${mockToken}` };
      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);
      mockUserModel.findById.mockResolvedValue(null);

      await authenticateToken(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

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
    });

    it('should return 500 on unexpected error', async () => {
      const mockToken = 'valid-token';
      mockReq.headers = { authorization: `Bearer ${mockToken}` };
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      await authenticateToken(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

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
    });
  });

  describe('optionalAuth', () => {
    it('should continue without authentication when no token provided', async () => {
      mockReq.headers = {};

      await optionalAuth(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
    });

    it('should authenticate when valid token provided', async () => {
      const mockToken = 'valid-token';
      const mockPayload: JWTPayload = {
        userId: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        role: 'user',
      };

      mockReq.headers = { authorization: `Bearer ${mockToken}` };
      (jwt.verify as jest.Mock).mockReturnValue(mockPayload);
      mockUserModel.findById.mockResolvedValue(mockUser);
      mockSessionModel.findValidByUserId.mockResolvedValue([]);

      await optionalAuth(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockReq.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should continue without authentication when token verification fails', async () => {
      const mockToken = 'invalid-token';
      mockReq.headers = { authorization: `Bearer ${mockToken}` };
      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new jwt.JsonWebTokenError('Invalid token');
      });

      await optionalAuth(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeUndefined();
    });
  });

  describe('requireRole', () => {
    it('should allow access when user has required role', () => {
      mockReq.user = { ...mockUser, role: 'admin' };
      const middleware = requireRole('admin', 'user');

      middleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny access when user does not have required role', () => {
      mockReq.user = { ...mockUser, role: 'guest' };
      const middleware = requireRole('admin', 'user');

      middleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

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

      middleware(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

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
      mockReq.user = { ...mockUser, role: 'admin' };

      requireAdmin(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny access for non-admin user', () => {
      mockReq.user = { ...mockUser, role: 'user' };

      requireAdmin(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireUserOrAdmin', () => {
    it('should allow access for user', () => {
      mockReq.user = { ...mockUser, role: 'user' };

      requireUserOrAdmin(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should allow access for admin', () => {
      mockReq.user = { ...mockUser, role: 'admin' };

      requireUserOrAdmin(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny access for guest', () => {
      mockReq.user = { ...mockUser, role: 'guest' };

      requireUserOrAdmin(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('requireAuth', () => {
    it('should allow access for any authenticated user', () => {
      const roles: ('admin' | 'user' | 'guest')[] = ['admin', 'user', 'guest'];

      roles.forEach((role) => {
        jest.clearAllMocks();
        mockReq.user = { ...mockUser, role };

        requireAuth(
          mockReq as AuthenticatedRequest,
          mockRes as Response,
          mockNext
        );

        expect(mockNext).toHaveBeenCalled();
      });
    });

    it('should deny access for unauthenticated user', () => {
      mockReq.user = undefined;

      requireAuth(
        mockReq as AuthenticatedRequest,
        mockRes as Response,
        mockNext
      );

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
