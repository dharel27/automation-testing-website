import { Database } from './connection';

export interface Migration {
  id: string;
  description: string;
  up: (db: Database) => Promise<void>;
  down: (db: Database) => Promise<void>;
}

export const migrations: Migration[] = [
  {
    id: '001_initial_schema',
    description: 'Create initial database schema',
    up: async (db: Database) => {
      // Create users table
      await db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user', 'guest')),
          first_name TEXT,
          last_name TEXT,
          avatar TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create products table
      await db.run(`
        CREATE TABLE IF NOT EXISTS products (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          price REAL NOT NULL,
          category TEXT NOT NULL,
          in_stock BOOLEAN DEFAULT 1,
          image_url TEXT,
          tags TEXT, -- JSON array stored as string
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create sessions table
      await db.run(`
        CREATE TABLE IF NOT EXISTS sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          token TEXT UNIQUE NOT NULL,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )
      `);

      // Create file_records table
      await db.run(`
        CREATE TABLE IF NOT EXISTS file_records (
          id TEXT PRIMARY KEY,
          original_name TEXT NOT NULL,
          filename TEXT NOT NULL,
          mimetype TEXT NOT NULL,
          size INTEGER NOT NULL,
          uploaded_by TEXT NOT NULL,
          uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (uploaded_by) REFERENCES users (id) ON DELETE CASCADE
        )
      `);

      // Create migrations table to track applied migrations
      await db.run(`
        CREATE TABLE IF NOT EXISTS migrations (
          id TEXT PRIMARY KEY,
          description TEXT NOT NULL,
          applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes for better performance
      await db.run(
        'CREATE INDEX IF NOT EXISTS idx_users_email ON users (email)'
      );
      await db.run(
        'CREATE INDEX IF NOT EXISTS idx_users_username ON users (username)'
      );
      await db.run(
        'CREATE INDEX IF NOT EXISTS idx_products_category ON products (category)'
      );
      await db.run(
        'CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions (token)'
      );
      await db.run(
        'CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id)'
      );
      await db.run(
        'CREATE INDEX IF NOT EXISTS idx_file_records_uploaded_by ON file_records (uploaded_by)'
      );
    },
    down: async (db: Database) => {
      await db.run('DROP TABLE IF EXISTS file_records');
      await db.run('DROP TABLE IF EXISTS sessions');
      await db.run('DROP TABLE IF EXISTS products');
      await db.run('DROP TABLE IF EXISTS users');
      await db.run('DROP TABLE IF EXISTS migrations');
    },
  },
];

export class MigrationRunner {
  constructor(private db: Database) {}

  async runMigrations(): Promise<void> {
    // Get applied migrations
    const appliedMigrations = await this.getAppliedMigrations();

    for (const migration of migrations) {
      if (!appliedMigrations.includes(migration.id)) {
        console.log(
          `Running migration: ${migration.id} - ${migration.description}`
        );

        try {
          await migration.up(this.db);
          await this.recordMigration(migration);
          console.log(`Migration ${migration.id} completed successfully`);
        } catch (error) {
          console.error(`Migration ${migration.id} failed:`, error);
          throw error;
        }
      }
    }
  }

  async rollbackMigration(migrationId: string): Promise<void> {
    const migration = migrations.find((m) => m.id === migrationId);
    if (!migration) {
      throw new Error(`Migration ${migrationId} not found`);
    }

    const appliedMigrations = await this.getAppliedMigrations();
    if (!appliedMigrations.includes(migrationId)) {
      throw new Error(`Migration ${migrationId} has not been applied`);
    }

    console.log(`Rolling back migration: ${migrationId}`);
    await migration.down(this.db);
    await this.removeMigrationRecord(migrationId);
    console.log(`Migration ${migrationId} rolled back successfully`);
  }

  private async getAppliedMigrations(): Promise<string[]> {
    try {
      const rows = await this.db.all<{ id: string }>(
        'SELECT id FROM migrations ORDER BY applied_at'
      );
      return rows.map((row) => row.id);
    } catch (error) {
      // If migrations table doesn't exist, no migrations have been applied
      return [];
    }
  }

  private async recordMigration(migration: Migration): Promise<void> {
    await this.db.run(
      'INSERT INTO migrations (id, description) VALUES (?, ?)',
      [migration.id, migration.description]
    );
  }

  private async removeMigrationRecord(migrationId: string): Promise<void> {
    await this.db.run('DELETE FROM migrations WHERE id = ?', [migrationId]);
  }
}
