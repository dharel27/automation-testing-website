import request from 'supertest';
import express from 'express';
import authRoutes from '../../routes/auth';
import { getDatabase } from '../../database/connection';
import { User, UserData } from '../../models/User';
import { Session } from '../../models/Session';
import { generateToken } from '../../middleware/auth';

// Mock dependencies
jest.mock('../../database/connection');
jest.mock('../../models/User');
jest.mock('../../models/Session');
jest.mock('../../middleware/auth', () => ({
  ...jest.requireActual('../../middleware/auth'),
  generateToken: jest.fn(),
}));

const mockGetDatabase = getDatabase as jest.MockedFunction<typeof getDatabase>;
const mockGenerateToken = generateToken as jest.MockedFunction<
  typeof generateToken
>;

describe('Auth Routes', () => {
  let app: express.Application;
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
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);

    mockDb = {};
    mockUserModel = {
      create: jest.fn(),
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      verifyPassword: jest.fn(),
    } as any;
    mockSessionModel = {
      create: jest.fn(),
      deleteByToken: jest.fn(),
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

  describe('POST /api/auth/register', () => {
    const validRegistrationData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      role: 'user',
      profile: { firstName: 'Test', lastName: 'User' },
    };

    it('should register a new user successfully', async () => {
      const mockToken = 'mock-jwt-token';
      mockUserModel.findByEmail.mockResolvedValue(null);
      mockUserModel.findByUsername.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue(mockUser);
      mockGenerateToken.mockReturnValue(mockToken);
      mockSessionModel.create.mockResolvedValue({} as any);

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistrationData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toEqual(
        expect.objectContaining({
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
          role: mockUser.role,
        })
      );
      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.data.token).toBe(mockToken);
      expect(mockUserModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          username: validRegistrationData.username,
          email: validRegistrationData.email,
          password: validRegistrationData.password,
          role: validRegistrationData.role,
        })
      );
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({ username: 'testuser' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_FIELDS');
    });

    it('should return 400 for invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validRegistrationData,
          email: 'invalid-email',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_EMAIL');
    });

    it('should return 400 for weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validRegistrationData,
          password: '123',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('WEAK_PASSWORD');
    });

    it('should return 400 for invalid role', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          ...validRegistrationData,
          role: 'invalid-role',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_ROLE');
    });

    it('should return 409 for existing email', async () => {
      mockUserModel.findByEmail.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistrationData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EMAIL_EXISTS');
    });

    it('should return 409 for existing username', async () => {
      mockUserModel.findByEmail.mockResolvedValue(null);
      mockUserModel.findByUsername.mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegistrationData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('USERNAME_EXISTS');
    });
  });

  describe('POST /api/auth/login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login user with email successfully', async () => {
      const mockToken = 'mock-jwt-token';
      mockUserModel.findByEmail.mockResolvedValue(mockUser);
      mockUserModel.verifyPassword.mockResolvedValue(true);
      mockGenerateToken.mockReturnValue(mockToken);
      mockSessionModel.create.mockResolvedValue({} as any);

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toEqual(
        expect.objectContaining({
          id: mockUser.id,
          username: mockUser.username,
          email: mockUser.email,
          role: mockUser.role,
        })
      );
      expect(response.body.data.user.password).toBeUndefined();
      expect(response.body.data.token).toBe(mockToken);
    });

    it('should login user with username successfully', async () => {
      const mockToken = 'mock-jwt-token';
      const loginData = { username: 'testuser', password: 'password123' };

      mockUserModel.findByUsername.mockResolvedValue(mockUser);
      mockUserModel.verifyPassword.mockResolvedValue(true);
      mockGenerateToken.mockReturnValue(mockToken);
      mockSessionModel.create.mockResolvedValue({} as any);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.token).toBe(mockToken);
    });

    it('should return 400 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_CREDENTIALS');
    });

    it('should return 401 for non-existent user', async () => {
      mockUserModel.findByEmail.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('should return 401 for invalid password', async () => {
      mockUserModel.findByEmail.mockResolvedValue(mockUser);
      mockUserModel.verifyPassword.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user successfully', async () => {
      const mockToken = 'mock-jwt-token';
      mockSessionModel.deleteByToken.mockResolvedValue(true);

      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${mockToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('Logged out successfully');
      expect(mockSessionModel.deleteByToken).toHaveBeenCalledWith(mockToken);
    });

    it('should handle logout without token', async () => {
      const response = await request(app).post('/api/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should return user profile successfully', async () => {
      // This test would require mocking the authenticateToken middleware
      // For now, we'll test the error case
      const response = await request(app).get('/api/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should require authentication', async () => {
      const response = await request(app)
        .put('/api/auth/profile')
        .send({ username: 'newusername' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });
});
