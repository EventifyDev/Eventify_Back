import { IUserRepository } from '../interfaces/user.repository.interface';
import { User } from '../schemas/user.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { CreateUserDto } from '../dtos/create-user.dto';
import { UpdateUserDto } from '../dtos/update-user.dto';

export class UserRepository implements IUserRepository {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async createUser(userDto: CreateUserDto): Promise<User> {
    const newUser = new this.userModel(userDto);
    return newUser.save();
  }

  async findUserById(id: string): Promise<User | null> {
    return this.userModel.findById(id).exec();
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  async findUserByUsername(username: string): Promise<User | null> {
    return this.userModel.findOne({ username: username }).exec();
  }

  async findAllUsers(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async updateUser(id: string, userDto: UpdateUserDto): Promise<User | null> {
    return this.userModel.findByIdAndUpdate(id, userDto, { new: true }).exec();
  }

  async deleteUser(id: string): Promise<void> {
    await this.userModel.findByIdAndDelete(id).exec();
  }
}
