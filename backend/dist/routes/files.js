var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { getDatabase } from '../database/connection';
import { FileRecord, } from '../models/FileRecord';
import { authenticateToken, requireAuth, } from '../middleware/auth';
import { uploadRateLimit } from '../middleware/security';
const router = Router();
// Helper function to create success response
function createSuccessResponse(data) {
    return {
        success: true,
        data,
        timestamp: new Date().toISOString(),
    };
}
// Helper function to create error response
function createErrorResponse(code, message, details) {
    return {
        success: false,
        error: { code, message, details },
        timestamp: new Date().toISOString(),
    };
}
// Helper function to create paginated response
function createPaginatedResponse(data, page, limit, total) {
    return {
        success: true,
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        },
        timestamp: new Date().toISOString(),
    };
}
// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
// Ensure upload directory exists
function ensureUploadDir() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield fs.access(uploadDir);
        }
        catch (_a) {
            yield fs.mkdir(uploadDir, { recursive: true });
        }
    });
}
// Initialize upload directory
ensureUploadDir().catch(console.error);
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with timestamp and random string
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        const name = path.basename(file.originalname, ext);
        cb(null, `${name}-${uniqueSuffix}${ext}`);
    },
});
const upload = multer({
    storage,
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB limit
        files: 10, // Maximum 10 files per request
    },
    fileFilter: (req, file, cb) => {
        // Allow most common file types for testing purposes
        const allowedMimes = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'text/plain',
            'text/csv',
            'application/json',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/zip',
            'application/x-zip-compressed',
        ];
        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        }
        else {
            cb(new Error(`File type ${file.mimetype} is not allowed`));
        }
    },
});
// POST /api/files/upload - Upload files
router.post('/upload', uploadRateLimit, authenticateToken, requireAuth, upload.array('files', 10), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            res
                .status(400)
                .json(createErrorResponse('NO_FILES', 'No files provided for upload'));
            return;
        }
        const db = yield getDatabase();
        const fileRecordModel = new FileRecord(db);
        const uploadedFiles = [];
        for (const file of files) {
            const fileRecordData = {
                originalName: file.originalname,
                filename: file.filename,
                mimetype: file.mimetype,
                size: file.size,
                uploadedBy: req.user.id,
            };
            const fileRecord = yield fileRecordModel.create(fileRecordData);
            uploadedFiles.push(fileRecord);
        }
        res.status(201).json(createSuccessResponse({
            message: `${uploadedFiles.length} file(s) uploaded successfully`,
            files: uploadedFiles,
        }));
    }
    catch (error) {
        console.error('Error uploading files:', error);
        // Clean up uploaded files if database operation failed
        if (req.files) {
            const files = req.files;
            for (const file of files) {
                try {
                    yield fs.unlink(file.path);
                }
                catch (unlinkError) {
                    console.error('Error cleaning up file:', unlinkError);
                }
            }
        }
        if (error instanceof multer.MulterError) {
            if (error.code === 'LIMIT_FILE_SIZE') {
                res
                    .status(400)
                    .json(createErrorResponse('FILE_TOO_LARGE', 'File size exceeds 50MB limit'));
                return;
            }
            if (error.code === 'LIMIT_FILE_COUNT') {
                res
                    .status(400)
                    .json(createErrorResponse('TOO_MANY_FILES', 'Maximum 10 files allowed per request'));
                return;
            }
        }
        res
            .status(500)
            .json(createErrorResponse('UPLOAD_ERROR', 'Failed to upload files'));
    }
}));
// GET /api/files - Get all files (with pagination and search)
router.get('/', authenticateToken, requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield getDatabase();
        const fileRecordModel = new FileRecord(db);
        // Parse pagination parameters
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
        const offset = (page - 1) * limit;
        // Parse search parameters
        const searchOptions = {
            limit,
            offset,
        };
        // Only admin can see all files, users can only see their own
        if (req.user.role !== 'admin') {
            searchOptions.uploadedBy = req.user.id;
        }
        else if (req.query.uploadedBy) {
            searchOptions.uploadedBy = req.query.uploadedBy;
        }
        if (req.query.mimetype) {
            searchOptions.mimetype = req.query.mimetype;
        }
        if (req.query.minSize) {
            const minSize = parseInt(req.query.minSize);
            if (!isNaN(minSize)) {
                searchOptions.minSize = minSize;
            }
        }
        if (req.query.maxSize) {
            const maxSize = parseInt(req.query.maxSize);
            if (!isNaN(maxSize)) {
                searchOptions.maxSize = maxSize;
            }
        }
        // Get files and total count
        const files = yield fileRecordModel.search(searchOptions);
        const total = yield fileRecordModel.count({
            uploadedBy: searchOptions.uploadedBy,
            mimetype: searchOptions.mimetype,
            minSize: searchOptions.minSize,
            maxSize: searchOptions.maxSize,
        });
        res.json(createPaginatedResponse(files, page, limit, total));
    }
    catch (error) {
        console.error('Error fetching files:', error);
        res
            .status(500)
            .json(createErrorResponse('FETCH_FILES_ERROR', 'Failed to fetch files'));
    }
}));
// GET /api/files/stats - Get file statistics
router.get('/stats', authenticateToken, requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const db = yield getDatabase();
        const fileRecordModel = new FileRecord(db);
        const stats = yield fileRecordModel.getFileStats();
        res.json(createSuccessResponse(stats));
    }
    catch (error) {
        console.error('Error fetching file stats:', error);
        res
            .status(500)
            .json(createErrorResponse('FETCH_STATS_ERROR', 'Failed to fetch file statistics'));
    }
}));
// GET /api/files/:id - Get file metadata by ID
router.get('/:id', authenticateToken, requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const db = yield getDatabase();
        const fileRecordModel = new FileRecord(db);
        const fileRecord = yield fileRecordModel.findById(id);
        if (!fileRecord) {
            res
                .status(404)
                .json(createErrorResponse('FILE_NOT_FOUND', 'File not found'));
            return;
        }
        // Check if user has access to this file
        if (req.user.role !== 'admin' &&
            fileRecord.uploadedBy !== req.user.id) {
            res
                .status(403)
                .json(createErrorResponse('ACCESS_DENIED', 'You can only access your own files'));
            return;
        }
        res.json(createSuccessResponse(fileRecord));
    }
    catch (error) {
        console.error('Error fetching file:', error);
        res
            .status(500)
            .json(createErrorResponse('FETCH_FILE_ERROR', 'Failed to fetch file'));
    }
}));
// GET /api/files/:id/download - Download file
router.get('/:id/download', authenticateToken, requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const db = yield getDatabase();
        const fileRecordModel = new FileRecord(db);
        const fileRecord = yield fileRecordModel.findById(id);
        if (!fileRecord) {
            res
                .status(404)
                .json(createErrorResponse('FILE_NOT_FOUND', 'File not found'));
            return;
        }
        // Check if user has access to this file
        if (req.user.role !== 'admin' &&
            fileRecord.uploadedBy !== req.user.id) {
            res
                .status(403)
                .json(createErrorResponse('ACCESS_DENIED', 'You can only download your own files'));
            return;
        }
        const filePath = path.join(uploadDir, fileRecord.filename);
        try {
            yield fs.access(filePath);
        }
        catch (_a) {
            res
                .status(404)
                .json(createErrorResponse('FILE_NOT_FOUND', 'Physical file not found on disk'));
            return;
        }
        // Set appropriate headers for file download
        res.setHeader('Content-Disposition', `attachment; filename="${fileRecord.originalName}"`);
        res.setHeader('Content-Type', fileRecord.mimetype);
        res.setHeader('Content-Length', fileRecord.size.toString());
        // Stream the file
        res.sendFile(filePath);
    }
    catch (error) {
        console.error('Error downloading file:', error);
        res
            .status(500)
            .json(createErrorResponse('DOWNLOAD_ERROR', 'Failed to download file'));
    }
}));
// DELETE /api/files/:id - Delete file
router.delete('/:id', authenticateToken, requireAuth, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const db = yield getDatabase();
        const fileRecordModel = new FileRecord(db);
        const fileRecord = yield fileRecordModel.findById(id);
        if (!fileRecord) {
            res
                .status(404)
                .json(createErrorResponse('FILE_NOT_FOUND', 'File not found'));
            return;
        }
        // Check if user has access to this file
        if (req.user.role !== 'admin' &&
            fileRecord.uploadedBy !== req.user.id) {
            res
                .status(403)
                .json(createErrorResponse('ACCESS_DENIED', 'You can only delete your own files'));
            return;
        }
        // Delete file record from database
        const deleted = yield fileRecordModel.delete(id);
        if (!deleted) {
            res
                .status(404)
                .json(createErrorResponse('FILE_NOT_FOUND', 'File not found'));
            return;
        }
        // Delete physical file
        const filePath = path.join(uploadDir, fileRecord.filename);
        try {
            yield fs.unlink(filePath);
        }
        catch (error) {
            console.warn('Failed to delete physical file:', error);
            // Continue even if physical file deletion fails
        }
        res.json(createSuccessResponse({ message: 'File deleted successfully' }));
    }
    catch (error) {
        console.error('Error deleting file:', error);
        res
            .status(500)
            .json(createErrorResponse('DELETE_FILE_ERROR', 'Failed to delete file'));
    }
}));
export default router;
