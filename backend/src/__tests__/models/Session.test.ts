import { getModels } from '../../database/init';
import { CreateSessionInput } from '../../models/Session';
import { CreateUserInput } from '../../models/User';

describe('Session Model', () => {
  let sessionModel: ReturnType<typeof getModels>['session'];
  let userModel: ReturnType<typeof getModels>['user'];
  let testUserId: string;

  beforeEach(async () => {
    const models = getModels();
    sessionModel = models.session;
    userModel = models.user;

    // Create a test user for session tests
    const userData: CreateUserInput = {
      username: 'sessionuser',
      email: 'session@example.com',
      password: 'password123',
    };
    const user = await userModel.create(userData);
    testUserId = user.id;
  });

  describe('create', () => {
    it('should create a new session', async () => {
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now
      const sessionData: CreateSessionInput = {
        userId: testUserId,
        token: 'test-token-123',
        expiresAt,
      };

      const session = await sessionModel.create(sessionData);

      expect(session.id).toBeDefined();
      expect(session.userId).toBe(sessionData.userId);
      expect(session.token).toBe(sessionData.token);
      expect(session.expiresAt).toEqual(expiresAt);
      expect(session.createdAt).toBeInstanceOf(Date);
    });

    it('should throw error for duplicate token', async () => {
      const expiresAt = new Date(Date.now() + 3600000);
      const sessionData: CreateSessionInput = {
        userId: testUserId,
        token: 'duplicate-token',
        expiresAt,
      };

      await sessionModel.create(sessionData);

      const duplicateData: CreateSessionInput = {
        userId: testUserId,
        token: 'duplicate-token',
        expiresAt,
      };

      await expect(sessionModel.create(duplicateData)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should find session by id', async () => {
      const expiresAt = new Date(Date.now() + 3600000);
      const sessionData: CreateSessionInput = {
        userId: testUserId,
        token: 'find-by-id-token',
        expiresAt,
      };

      const createdSession = await sessionModel.create(sessionData);
      const foundSession = await sessionModel.findById(createdSession.id);

      expect(foundSession).not.toBeNull();
      expect(foundSession!.id).toBe(createdSession.id);
      expect(foundSession!.token).toBe(sessionData.token);
    });

    it('should return null for non-existent id', async () => {
      const foundSession = await sessionModel.findById('non-existent-id');
      expect(foundSession).toBeNull();
    });
  });

  describe('findByToken', () => {
    it('should find session by token', async () => {
      const expiresAt = new Date(Date.now() + 3600000);
      const sessionData: CreateSessionInput = {
        userId: testUserId,
        token: 'find-by-token',
        expiresAt,
      };

      await sessionModel.create(sessionData);
      const foundSession = await sessionModel.findByToken(sessionData.token);

      expect(foundSession).not.toBeNull();
      expect(foundSession!.token).toBe(sessionData.token);
    });

    it('should return null for non-existent token', async () => {
      const foundSession = await sessionModel.findByToken('non-existent-token');
      expect(foundSession).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find all sessions for a user', async () => {
      const sessions = [
        {
          userId: testUserId,
          token: 'user-token-1',
          expiresAt: new Date(Date.now() + 3600000),
        },
        {
          userId: testUserId,
          token: 'user-token-2',
          expiresAt: new Date(Date.now() + 3600000),
        },
      ];

      for (const sessionData of sessions) {
        await sessionModel.create(sessionData);
      }

      const userSessions = await sessionModel.findByUserId(testUserId);
      expect(userSessions).toHaveLength(2);
      expect(userSessions.every((s) => s.userId === testUserId)).toBe(true);
    });

    it('should return empty array for user with no sessions', async () => {
      const userSessions = await sessionModel.findByUserId('non-existent-user');
      expect(userSessions).toHaveLength(0);
    });
  });

  describe('findValidByToken', () => {
    it('should find valid (non-expired) session by token', async () => {
      const validExpiresAt = new Date(Date.now() + 3600000); // 1 hour from now
      const expiredExpiresAt = new Date(Date.now() - 3600000); // 1 hour ago

      await sessionModel.create({
        userId: testUserId,
        token: 'valid-token',
        expiresAt: validExpiresAt,
      });

      await sessionModel.create({
        userId: testUserId,
        token: 'expired-token',
        expiresAt: expiredExpiresAt,
      });

      const validSession = await sessionModel.findValidByToken('valid-token');
      const expiredSession =
        await sessionModel.findValidByToken('expired-token');

      expect(validSession).not.toBeNull();
      expect(validSession!.token).toBe('valid-token');
      expect(expiredSession).toBeNull();
    });
  });

  describe('findValidByUserId', () => {
    it('should find only valid sessions for a user', async () => {
      const validExpiresAt = new Date(Date.now() + 3600000);
      const expiredExpiresAt = new Date(Date.now() - 3600000);

      await sessionModel.create({
        userId: testUserId,
        token: 'valid-token-1',
        expiresAt: validExpiresAt,
      });

      await sessionModel.create({
        userId: testUserId,
        token: 'valid-token-2',
        expiresAt: validExpiresAt,
      });

      await sessionModel.create({
        userId: testUserId,
        token: 'expired-token',
        expiresAt: expiredExpiresAt,
      });

      const validSessions = await sessionModel.findValidByUserId(testUserId);
      expect(validSessions).toHaveLength(2);
      expect(validSessions.every((s) => s.expiresAt > new Date())).toBe(true);
    });
  });

  describe('delete', () => {
    it('should delete session by id', async () => {
      const sessionData: CreateSessionInput = {
        userId: testUserId,
        token: 'delete-test-token',
        expiresAt: new Date(Date.now() + 3600000),
      };

      const session = await sessionModel.create(sessionData);
      const deleted = await sessionModel.delete(session.id);

      expect(deleted).toBe(true);

      const foundSession = await sessionModel.findById(session.id);
      expect(foundSession).toBeNull();
    });

    it('should return false for non-existent session', async () => {
      const deleted = await sessionModel.delete('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('deleteByToken', () => {
    it('should delete session by token', async () => {
      const sessionData: CreateSessionInput = {
        userId: testUserId,
        token: 'delete-by-token',
        expiresAt: new Date(Date.now() + 3600000),
      };

      await sessionModel.create(sessionData);
      const deleted = await sessionModel.deleteByToken(sessionData.token);

      expect(deleted).toBe(true);

      const foundSession = await sessionModel.findByToken(sessionData.token);
      expect(foundSession).toBeNull();
    });
  });

  describe('deleteByUserId', () => {
    it('should delete all sessions for a user', async () => {
      const sessions = [
        {
          userId: testUserId,
          token: 'user-token-1',
          expiresAt: new Date(Date.now() + 3600000),
        },
        {
          userId: testUserId,
          token: 'user-token-2',
          expiresAt: new Date(Date.now() + 3600000),
        },
      ];

      for (const sessionData of sessions) {
        await sessionModel.create(sessionData);
      }

      const deletedCount = await sessionModel.deleteByUserId(testUserId);
      expect(deletedCount).toBe(2);

      const userSessions = await sessionModel.findByUserId(testUserId);
      expect(userSessions).toHaveLength(0);
    });
  });

  describe('deleteExpired', () => {
    it('should delete only expired sessions', async () => {
      const validExpiresAt = new Date(Date.now() + 3600000);
      const expiredExpiresAt = new Date(Date.now() - 3600000);

      await sessionModel.create({
        userId: testUserId,
        token: 'valid-token',
        expiresAt: validExpiresAt,
      });

      await sessionModel.create({
        userId: testUserId,
        token: 'expired-token-1',
        expiresAt: expiredExpiresAt,
      });

      await sessionModel.create({
        userId: testUserId,
        token: 'expired-token-2',
        expiresAt: expiredExpiresAt,
      });

      const deletedCount = await sessionModel.deleteExpired();
      expect(deletedCount).toBe(2);

      const remainingSessions = await sessionModel.findByUserId(testUserId);
      expect(remainingSessions).toHaveLength(1);
      expect(remainingSessions[0].token).toBe('valid-token');
    });
  });

  describe('extendSession', () => {
    it('should extend session expiration', async () => {
      const originalExpiresAt = new Date(Date.now() + 3600000);
      const sessionData: CreateSessionInput = {
        userId: testUserId,
        token: 'extend-token',
        expiresAt: originalExpiresAt,
      };

      await sessionModel.create(sessionData);

      const newExpiresAt = new Date(Date.now() + 7200000); // 2 hours from now
      const extendedSession = await sessionModel.extendSession(
        sessionData.token,
        newExpiresAt
      );

      expect(extendedSession).not.toBeNull();
      expect(extendedSession!.expiresAt).toEqual(newExpiresAt);
      expect(extendedSession!.expiresAt).not.toEqual(originalExpiresAt);
    });

    it('should return null for non-existent token', async () => {
      const newExpiresAt = new Date(Date.now() + 7200000);
      const result = await sessionModel.extendSession(
        'non-existent-token',
        newExpiresAt
      );
      expect(result).toBeNull();
    });
  });

  describe('isTokenValid', () => {
    it('should return true for valid token', async () => {
      const sessionData: CreateSessionInput = {
        userId: testUserId,
        token: 'valid-check-token',
        expiresAt: new Date(Date.now() + 3600000),
      };

      await sessionModel.create(sessionData);
      const isValid = await sessionModel.isTokenValid(sessionData.token);
      expect(isValid).toBe(true);
    });

    it('should return false for expired token', async () => {
      const sessionData: CreateSessionInput = {
        userId: testUserId,
        token: 'expired-check-token',
        expiresAt: new Date(Date.now() - 3600000),
      };

      await sessionModel.create(sessionData);
      const isValid = await sessionModel.isTokenValid(sessionData.token);
      expect(isValid).toBe(false);
    });

    it('should return false for non-existent token', async () => {
      const isValid = await sessionModel.isTokenValid('non-existent-token');
      expect(isValid).toBe(false);
    });
  });

  describe('count methods', () => {
    beforeEach(async () => {
      const validExpiresAt = new Date(Date.now() + 3600000);
      const expiredExpiresAt = new Date(Date.now() - 3600000);

      await sessionModel.create({
        userId: testUserId,
        token: 'count-valid-1',
        expiresAt: validExpiresAt,
      });

      await sessionModel.create({
        userId: testUserId,
        token: 'count-valid-2',
        expiresAt: validExpiresAt,
      });

      await sessionModel.create({
        userId: testUserId,
        token: 'count-expired',
        expiresAt: expiredExpiresAt,
      });
    });

    it('should count all sessions', async () => {
      const count = await sessionModel.count();
      expect(count).toBe(3);
    });

    it('should count only valid sessions', async () => {
      const count = await sessionModel.countValid();
      expect(count).toBe(2);
    });

    it('should count sessions by user id', async () => {
      const count = await sessionModel.countByUserId(testUserId);
      expect(count).toBe(3);
    });
  });
});
