import { IUserRepository } from '../interfaces/user.repository.interface';
import { User } from '../schemas/user.schema';
import { FilterQuery, Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';

export class UserRepository implements IUserRepository {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async createUser(userDto: CreateUserDto): Promise<User> {
    const newUser = new this.userModel(userDto);
    return newUser.save();
  }

  async findUser(query: FilterQuery<User>): Promise<User | null> {
    try {
      const user = await this.userModel.findOne(query);

      if (!user) {
        return null;
      }

      return user.toObject();
    } catch (error) {
      throw new Error(`Error finding user: ${error.message}`);
    }
  }

  async findUserWithPassword(query: FilterQuery<User>): Promise<User | null> {
    try {
      const user = await this.userModel.findOne(query).select('+password');

      if (!user) {
        return null;
      }

      return user.toObject();
    } catch (error) {
      throw new Error(`Error finding user with password: ${error.message}`);
    }
  }

  async addVerifiedDevice(
    userId: string,
    deviceFingerprint: string,
  ): Promise<void> {
    await this.userModel
      .findByIdAndUpdate(userId, {
        $addToSet: { verifiedDevices: deviceFingerprint },
      })
      .exec();
  }

  async findAllUsers(): Promise<User[]> {
    return this.userModel.find({});
  }

  async updateUser(query: FilterQuery<User>, data: UpdateUserDto) {
    return this.userModel.findOneAndUpdate(query, data);
  }

  async deleteUser(id: string): Promise<void> {
    await this.userModel.findByIdAndDelete(id).exec();
  }
}
