import { Router, Response } from 'express';
import { getDatabase } from '../database/connection';
import { User, CreateUserInput, UpdateUserInput } from '../models/User';
import {
  AuthenticatedRequest,
  authenticateToken,
  requireAdmin,
  requireUserOrAdmin,
  optionalAuth,
} from '../middleware/auth';
import {
  validateUserRegistration,
  validateProfileUpdate,
  handleValidationErrors,
} from '../middleware/security';

const router = Router();

// Response interfaces
interface SuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  timestamp: string;
}

// Helper function to create success response
function createSuccessResponse<T>(data: T): SuccessResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };
}

// Helper function to create error response
function createErrorResponse(
  code: string,
  message: string,
  details?: any
): ErrorResponse {
  return {
    success: false,
    error: { code, message, details },
    timestamp: new Date().toISOString(),
  };
}

// Helper function to create paginated response
function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginatedResponse<T> {
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
router.get(
  '/',
  optionalAuth,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const db = await getDatabase();
      const userModel = new User(db);

      // Parse pagination parameters
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(
        100,
        Math.max(1, parseInt(req.query.limit as string) || 10)
      );
      const offset = (page - 1) * limit;

      // Get users and total count
      const users = await userModel.findAll(limit, offset);
      const total = await userModel.count();

      // Remove password from response
      const sanitizedUsers = users.map((user) => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      res.json(createPaginatedResponse(sanitizedUsers, page, limit, total));
    } catch (error) {
      console.error('Error fetching users:', error);
      res
        .status(500)
        .json(
          createErrorResponse('FETCH_USERS_ERROR', 'Failed to fetch users')
        );
    }
  }
);

// GET /api/users/:id - Get user by ID
router.get(
  '/:id',
  authenticateToken,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const db = await getDatabase();
      const userModel = new User(db);

      // Check if user is accessing their own profile or is admin
      if (req.user?.id !== id && req.user?.role !== 'admin') {
        res
          .status(403)
          .json(
            createErrorResponse(
              'ACCESS_DENIED',
              'You can only access your own profile'
            )
          );
        return;
      }

      const user = await userModel.findById(id);

      if (!user) {
        res
          .status(404)
          .json(createErrorResponse('USER_NOT_FOUND', 'User not found'));
        return;
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.json(createSuccessResponse(userWithoutPassword));
    } catch (error) {
      console.error('Error fetching user:', error);
      res
        .status(500)
        .json(createErrorResponse('FETCH_USER_ERROR', 'Failed to fetch user'));
    }
  }
);

// POST /api/users - Create new user (admin only)
router.post(
  '/',
  authenticateToken,
  requireAdmin,
  validateUserRegistration,
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userData: CreateUserInput = req.body;

      // Validate required fields
      if (!userData.username || !userData.email || !userData.password) {
        res
          .status(400)
          .json(
            createErrorResponse(
              'VALIDATION_ERROR',
              'Username, email, and password are required'
            )
          );
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        res
          .status(400)
          .json(
            createErrorResponse('VALIDATION_ERROR', 'Invalid email format')
          );
        return;
      }

      // Validate password strength
      if (userData.password.length < 6) {
        res
          .status(400)
          .json(
            createErrorResponse(
              'VALIDATION_ERROR',
              'Password must be at least 6 characters long'
            )
          );
        return;
      }

      const db = await getDatabase();
      const userModel = new User(db);

      // Check if user already exists
      const existingUserByEmail = await userModel.findByEmail(userData.email);
      if (existingUserByEmail) {
        res
          .status(409)
          .json(
            createErrorResponse(
              'USER_EXISTS',
              'User with this email already exists'
            )
          );
        return;
      }

      const existingUserByUsername = await userModel.findByUsername(
        userData.username
      );
      if (existingUserByUsername) {
        res
          .status(409)
          .json(
            createErrorResponse(
              'USER_EXISTS',
              'User with this username already exists'
            )
          );
        return;
      }

      // Create user
      const newUser = await userModel.create(userData);

      // Remove password from response
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json(createSuccessResponse(userWithoutPassword));
    } catch (error) {
      console.error('Error creating user:', error);
      res
        .status(500)
        .json(
          createErrorResponse('CREATE_USER_ERROR', 'Failed to create user')
        );
    }
  }
);

// PUT /api/users/:id - Update user
router.put(
  '/:id',
  authenticateToken,
  validateProfileUpdate,
  handleValidationErrors,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const updateData: UpdateUserInput = req.body;

      // Check if user is updating their own profile or is admin
      if (req.user?.id !== id && req.user?.role !== 'admin') {
        res
          .status(403)
          .json(
            createErrorResponse(
              'ACCESS_DENIED',
              'You can only update your own profile'
            )
          );
        return;
      }

      // Non-admin users cannot change their role
      if (req.user?.role !== 'admin' && updateData.role) {
        res
          .status(403)
          .json(
            createErrorResponse('ACCESS_DENIED', 'You cannot change your role')
          );
        return;
      }

      const db = await getDatabase();
      const userModel = new User(db);

      // Validate email format if provided
      if (updateData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(updateData.email)) {
          res
            .status(400)
            .json(
              createErrorResponse('VALIDATION_ERROR', 'Invalid email format')
            );
          return;
        }

        // Check if email is already taken by another user
        const existingUser = await userModel.findByEmail(updateData.email);
        if (existingUser && existingUser.id !== id) {
          res
            .status(409)
            .json(createErrorResponse('EMAIL_TAKEN', 'Email is already taken'));
          return;
        }
      }

      // Validate username if provided
      if (updateData.username) {
        const existingUser = await userModel.findByUsername(
          updateData.username
        );
        if (existingUser && existingUser.id !== id) {
          res
            .status(409)
            .json(
              createErrorResponse('USERNAME_TAKEN', 'Username is already taken')
            );
          return;
        }
      }

      // Validate password strength if provided
      if (updateData.password && updateData.password.length < 6) {
        res
          .status(400)
          .json(
            createErrorResponse(
              'VALIDATION_ERROR',
              'Password must be at least 6 characters long'
            )
          );
        return;
      }

      const updatedUser = await userModel.update(id, updateData);

      if (!updatedUser) {
        res
          .status(404)
          .json(createErrorResponse('USER_NOT_FOUND', 'User not found'));
        return;
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(createSuccessResponse(userWithoutPassword));
    } catch (error) {
      console.error('Error updating user:', error);
      res
        .status(500)
        .json(
          createErrorResponse('UPDATE_USER_ERROR', 'Failed to update user')
        );
    }
  }
);

// DELETE /api/users/:id - Delete user
router.delete(
  '/:id',
  authenticateToken,
  requireAdmin,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const db = await getDatabase();
      const userModel = new User(db);

      // Prevent admin from deleting themselves
      if (req.user?.id === id) {
        res
          .status(400)
          .json(
            createErrorResponse(
              'CANNOT_DELETE_SELF',
              'You cannot delete your own account'
            )
          );
        return;
      }

      const deleted = await userModel.delete(id);

      if (!deleted) {
        res
          .status(404)
          .json(createErrorResponse('USER_NOT_FOUND', 'User not found'));
        return;
      }

      res.json(createSuccessResponse({ message: 'User deleted successfully' }));
    } catch (error) {
      console.error('Error deleting user:', error);
      res
        .status(500)
        .json(
          createErrorResponse('DELETE_USER_ERROR', 'Failed to delete user')
        );
    }
  }
);

export default router;
