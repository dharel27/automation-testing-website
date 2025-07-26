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
import { Router } from 'express';
import { getDatabase } from '../database/connection';
import { User } from '../models/User';
import { Session } from '../models/Session';
import { authenticateToken, } from '../middleware/auth';
import { authRateLimit, validateUserRegistration, validateUserLogin, validateProfileUpdate, handleValidationErrors, } from '../middleware/security';
import { generateTokenPair, refreshTokenEndpoint, revokeAllSessions, } from '../middleware/sessionManager';
const router = Router();
/**
 * User registration endpoint
 * POST /api/auth/register
 */
router.post('/register', authRateLimit, validateUserRegistration, handleValidationErrors, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const db = yield getDatabase();
        const userModel = new User(db);
        // Check if user already exists
        const existingUserByEmail = yield userModel.findByEmail(email);
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
        const existingUserByUsername = yield userModel.findByUsername(username);
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
        const userData = {
            username,
            email,
            password,
            role: role,
            profile: profile || {},
        };
        const newUser = yield userModel.create(userData);
        // Generate token pair
        const tokenPair = generateTokenPair(newUser);
        // Create session
        const sessionModel = new Session(db);
        yield sessionModel.create({
            userId: newUser.id,
            token: tokenPair.refreshToken,
            expiresAt: tokenPair.refreshTokenExpiresAt,
        });
        // Return user data without password
        const { password: _ } = newUser, userWithoutPassword = __rest(newUser, ["password"]);
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
    }
    catch (error) {
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
}));
/**
 * User login endpoint
 * POST /api/auth/login
 */
router.post('/login', authRateLimit, validateUserLogin, handleValidationErrors, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const db = yield getDatabase();
        const userModel = new User(db);
        // Find user by email or username
        let user = null;
        if (email) {
            user = yield userModel.findByEmail(email);
        }
        else if (username) {
            user = yield userModel.findByUsername(username);
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
        const isValidPassword = yield userModel.verifyPassword(user, password);
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
        yield sessionModel.create({
            userId: user.id,
            token: tokenPair.refreshToken,
            expiresAt: tokenPair.refreshTokenExpiresAt,
        });
        // Return user data without password
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
}));
/**
 * User logout endpoint
 * POST /api/auth/logout
 */
router.post('/logout', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
            const db = yield getDatabase();
            const sessionModel = new Session(db);
            // Delete the session
            yield sessionModel.deleteByToken(token);
        }
        res.json({
            success: true,
            data: {
                message: 'Logged out successfully',
            },
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
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
}));
/**
 * Get current user profile
 * GET /api/auth/profile
 */
router.get('/profile', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const _a = req.user, { password: _ } = _a, userWithoutPassword = __rest(_a, ["password"]);
        res.json({
            success: true,
            data: {
                user: userWithoutPassword,
            },
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
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
}));
/**
 * Update user profile
 * PUT /api/auth/profile
 */
router.put('/profile', authenticateToken, validateProfileUpdate, handleValidationErrors, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const db = yield getDatabase();
        const userModel = new User(db);
        // Check if email is being changed and if it already exists
        if (email && email !== req.user.email) {
            const existingUser = yield userModel.findByEmail(email);
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
            const existingUser = yield userModel.findByUsername(username);
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
        const updatedUser = yield userModel.update(req.user.id, {
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
        const { password: _ } = updatedUser, userWithoutPassword = __rest(updatedUser, ["password"]);
        res.json({
            success: true,
            data: {
                user: userWithoutPassword,
            },
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
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
}));
/**
 * Token refresh endpoint
 * POST /api/auth/refresh
 */
router.post('/refresh', refreshTokenEndpoint);
/**
 * Logout from all devices endpoint
 * POST /api/auth/logout-all
 */
router.post('/logout-all', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        yield revokeAllSessions(req.user.id);
        res.json({
            success: true,
            data: {
                message: 'Logged out from all devices successfully',
            },
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
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
}));
export default router;
