import { getModels } from '../../database/init';
import {
  CreateFileRecordInput,
  FileSearchOptions,
} from '../../models/FileRecord';
import { CreateUserInput } from '../../models/User';

describe('FileRecord Model', () => {
  let fileRecordModel: ReturnType<typeof getModels>['fileRecord'];
  let userModel: ReturnType<typeof getModels>['user'];
  let testUserId: string;

  beforeEach(async () => {
    const models = getModels();
    fileRecordModel = models.fileRecord;
    userModel = models.user;

    // Create a test user for file record tests
    const userData: CreateUserInput = {
      username: 'fileuser',
      email: 'file@example.com',
      password: 'password123',
    };
    const user = await userModel.create(userData);
    testUserId = user.id;
  });

  describe('create', () => {
    it('should create a new file record', async () => {
      const fileData: CreateFileRecordInput = {
        originalName: 'test-document.pdf',
        filename: 'abc123-test-document.pdf',
        mimetype: 'application/pdf',
        size: 1024000,
        uploadedBy: testUserId,
      };

      const fileRecord = await fileRecordModel.create(fileData);

      expect(fileRecord.id).toBeDefined();
      expect(fileRecord.originalName).toBe(fileData.originalName);
      expect(fileRecord.filename).toBe(fileData.filename);
      expect(fileRecord.mimetype).toBe(fileData.mimetype);
      expect(fileRecord.size).toBe(fileData.size);
      expect(fileRecord.uploadedBy).toBe(fileData.uploadedBy);
      expect(fileRecord.uploadedAt).toBeInstanceOf(Date);
    });
  });

  describe('findById', () => {
    it('should find file record by id', async () => {
      const fileData: CreateFileRecordInput = {
        originalName: 'find-test.jpg',
        filename: 'find-test-123.jpg',
        mimetype: 'image/jpeg',
        size: 512000,
        uploadedBy: testUserId,
      };

      const createdFile = await fileRecordModel.create(fileData);
      const foundFile = await fileRecordModel.findById(createdFile.id);

      expect(foundFile).not.toBeNull();
      expect(foundFile!.id).toBe(createdFile.id);
      expect(foundFile!.originalName).toBe(fileData.originalName);
    });

    it('should return null for non-existent id', async () => {
      const foundFile = await fileRecordModel.findById('non-existent-id');
      expect(foundFile).toBeNull();
    });
  });

  describe('findByFilename', () => {
    it('should find file record by filename', async () => {
      const fileData: CreateFileRecordInput = {
        originalName: 'filename-test.txt',
        filename: 'unique-filename-123.txt',
        mimetype: 'text/plain',
        size: 1024,
        uploadedBy: testUserId,
      };

      await fileRecordModel.create(fileData);
      const foundFile = await fileRecordModel.findByFilename(fileData.filename);

      expect(foundFile).not.toBeNull();
      expect(foundFile!.filename).toBe(fileData.filename);
    });

    it('should return null for non-existent filename', async () => {
      const foundFile = await fileRecordModel.findByFilename(
        'non-existent-filename.txt'
      );
      expect(foundFile).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all file records', async () => {
      const files = [
        {
          originalName: 'file1.txt',
          filename: 'file1-123.txt',
          mimetype: 'text/plain',
          size: 1024,
          uploadedBy: testUserId,
        },
        {
          originalName: 'file2.jpg',
          filename: 'file2-456.jpg',
          mimetype: 'image/jpeg',
          size: 2048,
          uploadedBy: testUserId,
        },
        {
          originalName: 'file3.pdf',
          filename: 'file3-789.pdf',
          mimetype: 'application/pdf',
          size: 4096,
          uploadedBy: testUserId,
        },
      ];

      for (const fileData of files) {
        await fileRecordModel.create(fileData);
      }

      const allFiles = await fileRecordModel.findAll();
      expect(allFiles).toHaveLength(3);
    });

    it('should support pagination', async () => {
      const files = [
        {
          originalName: 'file1.txt',
          filename: 'file1-123.txt',
          mimetype: 'text/plain',
          size: 1024,
          uploadedBy: testUserId,
        },
        {
          originalName: 'file2.jpg',
          filename: 'file2-456.jpg',
          mimetype: 'image/jpeg',
          size: 2048,
          uploadedBy: testUserId,
        },
        {
          originalName: 'file3.pdf',
          filename: 'file3-789.pdf',
          mimetype: 'application/pdf',
          size: 4096,
          uploadedBy: testUserId,
        },
      ];

      for (const fileData of files) {
        await fileRecordModel.create(fileData);
      }

      const firstPage = await fileRecordModel.findAll(2, 0);
      const secondPage = await fileRecordModel.findAll(2, 2);

      expect(firstPage).toHaveLength(2);
      expect(secondPage).toHaveLength(1);
    });
  });

  describe('findByUploadedBy', () => {
    it('should find files uploaded by specific user', async () => {
      // Create another user
      const anotherUser = await userModel.create({
        username: 'anotheruser',
        email: 'another@example.com',
        password: 'password123',
      });

      const files = [
        {
          originalName: 'user1-file1.txt',
          filename: 'user1-file1.txt',
          mimetype: 'text/plain',
          size: 1024,
          uploadedBy: testUserId,
        },
        {
          originalName: 'user1-file2.txt',
          filename: 'user1-file2.txt',
          mimetype: 'text/plain',
          size: 2048,
          uploadedBy: testUserId,
        },
        {
          originalName: 'user2-file1.txt',
          filename: 'user2-file1.txt',
          mimetype: 'text/plain',
          size: 1024,
          uploadedBy: anotherUser.id,
        },
      ];

      for (const fileData of files) {
        await fileRecordModel.create(fileData);
      }

      const user1Files = await fileRecordModel.findByUploadedBy(testUserId);
      const user2Files = await fileRecordModel.findByUploadedBy(anotherUser.id);

      expect(user1Files).toHaveLength(2);
      expect(user2Files).toHaveLength(1);
      expect(user1Files.every((f) => f.uploadedBy === testUserId)).toBe(true);
      expect(user2Files.every((f) => f.uploadedBy === anotherUser.id)).toBe(
        true
      );
    });
  });

  describe('search', () => {
    beforeEach(async () => {
      const files = [
        {
          originalName: 'document.pdf',
          filename: 'doc1.pdf',
          mimetype: 'application/pdf',
          size: 1000000,
          uploadedBy: testUserId,
        },
        {
          originalName: 'image.jpg',
          filename: 'img1.jpg',
          mimetype: 'image/jpeg',
          size: 500000,
          uploadedBy: testUserId,
        },
        {
          originalName: 'text.txt',
          filename: 'txt1.txt',
          mimetype: 'text/plain',
          size: 1024,
          uploadedBy: testUserId,
        },
        {
          originalName: 'video.mp4',
          filename: 'vid1.mp4',
          mimetype: 'video/mp4',
          size: 10000000,
          uploadedBy: testUserId,
        },
      ];

      for (const fileData of files) {
        await fileRecordModel.create(fileData);
      }
    });

    it('should search by mimetype', async () => {
      const imageFiles = await fileRecordModel.search({ mimetype: 'image' });
      expect(imageFiles).toHaveLength(1);
      expect(imageFiles[0].mimetype).toBe('image/jpeg');
    });

    it('should search by size range', async () => {
      const mediumFiles = await fileRecordModel.search({
        minSize: 100000,
        maxSize: 1000000,
      });
      expect(mediumFiles).toHaveLength(2); // PDF and JPEG
      expect(
        mediumFiles.every((f) => f.size >= 100000 && f.size <= 1000000)
      ).toBe(true);
    });

    it('should search by uploaded user', async () => {
      const userFiles = await fileRecordModel.search({
        uploadedBy: testUserId,
      });
      expect(userFiles).toHaveLength(4);
      expect(userFiles.every((f) => f.uploadedBy === testUserId)).toBe(true);
    });

    it('should combine multiple search criteria', async () => {
      const results = await fileRecordModel.search({
        mimetype: 'application',
        minSize: 500000,
        uploadedBy: testUserId,
      });
      expect(results).toHaveLength(1);
      expect(results[0].mimetype).toBe('application/pdf');
    });

    it('should support pagination in search', async () => {
      const results = await fileRecordModel.search({ limit: 2, offset: 0 });
      expect(results).toHaveLength(2);

      const nextResults = await fileRecordModel.search({ limit: 2, offset: 2 });
      expect(nextResults).toHaveLength(2);
    });
  });

  describe('delete', () => {
    it('should delete file record', async () => {
      const fileData: CreateFileRecordInput = {
        originalName: 'delete-test.txt',
        filename: 'delete-test-123.txt',
        mimetype: 'text/plain',
        size: 1024,
        uploadedBy: testUserId,
      };

      const fileRecord = await fileRecordModel.create(fileData);
      const deleted = await fileRecordModel.delete(fileRecord.id);

      expect(deleted).toBe(true);

      const foundFile = await fileRecordModel.findById(fileRecord.id);
      expect(foundFile).toBeNull();
    });

    it('should return false for non-existent file', async () => {
      const deleted = await fileRecordModel.delete('non-existent-id');
      expect(deleted).toBe(false);
    });
  });

  describe('deleteByFilename', () => {
    it('should delete file record by filename', async () => {
      const fileData: CreateFileRecordInput = {
        originalName: 'delete-by-filename.txt',
        filename: 'delete-by-filename-123.txt',
        mimetype: 'text/plain',
        size: 1024,
        uploadedBy: testUserId,
      };

      await fileRecordModel.create(fileData);
      const deleted = await fileRecordModel.deleteByFilename(fileData.filename);

      expect(deleted).toBe(true);

      const foundFile = await fileRecordModel.findByFilename(fileData.filename);
      expect(foundFile).toBeNull();
    });
  });

  describe('deleteByUploadedBy', () => {
    it('should delete all files uploaded by user', async () => {
      const files = [
        {
          originalName: 'user-file1.txt',
          filename: 'user-file1.txt',
          mimetype: 'text/plain',
          size: 1024,
          uploadedBy: testUserId,
        },
        {
          originalName: 'user-file2.txt',
          filename: 'user-file2.txt',
          mimetype: 'text/plain',
          size: 2048,
          uploadedBy: testUserId,
        },
      ];

      for (const fileData of files) {
        await fileRecordModel.create(fileData);
      }

      const deletedCount = await fileRecordModel.deleteByUploadedBy(testUserId);
      expect(deletedCount).toBe(2);

      const userFiles = await fileRecordModel.findByUploadedBy(testUserId);
      expect(userFiles).toHaveLength(0);
    });
  });

  describe('count', () => {
    it('should return correct file count', async () => {
      expect(await fileRecordModel.count()).toBe(0);

      await fileRecordModel.create({
        originalName: 'count1.txt',
        filename: 'count1.txt',
        mimetype: 'text/plain',
        size: 1024,
        uploadedBy: testUserId,
      });

      expect(await fileRecordModel.count()).toBe(1);

      await fileRecordModel.create({
        originalName: 'count2.txt',
        filename: 'count2.txt',
        mimetype: 'text/plain',
        size: 2048,
        uploadedBy: testUserId,
      });

      expect(await fileRecordModel.count()).toBe(2);
    });

    it('should count with search options', async () => {
      await fileRecordModel.create({
        originalName: 'pdf-file.pdf',
        filename: 'pdf-file.pdf',
        mimetype: 'application/pdf',
        size: 1000000,
        uploadedBy: testUserId,
      });

      await fileRecordModel.create({
        originalName: 'text-file.txt',
        filename: 'text-file.txt',
        mimetype: 'text/plain',
        size: 1024,
        uploadedBy: testUserId,
      });

      const pdfCount = await fileRecordModel.count({ mimetype: 'pdf' });
      expect(pdfCount).toBe(1);

      const largeFileCount = await fileRecordModel.count({ minSize: 500000 });
      expect(largeFileCount).toBe(1);
    });
  });

  describe('getTotalSize', () => {
    it('should calculate total size of all files', async () => {
      const files = [
        {
          originalName: 'file1.txt',
          filename: 'file1.txt',
          mimetype: 'text/plain',
          size: 1024,
          uploadedBy: testUserId,
        },
        {
          originalName: 'file2.txt',
          filename: 'file2.txt',
          mimetype: 'text/plain',
          size: 2048,
          uploadedBy: testUserId,
        },
        {
          originalName: 'file3.txt',
          filename: 'file3.txt',
          mimetype: 'text/plain',
          size: 4096,
          uploadedBy: testUserId,
        },
      ];

      for (const fileData of files) {
        await fileRecordModel.create(fileData);
      }

      const totalSize = await fileRecordModel.getTotalSize();
      expect(totalSize).toBe(1024 + 2048 + 4096);
    });

    it('should calculate total size for specific user', async () => {
      const anotherUser = await userModel.create({
        username: 'anotheruser2',
        email: 'another2@example.com',
        password: 'password123',
      });

      await fileRecordModel.create({
        originalName: 'user1-file.txt',
        filename: 'user1-file.txt',
        mimetype: 'text/plain',
        size: 1024,
        uploadedBy: testUserId,
      });

      await fileRecordModel.create({
        originalName: 'user2-file.txt',
        filename: 'user2-file.txt',
        mimetype: 'text/plain',
        size: 2048,
        uploadedBy: anotherUser.id,
      });

      const user1TotalSize = await fileRecordModel.getTotalSize(testUserId);
      const user2TotalSize = await fileRecordModel.getTotalSize(anotherUser.id);

      expect(user1TotalSize).toBe(1024);
      expect(user2TotalSize).toBe(2048);
    });
  });

  describe('getMimetypes', () => {
    it('should return unique mimetypes', async () => {
      const files = [
        {
          originalName: 'file1.txt',
          filename: 'file1.txt',
          mimetype: 'text/plain',
          size: 1024,
          uploadedBy: testUserId,
        },
        {
          originalName: 'file2.txt',
          filename: 'file2.txt',
          mimetype: 'text/plain',
          size: 2048,
          uploadedBy: testUserId,
        },
        {
          originalName: 'file3.jpg',
          filename: 'file3.jpg',
          mimetype: 'image/jpeg',
          size: 4096,
          uploadedBy: testUserId,
        },
        {
          originalName: 'file4.pdf',
          filename: 'file4.pdf',
          mimetype: 'application/pdf',
          size: 8192,
          uploadedBy: testUserId,
        },
      ];

      for (const fileData of files) {
        await fileRecordModel.create(fileData);
      }

      const mimetypes = await fileRecordModel.getMimetypes();
      expect(mimetypes).toHaveLength(3);
      expect(mimetypes).toContain('text/plain');
      expect(mimetypes).toContain('image/jpeg');
      expect(mimetypes).toContain('application/pdf');
      expect(mimetypes).toEqual(mimetypes.sort()); // Should be sorted
    });
  });

  describe('getFileStats', () => {
    it('should return comprehensive file statistics', async () => {
      const files = [
        {
          originalName: 'file1.txt',
          filename: 'file1.txt',
          mimetype: 'text/plain',
          size: 1000,
          uploadedBy: testUserId,
        },
        {
          originalName: 'file2.txt',
          filename: 'file2.txt',
          mimetype: 'text/plain',
          size: 2000,
          uploadedBy: testUserId,
        },
        {
          originalName: 'file3.jpg',
          filename: 'file3.jpg',
          mimetype: 'image/jpeg',
          size: 3000,
          uploadedBy: testUserId,
        },
      ];

      for (const fileData of files) {
        await fileRecordModel.create(fileData);
      }

      const stats = await fileRecordModel.getFileStats();

      expect(stats.totalFiles).toBe(3);
      expect(stats.totalSize).toBe(6000);
      expect(stats.averageSize).toBe(2000);
      expect(stats.mimetypes['text/plain']).toBe(2);
      expect(stats.mimetypes['image/jpeg']).toBe(1);
    });

    it('should handle empty database', async () => {
      const stats = await fileRecordModel.getFileStats();

      expect(stats.totalFiles).toBe(0);
      expect(stats.totalSize).toBe(0);
      expect(stats.averageSize).toBe(0);
      expect(Object.keys(stats.mimetypes)).toHaveLength(0);
    });
  });
});
