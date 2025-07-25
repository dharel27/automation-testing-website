import { Database } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

export interface UserProfile {
  firstName?: string;
  lastName?: string;
  avatar?: string;
}

export interface UserData {
  id: string;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'user' | 'guest';
  profile: UserProfile;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  username: string;
  email: string;
  password: string;
  role?: 'admin' | 'user' | 'guest';
  profile?: UserProfile;
}

export interface UpdateUserInput {
  username?: string;
  email?: string;
  password?: string;
  role?: 'admin' | 'user' | 'guest';
  profile?: UserProfile;
}

interface UserRow {
  id: string;
  username: string;
  email: string;
  password: string;
  role: string;
  first_name: string | null;
  last_name: string | null;
  avatar: string | null;
  created_at: string;
  updated_at: string;
}

export class User {
  constructor(private db: Database) {}

  async create(userData: CreateUserInput): Promise<UserData> {
    const id = uuidv4();
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const now = new Date().toISOString();

    await this.db.run(
      `
      INSERT INTO users (
        id, username, email, password, role, first_name, last_name, avatar, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        id,
        userData.username,
        userData.email,
        hashedPassword,
        userData.role || 'user',
        userData.profile?.firstName || null,
        userData.profile?.lastName || null,
        userData.profile?.avatar || null,
        now,
        now,
      ]
    );

    const user = await this.findById(id);
    if (!user) {
      throw new Error('Failed to create user');
    }

    return user;
  }

  async findById(id: string): Promise<UserData | null> {
    const row = await this.db.get<UserRow>('SELECT * FROM users WHERE id = ?', [
      id,
    ]);
    return row ? this.mapRowToUser(row) : null;
  }

  async findByEmail(email: string): Promise<UserData | null> {
    const row = await this.db.get<UserRow>(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return row ? this.mapRowToUser(row) : null;
  }

  async findByUsername(username: string): Promise<UserData | null> {
    const row = await this.db.get<UserRow>(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    return row ? this.mapRowToUser(row) : null;
  }

  async findAll(limit?: number, offset?: number): Promise<UserData[]> {
    let query = 'SELECT * FROM users ORDER BY created_at DESC';
    const params: any[] = [];

    if (limit) {
      query += ' LIMIT ?';
      params.push(limit);

      if (offset) {
        query += ' OFFSET ?';
        params.push(offset);
      }
    }

    const rows = await this.db.all<UserRow>(query, params);
    return rows.map((row) => this.mapRowToUser(row));
  }

  async update(
    id: string,
    updateData: UpdateUserInput
  ): Promise<UserData | null> {
    const existingUser = await this.findById(id);
    if (!existingUser) {
      return null;
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (updateData.username !== undefined) {
      updates.push('username = ?');
      params.push(updateData.username);
    }

    if (updateData.email !== undefined) {
      updates.push('email = ?');
      params.push(updateData.email);
    }

    if (updateData.password !== undefined) {
      updates.push('password = ?');
      params.push(await bcrypt.hash(updateData.password, 10));
    }

    if (updateData.role !== undefined) {
      updates.push('role = ?');
      params.push(updateData.role);
    }

    if (updateData.profile?.firstName !== undefined) {
      updates.push('first_name = ?');
      params.push(updateData.profile.firstName);
    }

    if (updateData.profile?.lastName !== undefined) {
      updates.push('last_name = ?');
      params.push(updateData.profile.lastName);
    }

    if (updateData.profile?.avatar !== undefined) {
      updates.push('avatar = ?');
      params.push(updateData.profile.avatar);
    }

    if (updates.length === 0) {
      return existingUser;
    }

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    await this.db.run(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    return await this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.run('DELETE FROM users WHERE id = ?', [id]);
    return (result.changes || 0) > 0;
  }

  async verifyPassword(user: UserData, password: string): Promise<boolean> {
    return await bcrypt.compare(password, user.password);
  }

  async count(): Promise<number> {
    const result = await this.db.get<{ count: number }>(
      'SELECT COUNT(*) as count FROM users'
    );
    return result?.count || 0;
  }

  private mapRowToUser(row: UserRow): UserData {
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      password: row.password,
      role: row.role as 'admin' | 'user' | 'guest',
      profile: {
        firstName: row.first_name || undefined,
        lastName: row.last_name || undefined,
        avatar: row.avatar || undefined,
      },
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }
}
