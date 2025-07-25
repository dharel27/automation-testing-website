import { Database } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';

export interface SessionData {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface CreateSessionInput {
  userId: string;
  token: string;
  expiresAt: Date;
}

interface SessionRow {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  created_at: string;
}

export class Session {
  constructor(private db: Database) {}

  async create(sessionData: CreateSessionInput): Promise<SessionData> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await this.db.run(
      `
      INSERT INTO sessions (id, user_id, token, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `,
      [
        id,
        sessionData.userId,
        sessionData.token,
        sessionData.expiresAt.toISOString(),
        now,
      ]
    );

    const session = await this.findById(id);
    if (!session) {
      throw new Error('Failed to create session');
    }

    return session;
  }

  async findById(id: string): Promise<SessionData | null> {
    const row = await this.db.get<SessionRow>(
      'SELECT * FROM sessions WHERE id = ?',
      [id]
    );
    return row ? this.mapRowToSession(row) : null;
  }

  async findByToken(token: string): Promise<SessionData | null> {
    const row = await this.db.get<SessionRow>(
      'SELECT * FROM sessions WHERE token = ?',
      [token]
    );
    return row ? this.mapRowToSession(row) : null;
  }

  async findByUserId(userId: string): Promise<SessionData[]> {
    const rows = await this.db.all<SessionRow>(
      'SELECT * FROM sessions WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return rows.map((row) => this.mapRowToSession(row));
  }

  async findValidByToken(token: string): Promise<SessionData | null> {
    const row = await this.db.get<SessionRow>(
      'SELECT * FROM sessions WHERE token = ? AND expires_at > datetime("now")',
      [token]
    );
    return row ? this.mapRowToSession(row) : null;
  }

  async findValidByUserId(userId: string): Promise<SessionData[]> {
    const rows = await this.db.all<SessionRow>(
      'SELECT * FROM sessions WHERE user_id = ? AND expires_at > datetime("now") ORDER BY created_at DESC',
      [userId]
    );
    return rows.map((row) => this.mapRowToSession(row));
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.run('DELETE FROM sessions WHERE id = ?', [id]);
    return (result.changes || 0) > 0;
  }

  async deleteByToken(token: string): Promise<boolean> {
    const result = await this.db.run('DELETE FROM sessions WHERE token = ?', [
      token,
    ]);
    return (result.changes || 0) > 0;
  }

  async deleteByUserId(userId: string): Promise<number> {
    const result = await this.db.run('DELETE FROM sessions WHERE user_id = ?', [
      userId,
    ]);
    return result.changes || 0;
  }

  async deleteExpired(): Promise<number> {
    const result = await this.db.run(
      'DELETE FROM sessions WHERE expires_at <= datetime("now")'
    );
    return result.changes || 0;
  }

  async extendSession(
    token: string,
    newExpiresAt: Date
  ): Promise<SessionData | null> {
    const result = await this.db.run(
      'UPDATE sessions SET expires_at = ? WHERE token = ?',
      [newExpiresAt.toISOString(), token]
    );

    if ((result.changes || 0) === 0) {
      return null;
    }

    return await this.findByToken(token);
  }

  async count(): Promise<number> {
    const result = await this.db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM sessions'
    );
    return result?.count || 0;
  }

  async countValid(): Promise<number> {
    const result = await this.db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM sessions WHERE expires_at > datetime("now")'
    );
    return result?.count || 0;
  }

  async countByUserId(userId: string): Promise<number> {
    const result = await this.db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM sessions WHERE user_id = ?',
      [userId]
    );
    return result?.count || 0;
  }

  async isTokenValid(token: string): Promise<boolean> {
    const session = await this.findValidByToken(token);
    return session !== null;
  }

  private mapRowToSession(row: SessionRow): SessionData {
    return {
      id: row.id,
      userId: row.user_id,
      token: row.token,
      expiresAt: new Date(row.expires_at),
      createdAt: new Date(row.created_at),
    };
  }
}
