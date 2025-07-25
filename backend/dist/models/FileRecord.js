var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { v4 as uuidv4 } from 'uuid';
export class FileRecord {
    constructor(db) {
        this.db = db;
    }
    create(fileData) {
        return __awaiter(this, void 0, void 0, function* () {
            const id = uuidv4();
            const now = new Date().toISOString();
            yield this.db.run(`
      INSERT INTO file_records (
        id, original_name, filename, mimetype, size, uploaded_by, uploaded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
                id,
                fileData.originalName,
                fileData.filename,
                fileData.mimetype,
                fileData.size,
                fileData.uploadedBy,
                now,
            ]);
            const fileRecord = yield this.findById(id);
            if (!fileRecord) {
                throw new Error('Failed to create file record');
            }
            return fileRecord;
        });
    }
    findById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const row = yield this.db.get('SELECT * FROM file_records WHERE id = ?', [id]);
            return row ? this.mapRowToFileRecord(row) : null;
        });
    }
    findByFilename(filename) {
        return __awaiter(this, void 0, void 0, function* () {
            const row = yield this.db.get('SELECT * FROM file_records WHERE filename = ?', [filename]);
            return row ? this.mapRowToFileRecord(row) : null;
        });
    }
    findAll(limit, offset) {
        return __awaiter(this, void 0, void 0, function* () {
            let query = 'SELECT * FROM file_records ORDER BY uploaded_at DESC';
            const params = [];
            if (limit) {
                query += ' LIMIT ?';
                params.push(limit);
                if (offset) {
                    query += ' OFFSET ?';
                    params.push(offset);
                }
            }
            const rows = yield this.db.all(query, params);
            return rows.map((row) => this.mapRowToFileRecord(row));
        });
    }
    findByUploadedBy(uploadedBy, limit, offset) {
        return __awaiter(this, void 0, void 0, function* () {
            let query = 'SELECT * FROM file_records WHERE uploaded_by = ? ORDER BY uploaded_at DESC';
            const params = [uploadedBy];
            if (limit) {
                query += ' LIMIT ?';
                params.push(limit);
                if (offset) {
                    query += ' OFFSET ?';
                    params.push(offset);
                }
            }
            const rows = yield this.db.all(query, params);
            return rows.map((row) => this.mapRowToFileRecord(row));
        });
    }
    search(options) {
        return __awaiter(this, void 0, void 0, function* () {
            let query = 'SELECT * FROM file_records WHERE 1=1';
            const params = [];
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
            const rows = yield this.db.all(query, params);
            return rows.map((row) => this.mapRowToFileRecord(row));
        });
    }
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.db.run('DELETE FROM file_records WHERE id = ?', [
                id,
            ]);
            return (result.changes || 0) > 0;
        });
    }
    deleteByFilename(filename) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.db.run('DELETE FROM file_records WHERE filename = ?', [filename]);
            return (result.changes || 0) > 0;
        });
    }
    deleteByUploadedBy(uploadedBy) {
        return __awaiter(this, void 0, void 0, function* () {
            const result = yield this.db.run('DELETE FROM file_records WHERE uploaded_by = ?', [uploadedBy]);
            return result.changes || 0;
        });
    }
    count(options) {
        return __awaiter(this, void 0, void 0, function* () {
            let query = 'SELECT COUNT(*) as count FROM file_records WHERE 1=1';
            const params = [];
            if (options === null || options === void 0 ? void 0 : options.uploadedBy) {
                query += ' AND uploaded_by = ?';
                params.push(options.uploadedBy);
            }
            if (options === null || options === void 0 ? void 0 : options.mimetype) {
                query += ' AND mimetype LIKE ?';
                params.push(`%${options.mimetype}%`);
            }
            if ((options === null || options === void 0 ? void 0 : options.minSize) !== undefined) {
                query += ' AND size >= ?';
                params.push(options.minSize);
            }
            if ((options === null || options === void 0 ? void 0 : options.maxSize) !== undefined) {
                query += ' AND size <= ?';
                params.push(options.maxSize);
            }
            const result = yield this.db.get(query, params);
            return (result === null || result === void 0 ? void 0 : result.count) || 0;
        });
    }
    getTotalSize(uploadedBy) {
        return __awaiter(this, void 0, void 0, function* () {
            let query = 'SELECT COALESCE(SUM(size), 0) as total_size FROM file_records';
            const params = [];
            if (uploadedBy) {
                query += ' WHERE uploaded_by = ?';
                params.push(uploadedBy);
            }
            const result = yield this.db.get(query, params);
            return (result === null || result === void 0 ? void 0 : result.total_size) || 0;
        });
    }
    getMimetypes() {
        return __awaiter(this, void 0, void 0, function* () {
            const rows = yield this.db.all('SELECT DISTINCT mimetype FROM file_records ORDER BY mimetype');
            return rows.map((row) => row.mimetype);
        });
    }
    getFileStats() {
        return __awaiter(this, void 0, void 0, function* () {
            const totalFiles = yield this.count();
            const totalSize = yield this.getTotalSize();
            const averageSize = totalFiles > 0 ? totalSize / totalFiles : 0;
            const mimetypeRows = yield this.db.all('SELECT mimetype, COUNT(*) as count FROM file_records GROUP BY mimetype ORDER BY count DESC');
            const mimetypes = {};
            mimetypeRows.forEach((row) => {
                mimetypes[row.mimetype] = row.count;
            });
            return {
                totalFiles,
                totalSize,
                averageSize,
                mimetypes,
            };
        });
    }
    mapRowToFileRecord(row) {
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
