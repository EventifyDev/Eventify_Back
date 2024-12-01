import { Profile } from '../schemas/profile.schema';
import { CreateProfileDto } from '../dtos/create-profile.dto';
import { UpdateProfileDto } from '../dtos/update-profile.dto';

export interface IProfileService {
  createProfile(profileDto: CreateProfileDto): Promise<Profile>;
  getProfileById(id: string): Promise<Profile | null>;
  getProfileByUserId(userId: string): Promise<Profile | null>;
  updateProfile(
    id: string,
    profileDto: UpdateProfileDto,
  ): Promise<Profile | null>;
  deleteProfile(id: string): Promise<void>;
}
