var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import jwt from 'jsonwebtoken';
import { getDatabase } from '../database/connection.js';
import { Session } from '../models/Session.js';
import { User } from '../models/User.js';
import logger from '../utils/logger.js';
// JWT secrets - in production these should be from environment variables
const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access-secret-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-secret-change-in-production';
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
/**
 * Generate access and refresh token pair
 */
export function generateTokenPair(user) {
    const accessTokenPayload = {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        tokenType: 'access',
    };
    const refreshTokenPayload = {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        tokenType: 'refresh',
    };
    const accessToken = jwt.sign(accessTokenPayload, JWT_ACCESS_SECRET, {
        expiresIn: ACCESS_TOKEN_EXPIRES_IN,
    });
    const refreshToken = jwt.sign(refreshTokenPayload, JWT_REFRESH_SECRET, {
        expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    });
    // Calculate expiration dates
    const accessTokenExpiresAt = new Date();
    accessTokenExpiresAt.setMinutes(accessTokenExpiresAt.getMinutes() + 15); // 15 minutes
    const refreshTokenExpiresAt = new Date();
    refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7); // 7 days
    return {
        accessToken,
        refreshToken,
        accessTokenExpiresAt,
        refreshTokenExpiresAt,
    };
}
/**
 * Verify access token
 */
export function verifyAccessToken(token) {
    const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
    if (decoded.tokenType !== 'access') {
        throw new Error('Invalid token type');
    }
    return decoded;
}
/**
 * Verify refresh token
 */
export function verifyRefreshToken(token) {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET);
    if (decoded.tokenType !== 'refresh') {
        throw new Error('Invalid token type');
    }
    return decoded;
}
/**
 * Enhanced authentication middleware with automatic token refresh
 */
