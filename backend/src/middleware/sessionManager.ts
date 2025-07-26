import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../database/connection.js';
import { Session } from '../models/Session.js';
import { User } from '../models/User.js';
import logger from '../utils/logger.js';

// JWT secrets - in production these should be from environment variables
const JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || 'access-secret-change-in-production';
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || 'refresh-secret-change-in-production';
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

export interface TokenPayload {
  userId: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'guest';
  tokenType: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
}

/**
 * Generate access and refresh token pair
 */
export function generateTokenPair(user: any): TokenPair {
  const accessTokenPayload: TokenPayload = {
    userId: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    tokenType: 'access',
  };

  const refreshTokenPayload: TokenPayload = {
    userId: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    tokenType: 'refresh',
  };

  const accessToken = jwt.sign(accessTokenPayload, JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  } as jwt.SignOptions);

  const refreshToken = jwt.sign(refreshTokenPayload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRES_IN,
  } as jwt.SignOptions);

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
export function verifyAccessToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, JWT_ACCESS_SECRET) as TokenPayload;

  if (decoded.tokenType !== 'access') {
    throw new Error('Invalid token type');
  }

  return decoded;
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;

  if (decoded.tokenType !== 'refresh') {
    throw new Error('Invalid token type');
  }

  return decoded;
}

/**
 * Enhanced authentication middleware with automatic token refresh
 */
export async function enhancedAuth(
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> {
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
      const db = await getDatabase();
      const userModel = new User(db);

      // Fetch user from database
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

      // Check if session is still valid
      const sessionModel = new Session(db);
      const validSessions = await sessionModel.findValidByUserId(user.id);

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
    } catch (tokenError) {
      if (tokenError instanceof jwt.TokenExpiredError) {
        // Access token expired, try to refresh
        const refreshToken = req.headers['x-refresh-token'] as string;

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
          const db = await getDatabase();
          const userModel = new User(db);
          const sessionModel = new Session(db);

          // Fetch user from database
          const user = await userModel.findById(refreshDecoded.userId);

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
          const validSession = await sessionModel.findByToken(refreshToken);

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
          await sessionModel.update(validSession.id, {
            token: tokenPair.refreshToken,
            expiresAt: tokenPair.refreshTokenExpiresAt,
          });

          // Send new tokens in response headers
          res.setHeader('X-New-Access-Token', tokenPair.accessToken);
          res.setHeader('X-New-Refresh-Token', tokenPair.refreshToken);
          res.setHeader(
            'X-Access-Token-Expires-At',
            tokenPair.accessTokenExpiresAt.toISOString()
          );

          // Attach user to request
          req.user = user;
          next();
        } catch (refreshError) {
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
      } else {
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
  } catch (error) {
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
}

/**
 * Token refresh endpoint
 */
export async function refreshTokenEndpoint(
  req: Request,
  res: Response
): Promise<void> {
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
    const db = await getDatabase();
    const userModel = new User(db);
    const sessionModel = new Session(db);

    // Fetch user from database
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

    // Check if refresh token is still valid in database
    const validSession = await sessionModel.findByToken(refreshToken);

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
    await sessionModel.update(validSession.id, {
      token: tokenPair.refreshToken,
      expiresAt: tokenPair.refreshTokenExpiresAt,
    });

    // Return new tokens
    const { password: _, ...userWithoutPassword } = user;

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
  } catch (error) {
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
}

/**
 * Revoke all sessions for a user (logout from all devices)
 */
export async function revokeAllSessions(userId: string): Promise<void> {
  try {
    const db = await getDatabase();
    const sessionModel = new Session(db);

    await sessionModel.deleteByUserId(userId);
    logger.info(`All sessions revoked for user: ${userId}`);
  } catch (error) {
    logger.error('Error revoking sessions:', error);
    throw error;
  }
}

/**
 * Clean up expired sessions (should be run periodically)
 */
export async function cleanupExpiredSessions(): Promise<void> {
  try {
    const db = await getDatabase();
    const sessionModel = new Session(db);

    await sessionModel.deleteExpired();
    logger.info('Expired sessions cleaned up');
  } catch (error) {
    logger.error('Error cleaning up expired sessions:', error);
  }
}
