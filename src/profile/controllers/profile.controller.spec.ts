import { Test, TestingModule } from '@nestjs/testing';
import { ProfileController } from './profile.controller';
import { ProfileService } from '../providers/profile.service';
import { CreateProfileDto } from '../dtos/create-profile.dto';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { Profile } from '../schemas/profile.schema';
import { User } from '../../user/schemas/user.schema';
describe('ProfileController', () => {
  let controller: ProfileController;
  let profileService: jest.Mocked<ProfileService>;

  const mockUser = {
    _id: new Types.ObjectId('67464220a978f5889273313c'),
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedpassword',
    createdAt: new Date(),
    updatedAt: new Date(),
    __v: 0,
  } as unknown as User;

  const mockProfile = {
    _id: new Types.ObjectId('6745e1351698c188c18d3e98'),
    userId: mockUser,
    age: 68,
    bio: 'I am a software engineer',
    imageUrl: 'https://example.com/image.jpg',
    phoneNumber: '+1234567890',
    address: '123 Main St, Anytown, USA',
    createdAt: new Date('2024-11-26T14:54:45.161Z'),
    updatedAt: new Date('2024-11-26T15:00:47.103Z'),
    __v: 0,
  } as unknown as Profile;

  beforeEach(async () => {
    const mockProfileService = {
      createProfile: jest.fn(),
      getProfileById: jest.fn(),
      updateProfile: jest.fn(),
      deleteProfile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProfileController],
      providers: [
        {
          provide: ProfileService,
          useValue: mockProfileService,
        },
      ],
    }).compile();

    controller = module.get<ProfileController>(ProfileController);
    profileService = module.get(ProfileService);
  });

  describe('createProfile', () => {
    const createProfileDto: CreateProfileDto = {
      userId: '67464220a978f5889273313c',
      age: 68,
      bio: 'I am a software engineer',
      imageUrl: 'https://example.com/image.jpg',
      phoneNumber: '+1234567890',
      address: '123 Main St, Anytown, USA',
    };

    it('should create a new profile', async () => {
      profileService.createProfile.mockResolvedValue(mockProfile);

      const result = await controller.createProfile(createProfileDto);

      expect(profileService.createProfile).toHaveBeenCalledWith(
        createProfileDto,
      );
      expect(result).toEqual(mockProfile);
    });
  });

  describe('getProfileById', () => {
    it('should get a profile by id', async () => {
      profileService.getProfileById.mockResolvedValue(mockProfile);

      const result = await controller.getProfileById(
        '6745e1351698c188c18d3e98',
      );

      expect(profileService.getProfileById).toHaveBeenCalledWith(
        '6745e1351698c188c18d3e98',
      );
      expect(result).toEqual(mockProfile);
    });

    it('should throw NotFoundException when profile not found', async () => {
      profileService.getProfileById.mockResolvedValue(null);

      await expect(
        controller.getProfileById('6745e1351698c188c18d3e98'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateProfile', () => {
    const updateProfileDto: UpdateProfileDto = {
      age: 69,
      bio: 'Updated bio',
      phoneNumber: '+1987654321',
    };

    it('should update a profile', async () => {
      const updatedProfile = { ...mockProfile, ...updateProfileDto } as Profile;
      profileService.updateProfile.mockResolvedValue(updatedProfile);

      const result = await controller.updateProfile(
        '6745e1351698c188c18d3e98',
        updateProfileDto,
      );

      expect(profileService.updateProfile).toHaveBeenCalledWith(
        '6745e1351698c188c18d3e98',
        updateProfileDto,
      );
      expect(result).toEqual(updatedProfile);
    });

    it('should throw NotFoundException when profile not found', async () => {
      profileService.updateProfile.mockResolvedValue(null);

      await expect(
        controller.updateProfile('6745e1351698c188c18d3e98', updateProfileDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteProfile', () => {
    it('should delete a profile', async () => {
      profileService.deleteProfile.mockResolvedValue(undefined);

      await controller.deleteProfile('6745e1351698c188c18d3e98');

      expect(profileService.deleteProfile).toHaveBeenCalledWith(
        '6745e1351698c188c18d3e98',
      );
    });

    it('should throw NotFoundException when profile not found', async () => {
      profileService.deleteProfile.mockRejectedValue(
        new NotFoundException('Profile not found'),
      );

      await expect(
        controller.deleteProfile('6745e1351698c188c18d3e98'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
