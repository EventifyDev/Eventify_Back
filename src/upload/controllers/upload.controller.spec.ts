import { Test, TestingModule } from '@nestjs/testing';
import { UploadController } from './upload.controller';
import { UploadService } from '../providers/upload.service';

describe('UploadController', () => {
  let controller: UploadController;
  let uploadService: jest.Mocked<UploadService>;

  beforeEach(async () => {
    const mockUploadService = {
      uploadFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [
        {
          provide: UploadService,
          useValue: mockUploadService,
        },
      ],
    }).compile();

    controller = module.get<UploadController>(UploadController);
    uploadService = module.get(UploadService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should upload a file successfully', async () => {
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

      const expectedResponse = {
        url: 'https://bucket.s3.amazonaws.com/uploads/test-image.jpg',
        key: 'uploads/test-image.jpg',
      };

      uploadService.uploadFile.mockResolvedValue(expectedResponse);

      const result = await controller.uploadFile(mockFile);

      expect(uploadService.uploadFile).toHaveBeenCalledWith(mockFile);
      expect(result).toEqual(expectedResponse);
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

      const error = new Error('Upload failed');
      uploadService.uploadFile.mockRejectedValue(error);

      await expect(controller.uploadFile(mockFile)).rejects.toThrow(
        'Upload failed',
      );
    });
  });
});
