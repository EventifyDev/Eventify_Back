import { Test, TestingModule } from '@nestjs/testing';
import { UploadService } from './upload.service';
import { S3 } from 'aws-sdk';

jest.mock('aws-sdk', () => {
  const mockUploadPromise = jest.fn();
  const mockUpload = jest.fn().mockImplementation(() => ({
    promise: mockUploadPromise,
  }));

  return {
    S3: jest.fn().mockImplementation(() => ({
      upload: mockUpload,
    })),
  };
});

describe('UploadService', () => {
  let service: UploadService;
  let s3Mock: jest.Mocked<S3>;

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'test-image.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('mock file content'),
    size: 1234,
    stream: null,
    destination: '',
    filename: '',
    path: '',
  };

  const mockS3Response = {
    Location:
      'https://bucket-name.s3.amazonaws.com/uploads/uuid-test-image.jpg',
    Key: 'uploads/uuid-test-image.jpg',
    Bucket: 'bucket-name',
    ETag: '"mock-etag"',
  };

  beforeEach(async () => {
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_ACCESS_KEY_ID = 'test-access-key';
    process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
    process.env.AWS_PUBLIC_BUCKET_NAME = 'bucket-name';

    const module: TestingModule = await Test.createTestingModule({
      providers: [UploadService],
    }).compile();

    service = module.get<UploadService>(UploadService);
    s3Mock = new S3() as jest.Mocked<S3>;

    const mockUploadPromise = s3Mock.upload({} as any).promise as jest.Mock;
    mockUploadPromise.mockResolvedValue(mockS3Response);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should upload a file to S3 and return the url and key', async () => {
      jest.spyOn(global.Math, 'random').mockReturnValue(0.123456789);

      const result = await service.uploadFile(mockFile);

      const uploadMock = s3Mock.upload({} as any);
      expect(uploadMock.promise).toHaveBeenCalled();

      expect(result).toEqual({
        url: mockS3Response.Location,
        key: mockS3Response.Key,
      });
    });

    it('should throw an error if S3 upload fails', async () => {
      const mockUploadPromise = s3Mock.upload({} as any).promise as jest.Mock;
      mockUploadPromise.mockRejectedValue(new Error('S3 upload failed'));

      await expect(service.uploadFile(mockFile)).rejects.toThrow(
        'File upload failed: S3 upload failed',
      );
    });
  });
});
