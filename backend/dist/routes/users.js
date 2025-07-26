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
import { authenticateToken, requireAdmin, optionalAuth, } from '../middleware/auth';
import { validateUserRegistration, validateProfileUpdate, handleValidationErrors, } from '../middleware/security';
const router = Router();
// Helper function to create success response
function createSuccessResponse(data) {
    return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
    };
}
// Helper function to create error response
function createErrorResponse(code, message, details) {
    return {
        success: false,
        error: { code, message, details },
        timestamp: new Date().toISOString(),
    };
}
// Helper function to create paginated response
function createPaginatedResponse(data, page, limit, total) {
    return {
        success: true,
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
        timestamp: new Date().toISOString(),
    };
}
// GET /api/users - Get all users (with pagination)
router.get('/', optionalAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield getDatabase();
        const userModel = new User(db);
        // Parse pagination parameters
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
        const offset = (page - 1) * limit;
        // Get users and total count
        const users = yield userModel.findAll(limit, offset);
        const total = yield userModel.count();
        // Remove password from response
        const sanitizedUsers = users.map((user) => {
            const { password } = user, userWithoutPassword = __rest(user, ["password"]);
            return userWithoutPassword;
        });
        res.json(createPaginatedResponse(sanitizedUsers, page, limit, total));
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res
            .status(500)
            .json(createErrorResponse('FETCH_USERS_ERROR', 'Failed to fetch users'));
    }
}));
// GET /api/users/:id - Get user by ID
router.get('/:id', authenticateToken, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const { id } = req.params;
        const db = yield getDatabase();
        const userModel = new User(db);
        // Check if user is accessing their own profile or is admin
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) !== id && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'admin') {
            res
                .status(403)
                .json(createErrorResponse('ACCESS_DENIED', 'You can only access your own profile'));
            return;
        }
        const user = yield userModel.findById(id);
        if (!user) {
            res
                .status(404)
                .json(createErrorResponse('USER_NOT_FOUND', 'User not found'));
            return;
        }
        // Remove password from response
        const { password } = user, userWithoutPassword = __rest(user, ["password"]);
        res.json(createSuccessResponse(userWithoutPassword));
    }
    catch (error) {
        console.error('Error fetching user:', error);
        res
            .status(500)
            .json(createErrorResponse('FETCH_USER_ERROR', 'Failed to fetch user'));
    }
}));
// POST /api/users - Create new user (admin only)
router.post('/', authenticateToken, requireAdmin, validateUserRegistration, handleValidationErrors, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userData = req.body;
        // Validate required fields
        if (!userData.username || !userData.email || !userData.password) {
            res
                .status(400)
                .json(createErrorResponse('VALIDATION_ERROR', 'Username, email, and password are required'));
            return;
        }
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email)) {
            res
                .status(400)
                .json(createErrorResponse('VALIDATION_ERROR', 'Invalid email format'));
            return;
        }
        // Validate password strength
        if (userData.password.length < 6) {
            res
                .status(400)
                .json(createErrorResponse('VALIDATION_ERROR', 'Password must be at least 6 characters long'));
            return;
        }
        const db = yield getDatabase();
        const userModel = new User(db);
        // Check if user already exists
        const existingUserByEmail = yield userModel.findByEmail(userData.email);
        if (existingUserByEmail) {
            res
                .status(409)
                .json(createErrorResponse('USER_EXISTS', 'User with this email already exists'));
            return;
        }
        const existingUserByUsername = yield userModel.findByUsername(userData.username);
        if (existingUserByUsername) {
            res
                .status(409)
                .json(createErrorResponse('USER_EXISTS', 'User with this username already exists'));
            return;
        }
        // Create user
        const newUser = yield userModel.create(userData);
        // Remove password from response
        const { password } = newUser, userWithoutPassword = __rest(newUser, ["password"]);
        res.status(201).json(createSuccessResponse(userWithoutPassword));
    }
    catch (error) {
        console.error('Error creating user:', error);
        res
            .status(500)
            .json(createErrorResponse('CREATE_USER_ERROR', 'Failed to create user'));
    }
}));
// PUT /api/users/:id - Update user
router.put('/:id', authenticateToken, validateProfileUpdate, handleValidationErrors, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { id } = req.params;
        const updateData = req.body;
        // Check if user is updating their own profile or is admin
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) !== id && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'admin') {
            res
                .status(403)
                .json(createErrorResponse('ACCESS_DENIED', 'You can only update your own profile'));
            return;
        }
        // Non-admin users cannot change their role
        if (((_c = req.user) === null || _c === void 0 ? void 0 : _c.role) !== 'admin' && updateData.role) {
            res
                .status(403)
                .json(createErrorResponse('ACCESS_DENIED', 'You cannot change your role'));
            return;
        }
        const db = yield getDatabase();
        const userModel = new User(db);
        // Validate email format if provided
        if (updateData.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(updateData.email)) {
                res
                    .status(400)
                    .json(createErrorResponse('VALIDATION_ERROR', 'Invalid email format'));
                return;
            }
            // Check if email is already taken by another user
            const existingUser = yield userModel.findByEmail(updateData.email);
            if (existingUser && existingUser.id !== id) {
                res
                    .status(409)
                    .json(createErrorResponse('EMAIL_TAKEN', 'Email is already taken'));
                return;
            }
        }
        // Validate username if provided
        if (updateData.username) {
            const existingUser = yield userModel.findByUsername(updateData.username);
            if (existingUser && existingUser.id !== id) {
                res
                    .status(409)
                    .json(createErrorResponse('USERNAME_TAKEN', 'Username is already taken'));
                return;
            }
        }
        // Validate password strength if provided
        if (updateData.password && updateData.password.length < 6) {
            res
                .status(400)
                .json(createErrorResponse('VALIDATION_ERROR', 'Password must be at least 6 characters long'));
            return;
        }
        const updatedUser = yield userModel.update(id, updateData);
        if (!updatedUser) {
            res
                .status(404)
                .json(createErrorResponse('USER_NOT_FOUND', 'User not found'));
            return;
        }
        // Remove password from response
        const { password } = updatedUser, userWithoutPassword = __rest(updatedUser, ["password"]);
        res.json(createSuccessResponse(userWithoutPassword));
    }
    catch (error) {
        console.error('Error updating user:', error);
        res
            .status(500)
            .json(createErrorResponse('UPDATE_USER_ERROR', 'Failed to update user'));
    }
}));
// DELETE /api/users/:id - Delete user
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { id } = req.params;
        const db = yield getDatabase();
        const userModel = new User(db);
        // Prevent admin from deleting themselves
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) === id) {
            res
                .status(400)
                .json(createErrorResponse('CANNOT_DELETE_SELF', 'You cannot delete your own account'));
            return;
        }
        const deleted = yield userModel.delete(id);
        if (!deleted) {
            res
                .status(404)
                .json(createErrorResponse('USER_NOT_FOUND', 'User not found'));
            return;
        }
        res.json(createSuccessResponse({ message: 'User deleted successfully' }));
    }
    catch (error) {
        console.error('Error deleting user:', error);
        res
            .status(500)
            .json(createErrorResponse('DELETE_USER_ERROR', 'Failed to delete user'));
    }
}));
export default router;
