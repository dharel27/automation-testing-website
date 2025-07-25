import { getModels } from '../../database/init';
import { CreateUserInput, UpdateUserInput } from '../../models/User';

describe('User Model', () => {
  let userModel: ReturnType<typeof getModels>['user'];

  beforeEach(() => {
    const models = getModels();
    userModel = models.user;
  });

  describe('create', () => {
    it('should create a new user with valid data', async () => {
      const userData: CreateUserInput = {
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        role: 'user',
        profile: {
          firstName: 'Test',
          lastName: 'User',
        },
      };

      const user = await userModel.create(userData);

      expect(user.id).toBeDefined();
      expect(user.username).toBe(userData.username);
      expect(user.email).toBe(userData.email);
      expect(user.role).toBe(userData.role);
      expect(user.profile.firstName).toBe(userData.profile?.firstName);
      expect(user.profile.lastName).toBe(userData.profile?.lastName);
      expect(user.password).not.toBe(userData.password); // Should be hashed
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a user with default role when not specified', async () => {
      const userData: CreateUserInput = {
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'password123',
      };

      const user = await userModel.create(userData);

      expect(user.role).toBe('user');
      expect(user.profile.firstName).toBeUndefined();
      expect(user.profile.lastName).toBeUndefined();
    });

    it('should throw error for duplicate username', async () => {
      const userData: CreateUserInput = {
        username: 'duplicate',
        email: 'test1@example.com',
        password: 'password123',
      };

      await userModel.create(userData);

      const duplicateData: CreateUserInput = {
        username: 'duplicate',
        email: 'test2@example.com',
        password: 'password123',
      };

      await expect(userModel.create(duplicateData)).rejects.toThrow();
    });

    it('should throw error for duplicate email', async () => {
      const userData: CreateUserInput = {
        username: 'user1',
        email: 'duplicate@example.com',
        password: 'password123',
      };

      await userModel.create(userData);

      const duplicateData: CreateUserInput = {
        username: 'user2',
        email: 'duplicate@example.com',
        password: 'password123',
      };

      await expect(userModel.create(duplicateData)).rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const userData: CreateUserInput = {
        username: 'findtest',
        email: 'find@example.com',
        password: 'password123',
      };

      const createdUser = await userModel.create(userData);
      const foundUser = await userModel.findById(createdUser.id);

      expect(foundUser).not.toBeNull();
      expect(foundUser!.id).toBe(createdUser.id);
      expect(foundUser!.username).toBe(userData.username);
    });

    it('should return null for non-existent id', async () => {
      const foundUser = await userModel.findById('non-existent-id');
      expect(foundUser).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const userData: CreateUserInput = {
        username: 'emailtest',
        email: 'email@example.com',
        password: 'password123',
      };

      await userModel.create(userData);
      const foundUser = await userModel.findByEmail(userData.email);

      expect(foundUser).not.toBeNull();
      expect(foundUser!.email).toBe(userData.email);
    });

    it('should return null for non-existent email', async () => {
      const foundUser = await userModel.findByEmail('nonexistent@example.com');
      expect(foundUser).toBeNull();
    });
  });

  describe('findByUsername', () => {
    it('should find user by username', async () => {
      const userData: CreateUserInput = {
        username: 'usernametest',
        email: 'username@example.com',
        password: 'password123',
      };

      await userModel.create(userData);
      const foundUser = await userModel.findByUsername(userData.username);

      expect(foundUser).not.toBeNull();
      expect(foundUser!.username).toBe(userData.username);
    });

    it('should return null for non-existent username', async () => {
      const foundUser = await userModel.findByUsername('nonexistent');
      expect(foundUser).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all users', async () => {
      const users = [
        {
          username: 'user1',
          email: 'user1@example.com',
          password: 'password123',
        },
        {
          username: 'user2',
          email: 'user2@example.com',
          password: 'password123',
        },
        {
          username: 'user3',
          email: 'user3@example.com',
          password: 'password123',
        },
      ];

      for (const userData of users) {
        await userModel.create(userData);
      }

      const allUsers = await userModel.findAll();
      expect(allUsers).toHaveLength(3);
    });

    it('should support pagination', async () => {
      const users = [
        {
          username: 'user1',
          email: 'user1@example.com',
          password: 'password123',
        },
        {
          username: 'user2',
          email: 'user2@example.com',
          password: 'password123',
        },
        {
          username: 'user3',
          email: 'user3@example.com',
          password: 'password123',
        },
      ];

      for (const userData of users) {
        await userModel.create(userData);
      }

      const firstPage = await userModel.findAll(2, 0);
      const secondPage = await userModel.findAll(2, 2);

      expect(firstPage).toHaveLength(2);
      expect(secondPage).toHaveLength(1);
    });
  });

  describe('update', () => {
    it('should update user data', async () => {
      const userData: CreateUserInput = {
        username: 'updatetest',
        email: 'update@example.com',
        password: 'password123',
      };

      const user = await userModel.create(userData);

      const updateData: UpdateUserInput = {
        username: 'updateduser',
        profile: {
          firstName: 'Updated',
          lastName: 'Name',
        },
      };

      const updatedUser = await userModel.update(user.id, updateData);

      expect(updatedUser).not.toBeNull();
      expect(updatedUser!.username).toBe(updateData.username);
      expect(updatedUser!.profile.firstName).toBe(
        updateData.profile?.firstName
      );
      expect(updatedUser!.profile.lastName).toBe(updateData.profile?.lastName);
      expect(updatedUser!.email).toBe(userData.email); // Should remain unchanged
    });

    it('should return null for non-existent user', async () => {
      const updateData: UpdateUserInput = {
        username: 'newname',
      };

      const result = await userModel.update('non-existent-id', updateData);
      expect(result).toBeNull();
    });

    it('should hash password when updating', async () => {
      const userData: CreateUserInput = {
        username: 'passwordtest',
        email: 'password@example.com',
        password: 'oldpassword',
      };

      const user = await userModel.create(userData);
      const originalPassword = user.password;

      const updateData: UpdateUserInput = {
        password: 'newpassword',
      };

      const updatedUser = await userModel.update(user.id, updateData);

      expect(updatedUser!.password).not.toBe('newpassword');
      expect(updatedUser!.password).not.toBe(originalPassword);
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      const userData: CreateUserInput = {
        username: 'deletetest',
        email: 'delete@example.com',
        password: 'password123',
      };

      const user = await userModel.create(userData);
      const deleted = await userModel.delete(user.id);

      expect(deleted).toBe(true);

      const foundUser = await userModel.findById(user.id);
      expect(foundUser).toBeNull();
    });

    it('should return false for non-existent user', async () => {
      const deleted = await userModel.delete('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const userData: CreateUserInput = {
        username: 'verifytest',
        email: 'verify@example.com',
        password: 'correctpassword',
      };

      const user = await userModel.create(userData);
      const isValid = await userModel.verifyPassword(user, 'correctpassword');

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const userData: CreateUserInput = {
        username: 'verifytest2',
        email: 'verify2@example.com',
        password: 'correctpassword',
      };

      const user = await userModel.create(userData);
      const isValid = await userModel.verifyPassword(user, 'wrongpassword');

      expect(isValid).toBe(false);
    });
  });

  describe('count', () => {
    it('should return correct user count', async () => {
      expect(await userModel.count()).toBe(0);

      await userModel.create({
        username: 'count1',
        email: 'count1@example.com',
        password: 'password123',
      });

      expect(await userModel.count()).toBe(1);

      await userModel.create({
        username: 'count2',
        email: 'count2@example.com',
        password: 'password123',
      });

      expect(await userModel.count()).toBe(2);
    });
  });
});
