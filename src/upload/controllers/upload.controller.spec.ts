import { Test, TestingModule } from '@nestjs/testing';
import { UploadController } from './upload.controller';
import { UploadService } from '../providers/upload.service';

describe('UploadController', () => {
  let controller: UploadController;
  let uploadService: UploadService;

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

  const mockUploadResult = {
    url: 'https://bucket-name.s3.amazonaws.com/uploads/file-id.jpg',
    key: 'uploads/file-id.jpg',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UploadController],
      providers: [
        {
          provide: UploadService,
          useValue: {
            uploadFile: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<UploadController>(UploadController);
    uploadService = module.get<UploadService>(UploadService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadFile', () => {
    it('should call uploadService.uploadFile with the file and return the result', async () => {
      jest
        .spyOn(uploadService, 'uploadFile')
        .mockResolvedValue(mockUploadResult);

      const result = await controller.uploadFile(mockFile);

      expect(uploadService.uploadFile).toHaveBeenCalledWith(mockFile);
      expect(result).toEqual(mockUploadResult);
    });

    it('should propagate errors from the upload service', async () => {
      const errorMessage = 'File upload failed';
      jest
        .spyOn(uploadService, 'uploadFile')
        .mockRejectedValue(new Error(errorMessage));

      await expect(controller.uploadFile(mockFile)).rejects.toThrow(
        errorMessage,
      );
    });
  });
});
