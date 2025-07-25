var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getDatabase } from './connection';
import { MigrationRunner } from './migrations';
import { User, Product, Session, FileRecord } from '../models/index';
export class DatabaseManager {
    constructor() {
        this.db = null;
        this.models = null;
    }
    static getInstance() {
        if (!DatabaseManager.instance) {
            DatabaseManager.instance = new DatabaseManager();
        }
        return DatabaseManager.instance;
    }
    initialize(dbPath) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.models && this.db) {
                return this.models;
            }
            try {
                // Connect to database
                this.db = yield getDatabase(dbPath);
                console.log('Database connection established');
                // Run migrations
                const migrationRunner = new MigrationRunner(this.db);
                yield migrationRunner.runMigrations();
                console.log('Database migrations completed');
                // Initialize models
                this.models = {
                    user: new User(this.db),
                    product: new Product(this.db),
                    session: new Session(this.db),
                    fileRecord: new FileRecord(this.db),
                };
                console.log('Database models initialized');
                return this.models;
            }
            catch (error) {
                console.error('Failed to initialize database:', error);
                throw error;
            }
        });
    }
    getModels() {
        if (!this.models) {
            throw new Error('Database not initialized. Call initialize() first.');
        }
        return this.models;
    }
    getDatabase() {
        if (!this.db) {
            throw new Error('Database not initialized. Call initialize() first.');
        }
        return this.db;
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.db) {
                yield this.db.close();
                this.db = null;
                this.models = null;
                console.log('Database connection closed');
            }
        });
    }
    reset() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.db) {
                throw new Error('Database not initialized');
            }
            // Drop all tables
            yield this.db.run('DROP TABLE IF EXISTS file_records');
            yield this.db.run('DROP TABLE IF EXISTS sessions');
            yield this.db.run('DROP TABLE IF EXISTS products');
            yield this.db.run('DROP TABLE IF EXISTS users');
            yield this.db.run('DROP TABLE IF EXISTS migrations');
            console.log('Database reset completed');
            // Re-run migrations
            const migrationRunner = new MigrationRunner(this.db);
            yield migrationRunner.runMigrations();
            console.log('Database re-initialized after reset');
        });
    }
}
// Convenience functions
export const initializeDatabase = (dbPath) => __awaiter(void 0, void 0, void 0, function* () {
    const manager = DatabaseManager.getInstance();
    return yield manager.initialize(dbPath);
});
export const getModels = () => {
    const manager = DatabaseManager.getInstance();
    return manager.getModels();
};
export const getDatabaseInstance = () => {
    const manager = DatabaseManager.getInstance();
    return manager.getDatabase();
};
export const closeDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    const manager = DatabaseManager.getInstance();
    yield manager.close();
});
export const resetDatabase = () => __awaiter(void 0, void 0, void 0, function* () {
    const manager = DatabaseManager.getInstance();
    yield manager.reset();
});
