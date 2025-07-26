import { Router, Request, Response } from 'express';
import { getDatabase } from '../database/connection.js';
import { User, CreateUserInput } from '../models/User';
import { Session } from '../models/Session';
import {
  generateToken,
  authenticateToken,
  AuthenticatedRequest,
} from '../middleware/auth';
import {
  authRateLimit,
  validateUserRegistration,
  validateUserLogin,
  validateProfileUpdate,
  handleValidationErrors,
} from '../middleware/security';
import {
  generateTokenPair,
  refreshTokenEndpoint,
  revokeAllSessions,
} from '../middleware/sessionManager';

const router = Router();

/**
 * User registration endpoint
 * POST /api/auth/register
 */
router.post(
  '/register',
  authRateLimit,
  validateUserRegistration,
  handleValidationErrors,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { username, email, password, role = 'user', profile } = req.body;

      // Validation
      if (!username || !email || !password) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message: 'Username, email, and password are required',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_EMAIL',
            message: 'Please provide a valid email address',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Password validation
      if (password.length < 6) {
        res.status(400).json({
          success: false,
          error: {
            code: 'WEAK_PASSWORD',
            message: 'Password must be at least 6 characters long',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Role validation
      const validRoles = ['admin', 'user', 'guest'];
      if (!validRoles.includes(role)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_ROLE',
            message: 'Role must be one of: admin, user, guest',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const db = await getDatabase();
      const userModel = new User(db);

      // Check if user already exists
      const existingUserByEmail = await userModel.findByEmail(email);
      if (existingUserByEmail) {
        res.status(409).json({
          success: false,
          error: {
            code: 'EMAIL_EXISTS',
            message: 'User with this email already exists',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const existingUserByUsername = await userModel.findByUsername(username);
      if (existingUserByUsername) {
        res.status(409).json({
          success: false,
          error: {
            code: 'USERNAME_EXISTS',
            message: 'User with this username already exists',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Create user
      const userData: CreateUserInput = {
        username,
        email,
        password,
        role: role as 'admin' | 'user' | 'guest',
        profile: profile || {},
      };

      const newUser = await userModel.create(userData);

      // Generate token pair
      const tokenPair = generateTokenPair(newUser);

      // Create session
      const sessionModel = new Session(db);
      await sessionModel.create({
        userId: newUser.id,
        token: tokenPair.refreshToken,
        expiresAt: tokenPair.refreshTokenExpiresAt,
      });

      // Return user data without password
      const { password: _, ...userWithoutPassword } = newUser;

      res.status(201).json({
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
      console.error('Registration error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'REGISTRATION_ERROR',
          message: 'Failed to register user',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * User login endpoint
 * POST /api/auth/login
 */
router.post(
  '/login',
  authRateLimit,
  validateUserLogin,
  handleValidationErrors,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, username, password } = req.body;

      // Validation
      if ((!email && !username) || !password) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_CREDENTIALS',
            message: 'Email/username and password are required',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      const db = await getDatabase();
      const userModel = new User(db);

      // Find user by email or username
      let user = null;
      if (email) {
        user = await userModel.findByEmail(email);
      } else if (username) {
        user = await userModel.findByUsername(username);
      }

      if (!user) {
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid credentials',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Verify password
      const isValidPassword = await userModel.verifyPassword(user, password);
      if (!isValidPassword) {
        res.status(401).json({
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid credentials',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Generate token pair
      const tokenPair = generateTokenPair(user);

      // Create session
      const sessionModel = new Session(db);
      await sessionModel.create({
        userId: user.id,
        token: tokenPair.refreshToken,
        expiresAt: tokenPair.refreshTokenExpiresAt,
      });

      // Return user data without password
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
      console.error('Login error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'LOGIN_ERROR',
          message: 'Failed to login',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * User logout endpoint
 * POST /api/auth/logout
 */
router.post(
  '/logout',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.split(' ')[1];

      if (token) {
        const db = await getDatabase();
        const sessionModel = new Session(db);

        // Delete the session
        await sessionModel.deleteByToken(token);
      }

      res.json({
        success: true,
        data: {
          message: 'Logged out successfully',
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'LOGOUT_ERROR',
          message: 'Failed to logout',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * Get current user profile
 * GET /api/auth/profile
 */
router.get(
  '/profile',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
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

      // Return user data without password
      const { password: _, ...userWithoutPassword } = req.user;

      res.json({
        success: true,
        data: {
          user: userWithoutPassword,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Profile error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'PROFILE_ERROR',
          message: 'Failed to get profile',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * Update user profile
 * PUT /api/auth/profile
 */
router.put(
  '/profile',
  authenticateToken,
  validateProfileUpdate,
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
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

      const { username, email, profile } = req.body;
      const db = await getDatabase();
      const userModel = new User(db);

      // Check if email is being changed and if it already exists
      if (email && email !== req.user.email) {
        const existingUser = await userModel.findByEmail(email);
        if (existingUser) {
          res.status(409).json({
            success: false,
            error: {
              code: 'EMAIL_EXISTS',
              message: 'User with this email already exists',
            },
            timestamp: new Date().toISOString(),
          });
          return;
        }
      }

      // Check if username is being changed and if it already exists
      if (username && username !== req.user.username) {
        const existingUser = await userModel.findByUsername(username);
        if (existingUser) {
          res.status(409).json({
            success: false,
            error: {
              code: 'USERNAME_EXISTS',
              message: 'User with this username already exists',
            },
            timestamp: new Date().toISOString(),
          });
          return;
        }
      }

      // Update user
      const updatedUser = await userModel.update(req.user.id, {
        username,
        email,
        profile,
      });

      if (!updatedUser) {
        res.status(404).json({
          success: false,
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
          },
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // Return updated user data without password
      const { password: _, ...userWithoutPassword } = updatedUser;

      res.json({
        success: true,
        data: {
          user: userWithoutPassword,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'PROFILE_UPDATE_ERROR',
          message: 'Failed to update profile',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }
);

/**
 * Token refresh endpoint
 * POST /api/auth/refresh
 */
router.post('/refresh', refreshTokenEndpoint);

/**
 * Logout from all devices endpoint
 * POST /api/auth/logout-all
 */
router.post(
  '/logout-all',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
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

      // Revoke all sessions for the user
      await revokeAllSessions(req.user.id);

      res.json({
        success: true,
        data: {
          message: 'Logged out from all devices successfully',
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Logout all error:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'LOGOUT_ALL_ERROR',
          message: 'Failed to logout from all devices',
        },
        timestamp: new Date().toISOString(),
      });
    }
  }
);

export default router;
