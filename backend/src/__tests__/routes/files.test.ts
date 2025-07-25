import request from 'supertest';
import app from '../../index';
import { getDatabase } from '../../database/connection';
import { User } from '../../models/User';
import { FileRecord } from '../../models/FileRecord';
import { generateToken } from '../../middleware/auth';
import path from 'path';
import fs from 'fs/promises';

describe('Files API', () => {
  let db: any;
  let userModel: User;
  let fileRecordModel: FileRecord;
  let adminToken: string;
  let userToken: string;
  let user2Token: string;
  let adminUser: any;
  let regularUser: any;
  let user2: any;
  let testFilePath: string;
  let uploadedFileId: string;

  beforeAll(async () => {
    db = await getDatabase();
    userModel = new User(db);
    fileRecordModel = new FileRecord(db);

    // Create admin user for testing
    adminUser = await userModel.create({
      username: 'admin_files',
      email: 'admin_files@test.com',
      password: 'password123',
      role: 'admin',
    });

    // Create regular users for testing
    regularUser = await userModel.create({
      username: 'user_files',
      email: 'user_files@test.com',
      password: 'password123',
      role: 'user',
    });

    user2 = await userModel.create({
      username: 'user2_files',
      email: 'user2_files@test.com',
      password: 'password123',
      role: 'user',
    });

    adminToken = generateToken(adminUser);
    userToken = generateToken(regularUser);
    user2Token = generateToken(user2);

    // Create a test file
    testFilePath = path.join(__dirname, 'test-file.txt');
    await fs.writeFile(testFilePath, 'This is a test file for upload testing.');
  });

  afterAll(async () => {
    // Clean up test data
    try {
      await fs.unlink(testFilePath);
    } catch (error) {
      // File might not exist, ignore error
    }

    // Clean up uploaded files
    if (uploadedFileId) {
      try {
        await fileRecordModel.delete(uploadedFileId);
      } catch (error) {
        // File might not exist, ignore error
      }
    }

    await userModel.delete(adminUser.id);
    await userModel.delete(regularUser.id);
    await userModel.delete(user2.id);
  });

  describe('POST /api/files/upload', () => {
    it('should upload file when authenticated', async () => {
      const response = await request(app)
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('files', testFilePath)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain(
        '1 file(s) uploaded successfully'
      );
      expect(response.body.data.files).toHaveLength(1);
      expect(response.body.data.files[0].originalName).toBe('test-file.txt');
      expect(response.body.data.files[0].uploadedBy).toBe(regularUser.id);

      uploadedFileId = response.body.data.files[0].id;
    });

    it('should upload multiple files', async () => {
      // Create another test file
      const testFile2Path = path.join(__dirname, 'test-file-2.txt');
      await fs.writeFile(testFile2Path, 'This is another test file.');

      const response = await request(app)
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('files', testFilePath)
        .attach('files', testFile2Path)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain(
        '2 file(s) uploaded successfully'
      );
      expect(response.body.data.files).toHaveLength(2);

      // Clean up
      await fs.unlink(testFile2Path);
      for (const file of response.body.data.files) {
        await fileRecordModel.delete(file.id);
      }
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/files/upload')
        .attach('files', testFilePath)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });

    it('should require files to be provided', async () => {
      const response = await request(app)
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_FILES');
    });

    it('should reject unsupported file types', async () => {
      // Create a file with unsupported extension
      const unsupportedFilePath = path.join(__dirname, 'test.exe');
      await fs.writeFile(unsupportedFilePath, 'fake executable');

      const response = await request(app)
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('files', unsupportedFilePath)
        .expect(500);

      // Clean up
      await fs.unlink(unsupportedFilePath);
    });
  });

  describe('GET /api/files', () => {
    it('should get user files when authenticated as user', async () => {
      const response = await request(app)
        .get('/api/files')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);

      // All files should belong to the authenticated user
      response.body.data.forEach((file: any) => {
        expect(file.uploadedBy).toBe(regularUser.id);
      });
    });

    it('should get all files when authenticated as admin', async () => {
      const response = await request(app)
        .get('/api/files')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/files?page=1&limit=1')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(1);
    });

    it('should support filtering by mimetype', async () => {
      const response = await request(app)
        .get('/api/files?mimetype=text')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((file: any) => {
        expect(file.mimetype).toContain('text');
      });
    });

    it('should support filtering by file size', async () => {
      const response = await request(app)
        .get('/api/files?minSize=1&maxSize=1000')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach((file: any) => {
        expect(file.size).toBeGreaterThanOrEqual(1);
        expect(file.size).toBeLessThanOrEqual(1000);
      });
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/api/files').expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });

  describe('GET /api/files/stats', () => {
    it('should get file statistics', async () => {
      const response = await request(app)
        .get('/api/files/stats')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalFiles');
      expect(response.body.data).toHaveProperty('totalSize');
      expect(response.body.data).toHaveProperty('averageSize');
      expect(response.body.data).toHaveProperty('mimetypes');
      expect(typeof response.body.data.totalFiles).toBe('number');
      expect(typeof response.body.data.totalSize).toBe('number');
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/api/files/stats').expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });

  describe('GET /api/files/:id', () => {
    it('should get file metadata when user owns the file', async () => {
      const response = await request(app)
        .get(`/api/files/${uploadedFileId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(uploadedFileId);
      expect(response.body.data.originalName).toBe('test-file.txt');
      expect(response.body.data.uploadedBy).toBe(regularUser.id);
    });

    it('should get file metadata when authenticated as admin', async () => {
      const response = await request(app)
        .get(`/api/files/${uploadedFileId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(uploadedFileId);
    });

    it('should deny access to other users files', async () => {
      const response = await request(app)
        .get(`/api/files/${uploadedFileId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ACCESS_DENIED');
    });

    it('should return 404 for non-existent file', async () => {
      const response = await request(app)
        .get('/api/files/non-existent-id')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FILE_NOT_FOUND');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/files/${uploadedFileId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });

  describe('GET /api/files/:id/download', () => {
    it('should download file when user owns the file', async () => {
      const response = await request(app)
        .get(`/api/files/${uploadedFileId}/download`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain(
        'test-file.txt'
      );
      expect(response.headers['content-type']).toBe(
        'text/plain; charset=utf-8'
      );
      expect(response.text).toBe('This is a test file for upload testing.');
    });

    it('should download file when authenticated as admin', async () => {
      const response = await request(app)
        .get(`/api/files/${uploadedFileId}/download`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.headers['content-disposition']).toContain('attachment');
    });

    it('should deny download to other users', async () => {
      const response = await request(app)
        .get(`/api/files/${uploadedFileId}/download`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ACCESS_DENIED');
    });

    it('should return 404 for non-existent file', async () => {
      const response = await request(app)
        .get('/api/files/non-existent-id/download')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FILE_NOT_FOUND');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/files/${uploadedFileId}/download`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });

  describe('DELETE /api/files/:id', () => {
    it('should delete file when user owns the file', async () => {
      // Upload a file to delete
      const uploadResponse = await request(app)
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('files', testFilePath);

      const fileToDeleteId = uploadResponse.body.data.files[0].id;

      const response = await request(app)
        .delete(`/api/files/${fileToDeleteId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('File deleted successfully');

      // Verify file is deleted
      const deletedFile = await fileRecordModel.findById(fileToDeleteId);
      expect(deletedFile).toBeNull();
    });

    it('should delete file when authenticated as admin', async () => {
      // Upload a file to delete
      const uploadResponse = await request(app)
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${userToken}`)
        .attach('files', testFilePath);

      const fileToDeleteId = uploadResponse.body.data.files[0].id;

      const response = await request(app)
        .delete(`/api/files/${fileToDeleteId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toBe('File deleted successfully');
    });

    it('should deny deletion to other users', async () => {
      const response = await request(app)
        .delete(`/api/files/${uploadedFileId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('ACCESS_DENIED');
    });

    it('should return 404 for non-existent file', async () => {
      const response = await request(app)
        .delete('/api/files/non-existent-id')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('FILE_NOT_FOUND');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/files/${uploadedFileId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('MISSING_TOKEN');
    });
  });
});
