import { Test, TestingModule } from '@nestjs/testing';
import { ProfileService } from './profile.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('ProfileService', () => {
  let service: ProfileService;
  let mockProfileRepository: any;

  const mockProfile = {
    _id: new Types.ObjectId('6745e1351698c188c18d3e98'),
    userId: new Types.ObjectId('67464220a978f5889273313c'),
    age: 68,
    bio: 'I am a software engineer',
    imageUrl: 'https://example.com/image.jpg',
    phoneNumber: '+1234567890',
    address: '123 Main St, Anytown, USA',
    createdAt: new Date('2024-11-26T14:54:45.161Z'),
    updatedAt: new Date('2024-11-26T15:00:47.103Z'),
    __v: 0,
  };

  beforeEach(async () => {
    mockProfileRepository = {
      findProfileByUserId: jest.fn(),
      createProfile: jest.fn(),
      findProfileById: jest.fn(),
      updateProfile: jest.fn(),
      deleteProfile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        {
          provide: 'IProfileRepository',
          useValue: mockProfileRepository,
        },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
  });

  describe('createProfile', () => {
    const createProfileDto = {
      userId: '67464220a978f5889273313c',
      age: 68,
      bio: 'I am a software engineer',
      imageUrl: 'https://example.com/image.jpg',
      phoneNumber: '+1234567890',
      address: '123 Main St, Anytown, USA',
    };

    it('should create a profile successfully', async () => {
      mockProfileRepository.findProfileByUserId.mockResolvedValue(null);
      mockProfileRepository.createProfile.mockResolvedValue(mockProfile);

      const result = await service.createProfile(createProfileDto);

      expect(mockProfileRepository.findProfileByUserId).toHaveBeenCalledWith(
        createProfileDto.userId,
      );
      expect(mockProfileRepository.createProfile).toHaveBeenCalledWith(
        createProfileDto,
      );
      expect(result).toEqual(mockProfile);
    });

    it('should throw ConflictException if profile already exists', async () => {
      mockProfileRepository.findProfileByUserId.mockResolvedValue(mockProfile);

      await expect(service.createProfile(createProfileDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('getProfileById', () => {
    it('should return a profile by id', async () => {
      mockProfileRepository.findProfileById.mockResolvedValue(mockProfile);

      const result = await service.getProfileById('6745e1351698c188c18d3e98');

      expect(mockProfileRepository.findProfileById).toHaveBeenCalledWith(
        '6745e1351698c188c18d3e98',
      );
      expect(result).toEqual(mockProfile);
    });

    it('should throw NotFoundException when profile not found', async () => {
      mockProfileRepository.findProfileById.mockResolvedValue(null);

      await expect(
        service.getProfileById('6745e1351698c188c18d3e98'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getProfileByUserId', () => {
    it('should return a profile by userId', async () => {
      mockProfileRepository.findProfileByUserId.mockResolvedValue(mockProfile);

      const result = await service.getProfileByUserId(
        '67464220a978f5889273313c',
      );

      expect(mockProfileRepository.findProfileByUserId).toHaveBeenCalledWith(
        '67464220a978f5889273313c',
      );
      expect(result).toEqual(mockProfile);
    });

    it('should throw NotFoundException when profile not found', async () => {
      mockProfileRepository.findProfileByUserId.mockResolvedValue(null);

      await expect(
        service.getProfileByUserId('67464220a978f5889273313c'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    const updateProfileDto = {
      age: 69,
      bio: 'Updated bio',
      phoneNumber: '+1987654321',
    };

    it('should update profile successfully', async () => {
      const updatedProfile = { ...mockProfile, ...updateProfileDto };
      mockProfileRepository.updateProfile.mockResolvedValue(updatedProfile);

      const result = await service.updateProfile(
        '6745e1351698c188c18d3e98',
        updateProfileDto,
      );

      expect(mockProfileRepository.updateProfile).toHaveBeenCalledWith(
        '6745e1351698c188c18d3e98',
        updateProfileDto,
      );
      expect(result).toEqual(updatedProfile);
    });

    it('should throw NotFoundException when profile not found', async () => {
      mockProfileRepository.updateProfile.mockResolvedValue(null);

      await expect(
        service.updateProfile('6745e1351698c188c18d3e98', updateProfileDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteProfile', () => {
    it('should delete profile successfully', async () => {
      mockProfileRepository.findProfileById.mockResolvedValue(mockProfile);
      mockProfileRepository.deleteProfile.mockResolvedValue(undefined);

      await service.deleteProfile('6745e1351698c188c18d3e98');

      expect(mockProfileRepository.findProfileById).toHaveBeenCalledWith(
        '6745e1351698c188c18d3e98',
      );
      expect(mockProfileRepository.deleteProfile).toHaveBeenCalledWith(
        '6745e1351698c188c18d3e98',
      );
    });

    it('should throw NotFoundException when profile not found', async () => {
      mockProfileRepository.findProfileById.mockResolvedValue(null);

      await expect(
        service.deleteProfile('6745e1351698c188c18d3e98'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
