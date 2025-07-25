import { Database } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';

export interface FileRecordData {
  id: string;
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  uploadedBy: string;
  uploadedAt: Date;
}

export interface CreateFileRecordInput {
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  uploadedBy: string;
}

export interface FileSearchOptions {
  uploadedBy?: string;
  mimetype?: string;
  minSize?: number;
  maxSize?: number;
  limit?: number;
  offset?: number;
}

interface FileRecordRow {
  id: string;
  original_name: string;
  filename: string;
  mimetype: string;
  size: number;
  uploaded_by: string;
  uploaded_at: string;
}

export class FileRecord {
  constructor(private db: Database) {}

  async create(fileData: CreateFileRecordInput): Promise<FileRecordData> {
    const id = uuidv4();
    const now = new Date().toISOString();

    await this.db.run(
      `
      INSERT INTO file_records (
        id, original_name, filename, mimetype, size, uploaded_by, uploaded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
      [
        id,
        fileData.originalName,
        fileData.filename,
        fileData.mimetype,
        fileData.size,
        fileData.uploadedBy,
        now,
      ]
    );

    const fileRecord = await this.findById(id);
    if (!fileRecord) {
      throw new Error('Failed to create file record');
    }

    return fileRecord;
  }

  async findById(id: string): Promise<FileRecordData | null> {
    const row = await this.db.get<FileRecordRow>(
      'SELECT * FROM file_records WHERE id = ?',
      [id]
    );
    return row ? this.mapRowToFileRecord(row) : null;
  }

  async findByFilename(filename: string): Promise<FileRecordData | null> {
    const row = await this.db.get<FileRecordRow>(
      'SELECT * FROM file_records WHERE filename = ?',
      [filename]
    );
    return row ? this.mapRowToFileRecord(row) : null;
  }

  async findAll(limit?: number, offset?: number): Promise<FileRecordData[]> {
    let query = 'SELECT * FROM file_records ORDER BY uploaded_at DESC';
    const params: any[] = [];

    if (limit) {
      query += ' LIMIT ?';
      params.push(limit);

      if (offset) {
        query += ' OFFSET ?';
        params.push(offset);
      }
    }

    const rows = await this.db.all<FileRecordRow>(query, params);
    return rows.map((row) => this.mapRowToFileRecord(row));
  }

  async findByUploadedBy(
    uploadedBy: string,
    limit?: number,
    offset?: number
  ): Promise<FileRecordData[]> {
    let query =
      'SELECT * FROM file_records WHERE uploaded_by = ? ORDER BY uploaded_at DESC';
    const params: any[] = [uploadedBy];

    if (limit) {
      query += ' LIMIT ?';
      params.push(limit);

      if (offset) {
        query += ' OFFSET ?';
        params.push(offset);
      }
    }

    const rows = await this.db.all<FileRecordRow>(query, params);
    return rows.map((row) => this.mapRowToFileRecord(row));
  }

  async search(options: FileSearchOptions): Promise<FileRecordData[]> {
    let query = 'SELECT * FROM file_records WHERE 1=1';
    const params: any[] = [];

    if (options.uploadedBy) {
      query += ' AND uploaded_by = ?';
      params.push(options.uploadedBy);
    }

    if (options.mimetype) {
      query += ' AND mimetype LIKE ?';
      params.push(`%${options.mimetype}%`);
    }

    if (options.minSize !== undefined) {
      query += ' AND size >= ?';
      params.push(options.minSize);
    }

    if (options.maxSize !== undefined) {
      query += ' AND size <= ?';
      params.push(options.maxSize);
    }

    query += ' ORDER BY uploaded_at DESC';

    if (options.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);

      if (options.offset) {
        query += ' OFFSET ?';
        params.push(options.offset);
      }
    }

    const rows = await this.db.all<FileRecordRow>(query, params);
    return rows.map((row) => this.mapRowToFileRecord(row));
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.run('DELETE FROM file_records WHERE id = ?', [
      id,
    ]);
    return (result.changes || 0) > 0;
  }

  async deleteByFilename(filename: string): Promise<boolean> {
    const result = await this.db.run(
      'DELETE FROM file_records WHERE filename = ?',
      [filename]
    );
    return (result.changes || 0) > 0;
  }

  async deleteByUploadedBy(uploadedBy: string): Promise<number> {
    const result = await this.db.run(
      'DELETE FROM file_records WHERE uploaded_by = ?',
      [uploadedBy]
    );
    return result.changes || 0;
  }

  async count(
    options?: Omit<FileSearchOptions, 'limit' | 'offset'>
  ): Promise<number> {
    let query = 'SELECT COUNT(*) as count FROM file_records WHERE 1=1';
    const params: any[] = [];

    if (options?.uploadedBy) {
      query += ' AND uploaded_by = ?';
      params.push(options.uploadedBy);
    }

    if (options?.mimetype) {
      query += ' AND mimetype LIKE ?';
      params.push(`%${options.mimetype}%`);
    }

    if (options?.minSize !== undefined) {
      query += ' AND size >= ?';
      params.push(options.minSize);
    }

    if (options?.maxSize !== undefined) {
      query += ' AND size <= ?';
      params.push(options.maxSize);
    }

    const result = await this.db.get<{ count: number }>(query, params);
    return result?.count || 0;
  }

  async getTotalSize(uploadedBy?: string): Promise<number> {
    let query = 'SELECT COALESCE(SUM(size), 0) as total_size FROM file_records';
    const params: any[] = [];

    if (uploadedBy) {
      query += ' WHERE uploaded_by = ?';
      params.push(uploadedBy);
    }

    const result = await this.db.get<{ total_size: number }>(query, params);
    return result?.total_size || 0;
  }

  async getMimetypes(): Promise<string[]> {
    const rows = await this.db.all<{ mimetype: string }>(
      'SELECT DISTINCT mimetype FROM file_records ORDER BY mimetype'
    );
    return rows.map((row) => row.mimetype);
  }

  async getFileStats(): Promise<{
    totalFiles: number;
    totalSize: number;
    averageSize: number;
    mimetypes: { [key: string]: number };
  }> {
    const totalFiles = await this.count();
    const totalSize = await this.getTotalSize();
    const averageSize = totalFiles > 0 ? totalSize / totalFiles : 0;

    const mimetypeRows = await this.db.all<{ mimetype: string; count: number }>(
      'SELECT mimetype, COUNT(*) as count FROM file_records GROUP BY mimetype ORDER BY count DESC'
    );

    const mimetypes: { [key: string]: number } = {};
    mimetypeRows.forEach((row) => {
      mimetypes[row.mimetype] = row.count;
    });

    return {
      totalFiles,
      totalSize,
      averageSize,
      mimetypes,
    };
  }

  private mapRowToFileRecord(row: FileRecordRow): FileRecordData {
    return {
      id: row.id,
      originalName: row.original_name,
      filename: row.filename,
      mimetype: row.mimetype,
      size: row.size,
      uploadedBy: row.uploaded_by,
      uploadedAt: new Date(row.uploaded_at),
    };
  }
}
