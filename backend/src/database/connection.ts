import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

export interface Database {
  run: (sql: string, params?: any[]) => Promise<sqlite3.RunResult>;
  get: <T = any>(sql: string, params?: any[]) => Promise<T | undefined>;
  all: <T = any>(sql: string, params?: any[]) => Promise<T[]>;
  close: () => Promise<void>;
}

class DatabaseConnection {
  private db: sqlite3.Database | null = null;
  private static instance: DatabaseConnection;

  private constructor() {}

  public static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  public async connect(dbPath?: string): Promise<Database> {
    if (this.db) {
      return this.createDatabaseInterface();
    }

    const databasePath = dbPath || path.join(process.cwd(), 'database.sqlite');

    // Ensure database directory exists
    const dbDir = path.dirname(databasePath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(databasePath, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`Connected to SQLite database at ${databasePath}`);
          resolve(this.createDatabaseInterface());
        }
      });
    });
  }

  private createDatabaseInterface(): Database {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    const db = this.db;

    return {
      run: async (sql: string, params?: any[]): Promise<sqlite3.RunResult> => {
        return new Promise((resolve, reject) => {
          db.run(
            sql,
            params || [],
            function (this: sqlite3.RunResult, err: Error | null) {
              if (err) {
                reject(err);
              } else {
                resolve(this);
              }
            }
          );
        });
      },
      get: promisify(db.get.bind(db)),
      all: promisify(db.all.bind(db)),
      close: async () => {
        // This is a no-op for the interface - actual closing is handled by the connection manager
        return Promise.resolve();
      },
    };
  }

  public async close(): Promise<void> {
    if (this.db) {
      const closePromise = promisify(this.db.close.bind(this.db));
      await closePromise();
      this.db = null;
    }
  }
}

export const getDatabase = async (dbPath?: string): Promise<Database> => {
  const connection = DatabaseConnection.getInstance();
  return await connection.connect(dbPath);
};

export const closeDatabase = async (): Promise<void> => {
  const connection = DatabaseConnection.getInstance();
  await connection.close();
};

export const resetDatabaseConnection = (): void => {
  (DatabaseConnection as any).instance = null;
};
