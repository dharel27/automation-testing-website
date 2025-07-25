var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { DatabaseManager, initializeDatabase, getModels, getDatabaseInstance, closeDatabase, resetDatabase, } from '../../database/init';
import fs from 'fs';
import path from 'path';
describe('Database Initialization', () => {
    const TEST_DB_PATH = path.join(process.cwd(), 'init-test.sqlite');
    afterEach(() => __awaiter(void 0, void 0, void 0, function* () {
        try {
            yield closeDatabase();
        }
        catch (error) {
            // Ignore errors during cleanup
        }
        if (fs.existsSync(TEST_DB_PATH)) {
            fs.unlinkSync(TEST_DB_PATH);
        }
    }));
    describe('DatabaseManager', () => {
        it('should be a singleton', () => {
            const instance1 = DatabaseManager.getInstance();
            const instance2 = DatabaseManager.getInstance();
            expect(instance1).toBe(instance2);
        });
        it('should initialize database and models', () => __awaiter(void 0, void 0, void 0, function* () {
            const manager = DatabaseManager.getInstance();
            const models = yield manager.initialize(TEST_DB_PATH);
            expect(models).toBeDefined();
            expect(models.user).toBeDefined();
            expect(models.product).toBeDefined();
            expect(models.session).toBeDefined();
            expect(models.fileRecord).toBeDefined();
            expect(fs.existsSync(TEST_DB_PATH)).toBe(true);
        }));
        it('should return same models on subsequent calls', () => __awaiter(void 0, void 0, void 0, function* () {
            const manager = DatabaseManager.getInstance();
            const models1 = yield manager.initialize(TEST_DB_PATH);
            const models2 = yield manager.initialize(TEST_DB_PATH);
            expect(models1).toBe(models2);
        }));
        it('should throw error when getting models before initialization', () => {
            const manager = DatabaseManager.getInstance();
            expect(() => manager.getModels()).toThrow('Database not initialized');
        });
        it('should throw error when getting database before initialization', () => {
            const manager = DatabaseManager.getInstance();
            expect(() => manager.getDatabase()).toThrow('Database not initialized');
        });
        it('should close database connection', () => __awaiter(void 0, void 0, void 0, function* () {
            const manager = DatabaseManager.getInstance();
            yield manager.initialize(TEST_DB_PATH);
            expect(() => manager.getModels()).not.toThrow();
            yield manager.close();
            expect(() => manager.getModels()).toThrow('Database not initialized');
        }));
        it('should reset database', () => __awaiter(void 0, void 0, void 0, function* () {
            const manager = DatabaseManager.getInstance();
            const models = yield manager.initialize(TEST_DB_PATH);
            // Create some test data
            yield models.user.create({
                username: 'testuser',
                email: 'test@example.com',
                password: 'password123',
            });
            expect(yield models.user.count()).toBe(1);
            // Reset database
            yield manager.reset();
            // Data should be gone
            expect(yield models.user.count()).toBe(0);
        }));
    });
    describe('Convenience functions', () => {
        it('should initialize database using convenience function', () => __awaiter(void 0, void 0, void 0, function* () {
            const models = yield initializeDatabase(TEST_DB_PATH);
            expect(models).toBeDefined();
            expect(models.user).toBeDefined();
            expect(fs.existsSync(TEST_DB_PATH)).toBe(true);
        }));
        it('should get models using convenience function', () => __awaiter(void 0, void 0, void 0, function* () {
            yield initializeDatabase(TEST_DB_PATH);
            const models = getModels();
            expect(models).toBeDefined();
            expect(models.user).toBeDefined();
        }));
        it('should get database instance using convenience function', () => __awaiter(void 0, void 0, void 0, function* () {
            yield initializeDatabase(TEST_DB_PATH);
            const db = getDatabaseInstance();
            expect(db).toBeDefined();
            expect(db.run).toBeDefined();
            expect(db.get).toBeDefined();
            expect(db.all).toBeDefined();
        }));
        it('should close database using convenience function', () => __awaiter(void 0, void 0, void 0, function* () {
            yield initializeDatabase(TEST_DB_PATH);
            expect(() => getModels()).not.toThrow();
            yield closeDatabase();
            expect(() => getModels()).toThrow('Database not initialized');
        }));
        it('should reset database using convenience function', () => __awaiter(void 0, void 0, void 0, function* () {
            const models = yield initializeDatabase(TEST_DB_PATH);
            // Create test data
            yield models.user.create({
                username: 'resettest',
                email: 'reset@example.com',
                password: 'password123',
            });
            expect(yield models.user.count()).toBe(1);
            // Reset
            yield resetDatabase();
            // Data should be gone
            expect(yield models.user.count()).toBe(0);
        }));
    });
    describe('Database migrations', () => {
        it('should create all required tables', () => __awaiter(void 0, void 0, void 0, function* () {
            const models = yield initializeDatabase(TEST_DB_PATH);
            const db = getDatabaseInstance();
            // Check that all tables exist by trying to query them
            const userCount = yield models.user.count();
            const productCount = yield models.product.count();
            const sessionCount = yield models.session.count();
            const fileCount = yield models.fileRecord.count();
            expect(userCount).toBe(0);
            expect(productCount).toBe(0);
            expect(sessionCount).toBe(0);
            expect(fileCount).toBe(0);
            // Check migrations table exists
            const migrations = yield db.all('SELECT * FROM migrations');
            expect(migrations).toBeDefined();
            expect(migrations.length).toBeGreaterThan(0);
        }));
        it('should not run migrations twice', () => __awaiter(void 0, void 0, void 0, function* () {
            yield initializeDatabase(TEST_DB_PATH);
            const db = getDatabaseInstance();
            const migrationsAfterFirst = yield db.all('SELECT * FROM migrations');
            const firstCount = migrationsAfterFirst.length;
            // Close and reinitialize
            yield closeDatabase();
            yield initializeDatabase(TEST_DB_PATH);
            const migrationsAfterSecond = yield db.all('SELECT * FROM migrations');
            const secondCount = migrationsAfterSecond.length;
            expect(secondCount).toBe(firstCount);
        }));
    });
    describe('Error handling', () => {
        it('should handle database connection errors gracefully', () => __awaiter(void 0, void 0, void 0, function* () {
            const invalidPath = '/invalid/path/database.sqlite';
            yield expect(initializeDatabase(invalidPath)).rejects.toThrow();
        }));
        it('should throw error when resetting uninitialized database', () => __awaiter(void 0, void 0, void 0, function* () {
            const manager = DatabaseManager.getInstance();
            yield expect(manager.reset()).rejects.toThrow('Database not initialized');
        }));
    });
});
