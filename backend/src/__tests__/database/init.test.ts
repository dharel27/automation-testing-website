import {
  DatabaseManager,
  initializeDatabase,
  getModels,
  getDatabaseInstance,
  closeDatabase,
  resetDatabase,
} from '../../database/init';
import fs from 'fs';
import path from 'path';

describe('Database Initialization', () => {
  const TEST_DB_PATH = path.join(process.cwd(), 'init-test.sqlite');

  afterEach(async () => {
    try {
      await closeDatabase();
    } catch (error) {
      // Ignore errors during cleanup
    }

    if (fs.existsSync(TEST_DB_PATH)) {
      fs.unlinkSync(TEST_DB_PATH);
    }
  });

  describe('DatabaseManager', () => {
    it('should be a singleton', () => {
      const instance1 = DatabaseManager.getInstance();
      const instance2 = DatabaseManager.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should initialize database and models', async () => {
      const manager = DatabaseManager.getInstance();
      const models = await manager.initialize(TEST_DB_PATH);

      expect(models).toBeDefined();
      expect(models.user).toBeDefined();
      expect(models.product).toBeDefined();
      expect(models.session).toBeDefined();
      expect(models.fileRecord).toBeDefined();

      expect(fs.existsSync(TEST_DB_PATH)).toBe(true);
    });

    it('should return same models on subsequent calls', async () => {
      const manager = DatabaseManager.getInstance();
      const models1 = await manager.initialize(TEST_DB_PATH);
      const models2 = await manager.initialize(TEST_DB_PATH);

      expect(models1).toBe(models2);
    });

    it('should throw error when getting models before initialization', () => {
      const manager = DatabaseManager.getInstance();
      expect(() => manager.getModels()).toThrow('Database not initialized');
    });

    it('should throw error when getting database before initialization', () => {
      const manager = DatabaseManager.getInstance();
      expect(() => manager.getDatabase()).toThrow('Database not initialized');
    });

    it('should close database connection', async () => {
      const manager = DatabaseManager.getInstance();
      await manager.initialize(TEST_DB_PATH);

      expect(() => manager.getModels()).not.toThrow();

      await manager.close();

      expect(() => manager.getModels()).toThrow('Database not initialized');
    });

    it('should reset database', async () => {
      const manager = DatabaseManager.getInstance();
      const models = await manager.initialize(TEST_DB_PATH);

      // Create some test data
      await models.user.create({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(await models.user.count()).toBe(1);

      // Reset database
      await manager.reset();

      // Data should be gone
      expect(await models.user.count()).toBe(0);
    });
  });

  describe('Convenience functions', () => {
    it('should initialize database using convenience function', async () => {
      const models = await initializeDatabase(TEST_DB_PATH);

      expect(models).toBeDefined();
      expect(models.user).toBeDefined();
      expect(fs.existsSync(TEST_DB_PATH)).toBe(true);
    });

    it('should get models using convenience function', async () => {
      await initializeDatabase(TEST_DB_PATH);
      const models = getModels();

      expect(models).toBeDefined();
      expect(models.user).toBeDefined();
    });

    it('should get database instance using convenience function', async () => {
      await initializeDatabase(TEST_DB_PATH);
      const db = getDatabaseInstance();

      expect(db).toBeDefined();
      expect(db.run).toBeDefined();
      expect(db.get).toBeDefined();
      expect(db.all).toBeDefined();
    });

    it('should close database using convenience function', async () => {
      await initializeDatabase(TEST_DB_PATH);

      expect(() => getModels()).not.toThrow();

      await closeDatabase();

      expect(() => getModels()).toThrow('Database not initialized');
    });

    it('should reset database using convenience function', async () => {
      const models = await initializeDatabase(TEST_DB_PATH);

      // Create test data
      await models.user.create({
        username: 'resettest',
        email: 'reset@example.com',
        password: 'password123',
      });

      expect(await models.user.count()).toBe(1);

      // Reset
      await resetDatabase();

      // Data should be gone
      expect(await models.user.count()).toBe(0);
    });
  });

  describe('Database migrations', () => {
    it('should create all required tables', async () => {
      const models = await initializeDatabase(TEST_DB_PATH);
      const db = getDatabaseInstance();

      // Check that all tables exist by trying to query them
      const userCount = await models.user.count();
      const productCount = await models.product.count();
      const sessionCount = await models.session.count();
      const fileCount = await models.fileRecord.count();

      expect(userCount).toBe(0);
      expect(productCount).toBe(0);
      expect(sessionCount).toBe(0);
      expect(fileCount).toBe(0);

      // Check migrations table exists
      const migrations = await db.all('SELECT * FROM migrations');
      expect(migrations).toBeDefined();
      expect(migrations.length).toBeGreaterThan(0);
    });

    it('should not run migrations twice', async () => {
      await initializeDatabase(TEST_DB_PATH);
      const db = getDatabaseInstance();

      const migrationsAfterFirst = await db.all('SELECT * FROM migrations');
      const firstCount = migrationsAfterFirst.length;

      // Close and reinitialize
      await closeDatabase();
      await initializeDatabase(TEST_DB_PATH);

      const migrationsAfterSecond = await db.all('SELECT * FROM migrations');
      const secondCount = migrationsAfterSecond.length;

      expect(secondCount).toBe(firstCount);
    });
  });

  describe('Error handling', () => {
    it('should handle database connection errors gracefully', async () => {
      const invalidPath = '/invalid/path/database.sqlite';

      await expect(initializeDatabase(invalidPath)).rejects.toThrow();
    });

    it('should throw error when resetting uninitialized database', async () => {
      const manager = DatabaseManager.getInstance();
      await expect(manager.reset()).rejects.toThrow('Database not initialized');
    });
  });
});
