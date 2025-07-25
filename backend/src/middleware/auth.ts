import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../database/connection';
import { User, UserData } from '../models/User';
import { Session } from '../models/Session';

// JWT secret - in production this should be from environment variables
const JWT_SECRET: string =
  process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '24h';

export interface AuthenticatedRequest extends Request {
  user?: UserData;
  session?: any;
}

export interface JWTPayload {
  userId: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  iat?: number;
  exp?: number;
}

/**
 * Generate JWT token for user
 */
export function generateToken(user: UserData): string {
  const payload: JWTPayload = {
    userId: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

/**
 * Authentication middleware - verifies JWT token
 */
export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_TOKEN',
          message: 'Access token is required',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Verify JWT token
    const decoded = verifyToken(token);

    // Get database connection and user model
    const db = await getDatabase();
    const userModel = new User(db);

    // Fetch user from database to ensure they still exist
    const user = await userModel.findById(decoded.userId);

    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Check if session is still valid (optional - for more secure session management)
    const sessionModel = new Session(db);
    const validSessions = await sessionModel.findValidByUserId(user.id);

    // Attach user to request
    req.user = user;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid access token',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication error',
      },
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // No token provided, continue without authentication
      next();
      return;
    }

    // If token is provided, try to verify it
    try {
      // Verify JWT token
      const decoded = verifyToken(token);

      // Get database connection and user model
      const db = await getDatabase();
      const userModel = new User(db);

      // Fetch user from database to ensure they still exist
      const user = await userModel.findById(decoded.userId);

      if (user) {
        // Check if session is still valid (optional - for more secure session management)
        const sessionModel = new Session(db);
        const validSessions = await sessionModel.findValidByUserId(user.id);

        // Attach user to request
        req.user = user;
      }
    } catch (error) {
      // If token verification fails, continue without authentication
      // Don't set req.user, just continue
    }

    next();
  } catch (error) {
    // If any unexpected error occurs, continue without authentication
    next();
  }
}

/**
 * Role-based authorization middleware
 */
export function requireRole(...roles: ('admin' | 'user' | 'guest')[]) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'Authentication required',
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: `Access denied. Required roles: ${roles.join(', ')}`,
        },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
}

/**
 * Admin only middleware
 */
export const requireAdmin = requireRole('admin');

/**
 * User or Admin middleware
 */
export const requireUserOrAdmin = requireRole('user', 'admin');

/**
 * Any authenticated user middleware
 */
export const requireAuth = requireRole('admin', 'user', 'guest');
