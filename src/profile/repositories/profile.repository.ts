import { IProfileRepository } from '../interfaces/profile.repository.interface';
import { Profile } from '../schemas/profile.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateProfileDto } from '../dtos/create-profile.dto';
import { UpdateProfileDto } from '../dtos/update-profile.dto';

export class ProfileRepository implements IProfileRepository {
  constructor(
    @InjectModel(Profile.name) private profileModel: Model<Profile>,
  ) {}

  async createProfile(profileDto: CreateProfileDto): Promise<Profile> {
    const newProfile = new this.profileModel(profileDto);
    return newProfile.save();
  }

  async findProfileById(id: string): Promise<Profile | null> {
    return this.profileModel.findById(id).exec();
  }

  async findProfileByUserId(userId: string): Promise<Profile | null> {
    return this.profileModel.findOne({ userId }).exec();
  }

  async updateProfile(
    id: string,
    profileDto: UpdateProfileDto,
  ): Promise<Profile | null> {
    return this.profileModel
      .findByIdAndUpdate(id, profileDto, { new: true })
      .exec();
  }

  async deleteProfile(id: string): Promise<void> {
    await this.profileModel.findByIdAndDelete(id).exec();
  }
}