export function enhancedAuth(req, res, next) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const authHeader = req.headers.authorization;
            const accessToken = authHeader && authHeader.split(' ')[1];
            if (!accessToken) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'MISSING_ACCESS_TOKEN',
                        message: 'Access token is required',
                    },
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            try {
                // Try to verify access token
                const decoded = verifyAccessToken(accessToken);
                // Get database connection and user model
                const db = yield getDatabase();
                const userModel = new User(db);
                // Fetch user from database
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
                // Check if session is still valid
                const sessionModel = new Session(db);
                const validSessions = yield sessionModel.findValidByUserId(user.id);
                if (validSessions.length === 0) {
                    res.status(401).json({
                        success: false,
                        error: {
                            code: 'SESSION_EXPIRED',
                            message: 'Session has expired',
                        },
                        timestamp: new Date().toISOString(),
                    });
                    return;
                }
                // Attach user to request
                req.user = user;
                next();
            }
            catch (tokenError) {
                if (tokenError instanceof jwt.TokenExpiredError) {
                    // Access token expired, try to refresh
                    const refreshToken = req.headers['x-refresh-token'];
                    if (!refreshToken) {
                        res.status(401).json({
                            success: false,
                            error: {
                                code: 'ACCESS_TOKEN_EXPIRED',
                                message: 'Access token expired and no refresh token provided',
                                requiresRefresh: true,
                            },
                            timestamp: new Date().toISOString(),
                        });
                        return;
                    }
                    try {
                        const refreshDecoded = verifyRefreshToken(refreshToken);
                        // Get database connection and user model
                        const db = yield getDatabase();
                        const userModel = new User(db);
                        const sessionModel = new Session(db);
                        // Fetch user from database
                        const user = yield userModel.findById(refreshDecoded.userId);
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
                        // Check if refresh token is still valid in database
                        const validSession = yield sessionModel.findByToken(refreshToken);
                        if (!validSession || validSession.expiresAt < new Date()) {
                            res.status(401).json({
                                success: false,
                                error: {
                                    code: 'REFRESH_TOKEN_EXPIRED',
                                    message: 'Refresh token has expired',
                                },
                                timestamp: new Date().toISOString(),
                            });
                            return;
                        }
                        // Generate new token pair
                        const tokenPair = generateTokenPair(user);
                        // Update session with new tokens
                        yield sessionModel.update(validSession.id, {
                            token: tokenPair.refreshToken,
                            expiresAt: tokenPair.refreshTokenExpiresAt,
                        });
                        // Send new tokens in response headers
                        res.setHeader('X-New-Access-Token', tokenPair.accessToken);
                        res.setHeader('X-New-Refresh-Token', tokenPair.refreshToken);
                        res.setHeader('X-Access-Token-Expires-At', tokenPair.accessTokenExpiresAt.toISOString());
                        // Attach user to request
                        req.user = user;
                        next();
                    }
                    catch (refreshError) {
                        logger.warn('Refresh token validation failed:', refreshError);
                        res.status(401).json({
                            success: false,
                            error: {
                                code: 'INVALID_REFRESH_TOKEN',
                                message: 'Invalid refresh token',
                            },
                            timestamp: new Date().toISOString(),
                        });
                        return;
                    }
                }
                else {
                    logger.warn('Access token validation failed:', tokenError);
                    res.status(401).json({
                        success: false,
                        error: {
                            code: 'INVALID_ACCESS_TOKEN',
                            message: 'Invalid access token',
                        },
                        timestamp: new Date().toISOString(),
                    });
                    return;
                }
            }
        }
        catch (error) {
            logger.error('Enhanced authentication error:', error);
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
 * Token refresh endpoint
 */
export function refreshTokenEndpoint(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const { refreshToken } = req.body;
            if (!refreshToken) {
                res.status(400).json({
                    success: false,
                    error: {
                        code: 'MISSING_REFRESH_TOKEN',
                        message: 'Refresh token is required',
                    },
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            // Verify refresh token
            const decoded = verifyRefreshToken(refreshToken);
            // Get database connection
            const db = yield getDatabase();
            const userModel = new User(db);
            const sessionModel = new Session(db);
            // Fetch user from database
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
            // Check if refresh token is still valid in database
            const validSession = yield sessionModel.findByToken(refreshToken);
            if (!validSession || validSession.expiresAt < new Date()) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'REFRESH_TOKEN_EXPIRED',
                        message: 'Refresh token has expired',
                    },
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            // Generate new token pair
            const tokenPair = generateTokenPair(user);
            // Update session with new refresh token
            yield sessionModel.update(validSession.id, {
                token: tokenPair.refreshToken,
                expiresAt: tokenPair.refreshTokenExpiresAt,
            });
            // Return new tokens
            const { password: _ } = user, userWithoutPassword = __rest(user, ["password"]);
            res.json({
                success: true,
                data: {
                    user: userWithoutPassword,
                    accessToken: tokenPair.accessToken,
                    refreshToken: tokenPair.refreshToken,
                    accessTokenExpiresAt: tokenPair.accessTokenExpiresAt.toISOString(),
                    refreshTokenExpiresAt: tokenPair.refreshTokenExpiresAt.toISOString(),
                },
                timestamp: new Date().toISOString(),
            });
        }
        catch (error) {
            if (error instanceof jwt.JsonWebTokenError) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'INVALID_REFRESH_TOKEN',
                        message: 'Invalid refresh token',
                    },
                    timestamp: new Date().toISOString(),
                });
                return;
            }
            logger.error('Token refresh error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'TOKEN_REFRESH_ERROR',
                    message: 'Failed to refresh token',
                },
                timestamp: new Date().toISOString(),
            });
        }
    });
}
/**
 * Revoke all sessions for a user (logout from all devices)
 */
export function revokeAllSessions(userId) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const db = yield getDatabase();
            const sessionModel = new Session(db);
            yield sessionModel.deleteByUserId(userId);
            logger.info(`All sessions revoked for user: ${userId}`);
        }
        catch (error) {
            logger.error('Error revoking sessions:', error);
            throw error;
        }
    });
}
/**
 * Clean up expired sessions (should be run periodically)
 */
export function cleanupExpiredSessions() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const db = yield getDatabase();
            const sessionModel = new Session(db);
            yield sessionModel.deleteExpired();
            logger.info('Expired sessions cleaned up');
        }
        catch (error) {
            logger.error('Error cleaning up expired sessions:', error);
        }
    });
}
