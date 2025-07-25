var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import jwt from 'jsonwebtoken';
import { getDatabase } from '../database/connection';
import { User } from '../models/User';
import { Session } from '../models/Session';
// JWT secret - in production this should be from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
/**
 * Generate JWT token for user
 */
export function generateToken(user) {
    const payload = {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
    };
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
}
/**
 * Verify JWT token
 */
export function verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
}
/**
 * Authentication middleware - verifies JWT token
 */
export function authenticateToken(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
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
            const db = yield getDatabase();
            const userModel = new User(db);
            // Fetch user from database to ensure they still exist
            const user = yield userModel.findById(decoded.userId);
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
            const validSessions = yield sessionModel.findValidByUserId(user.id);
            // Attach user to request
            req.user = user;
            next();
        }
        catch (error) {
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
    });
}
/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
export function optionalAuth(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
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
                const db = yield getDatabase();
                const userModel = new User(db);
                // Fetch user from database to ensure they still exist
                const user = yield userModel.findById(decoded.userId);
                if (user) {
                    // Check if session is still valid (optional - for more secure session management)
                    const sessionModel = new Session(db);
                    const validSessions = yield sessionModel.findValidByUserId(user.id);
                    // Attach user to request
                    req.user = user;
                }
            }
            catch (error) {
                // If token verification fails, continue without authentication
                // Don't set req.user, just continue
            }
            next();
        }
        catch (error) {
            // If any unexpected error occurs, continue without authentication
            next();
        }
    });
}
/**
 * Role-based authorization middleware
 */
export function requireRole(...roles) {
    return (req, res, next) => {
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
