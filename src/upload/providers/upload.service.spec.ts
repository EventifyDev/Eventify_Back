import { Test, TestingModule } from '@nestjs/testing';
import { UploadService } from './upload.service';
import { ConfigModule } from '@nestjs/config';

const mockS3Instance = {
  upload: jest.fn().mockReturnThis(),
  promise: jest.fn(),
};

jest.mock('aws-sdk', () => ({
  S3: jest.fn(() => mockS3Instance),
}));

describe('UploadService', () => {
  let service: UploadService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [UploadService],
    }).compile();

    service = module.get<UploadService>(UploadService);
    mockS3Instance.upload.mockClear();
    mockS3Instance.promise.mockClear();
  });

  describe('uploadFile', () => {
    it('should successfully upload a file to S3', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test-image.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('mock file content'),
        size: 1024,
        destination: '',
        filename: '',
        path: '',
        stream: null,
      };

      const mockS3Response = {
        Location: 'https://bucket.s3.amazonaws.com/uploads/test-image.jpg',
        Key: 'uploads/test-image.jpg',
        Bucket: 'test-bucket',
      };

      mockS3Instance.upload.mockReturnThis();
      mockS3Instance.promise.mockResolvedValueOnce(mockS3Response);

      const result = await service.uploadFile(mockFile);

      expect(result).toEqual({
        url: mockS3Response.Location,
        key: mockS3Response.Key,
      });
    });

    it('should throw an error when upload fails', async () => {
      const mockFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'test-image.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        buffer: Buffer.from('mock file content'),
        size: 1024,
        destination: '',
        filename: '',
        path: '',
        stream: null,
      };

      mockS3Instance.upload.mockReturnThis();
      mockS3Instance.promise.mockRejectedValueOnce(new Error('Upload failed'));

      await expect(service.uploadFile(mockFile)).rejects.toThrow(
        'File upload failed: Upload failed',
      );
    });
  });
});
