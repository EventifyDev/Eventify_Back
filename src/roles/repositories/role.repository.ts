import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument } from '../schemas/role.schema';
import { User } from '../../user/schemas/user.schema';
import { CreateRoleDto } from '../dtos/create-role.dto';
import { UpdateRoleDto } from '../dtos/update-role.dto';
import { IRoleRepository } from '../interfaces/role-repository.interface';

@Injectable()
export class RoleRepository implements IRoleRepository {
  private readonly logger = new Logger(RoleRepository.name);

  constructor(
    @InjectModel(Role.name) private readonly roleModel: Model<RoleDocument>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async findAll(): Promise<Role[]> {
    return this.roleModel.find().exec();
  }

  async findById(id: string): Promise<Role | null> {
    return this.roleModel.findById(id).exec();
  }

  async findByName(name: string): Promise<Role | null> {
    return this.roleModel.findOne({ name }).exec();
  }

  async findRolesByNames(names: string[]): Promise<Role[]> {
    return this.roleModel
      .find({ name: { $in: names } })
      .lean()
      .exec();
  }

  async create(createRoleDto: CreateRoleDto): Promise<Role> {
    const createdRole = new this.roleModel(createRoleDto);
    return createdRole.save();
  }

  async update(id: string, updateRoleDto: UpdateRoleDto): Promise<Role | null> {
    return this.roleModel
      .findByIdAndUpdate(id, updateRoleDto, { new: true })
      .exec();
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.roleModel.findByIdAndDelete(id).exec();
    return !!result;
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<any> {
    return this.userModel
      .findByIdAndUpdate(userId, { role: roleId }, { new: true })
      .populate('role')
      .exec();
  }

  async getUserWithRole(userId: string): Promise<any> {
    return this.userModel.findById(userId).populate('role').exec();
  }
}
