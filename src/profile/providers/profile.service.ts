import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { IProfileService } from '../interfaces/profile.interface';
import { IProfileRepository } from '../interfaces/profile.repository.interface';
import { Profile } from '../schemas/profile.schema';
import { CreateProfileDto } from '../dtos/create-profile.dto';
import { UpdateProfileDto } from '../dtos/update-profile.dto';

@Injectable()
export class ProfileService implements IProfileService {
  constructor(
    @Inject('IProfileRepository')
    private readonly profileRepository: IProfileRepository,
  ) {}

  async createProfile(profileDto: CreateProfileDto): Promise<Profile> {
    const existingProfile = await this.profileRepository.findProfileByUserId(
      profileDto.userId,
    );
    if (existingProfile) {
      throw new ConflictException('Profile for this user already exists');
    }
    return this.profileRepository.createProfile(profileDto);
  }

  async getProfileById(id: string): Promise<Profile | null> {
    const profile = await this.profileRepository.findProfileById(id);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile;
  }

  async getProfileByUserId(userId: string): Promise<Profile | null> {
    const profile = await this.profileRepository.findProfileByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile;
  }

  async updateProfile(
    id: string,
    profileDto: UpdateProfileDto,
  ): Promise<Profile | null> {
    const profile = await this.profileRepository.updateProfile(id, profileDto);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile;
  }

  async deleteProfile(id: string): Promise<void> {
    const profile = await this.profileRepository.findProfileById(id);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    await this.profileRepository.deleteProfile(id);
  }
}
