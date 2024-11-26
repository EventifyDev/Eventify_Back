import { Profile } from '../schemas/profile.schema';
import { CreateProfileDto } from '../dtos/create-profile.dto';
import { UpdateProfileDto } from '../dtos/update-profile.dto';

export interface IProfileRepository {
  createProfile(profileDto: CreateProfileDto): Promise<Profile>;
  findProfileById(id: string): Promise<Profile | null>;
  findProfileByUserId(userId: string): Promise<Profile | null>;
  updateProfile(
    id: string,
    profileDto: UpdateProfileDto,
  ): Promise<Profile | null>;
  deleteProfile(id: string): Promise<void>;
}
