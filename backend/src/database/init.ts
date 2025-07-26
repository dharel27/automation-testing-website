import { getDatabase, Database } from './connection.js';
import { MigrationRunner } from './migrations.js';
import { User, Product, Session, FileRecord } from '../models/index.js';

export interface DatabaseModels {
  user: User;
  product: Product;
  session: Session;
  fileRecord: FileRecord;
}

export class DatabaseManager {
  private static instance: DatabaseManager;
  private db: Database | null = null;
  private models: DatabaseModels | null = null;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public async initialize(dbPath?: string): Promise<DatabaseModels> {
    if (this.models && this.db) {
      return this.models;
    }

    try {
      // Connect to database
      this.db = await getDatabase(dbPath);
      console.log('Database connection established');

      // Run migrations
      const migrationRunner = new MigrationRunner(this.db);
      await migrationRunner.runMigrations();
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
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  public getModels(): DatabaseModels {
    if (!this.models) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.models;
  }

  public getDatabase(): Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  public async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.models = null;
      console.log('Database connection closed');
    }
  }

  public async reset(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    // Drop all tables
    await this.db.run('DROP TABLE IF EXISTS file_records');
    await this.db.run('DROP TABLE IF EXISTS sessions');
    await this.db.run('DROP TABLE IF EXISTS products');
    await this.db.run('DROP TABLE IF EXISTS users');
    await this.db.run('DROP TABLE IF EXISTS migrations');

    console.log('Database reset completed');

    // Re-run migrations
    const migrationRunner = new MigrationRunner(this.db);
    await migrationRunner.runMigrations();
    console.log('Database re-initialized after reset');
  }
}

// Convenience functions
export const initializeDatabase = async (
  dbPath?: string
): Promise<DatabaseModels> => {
  const manager = DatabaseManager.getInstance();
  return await manager.initialize(dbPath);
};

export const getModels = (): DatabaseModels => {
  const manager = DatabaseManager.getInstance();
  return manager.getModels();
};

export const getDatabaseInstance = (): Database => {
  const manager = DatabaseManager.getInstance();
  return manager.getDatabase();
};

export const closeDatabase = async (): Promise<void> => {
  const manager = DatabaseManager.getInstance();
  await manager.close();
};

export const resetDatabase = async (): Promise<void> => {
  const manager = DatabaseManager.getInstance();
  await manager.reset();
};
