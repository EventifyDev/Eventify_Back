import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProfileService } from '../providers/profile.service';
import { CreateProfileDto } from '../dtos/create-profile.dto';
import { UpdateProfileDto } from '../dtos/update-profile.dto';
import { Profile } from '../schemas/profile.schema';

@ApiTags('profiles')
@Controller('profiles')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new profile' })
  @ApiResponse({
    status: 201,
    description: 'The profile has been successfully created.',
    type: Profile,
  })
  @ApiResponse({
    status: 409,
    description: 'Profile for this user already exists.',
  })
  async createProfile(
    @Body() createProfileDto: CreateProfileDto,
  ): Promise<Profile> {
    return this.profileService.createProfile(createProfileDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a profile by ID' })
  @ApiResponse({
    status: 200,
    description: 'The profile has been successfully retrieved.',
    type: Profile,
  })
  @ApiResponse({ status: 404, description: 'Profile not found.' })
  async getProfileById(@Param('id') id: string): Promise<Profile> {
    const profile = await this.profileService.getProfileById(id);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a profile by ID' })
  @ApiResponse({
    status: 200,
    description: 'The profile has been successfully updated.',
    type: Profile,
  })
  @ApiResponse({ status: 404, description: 'Profile not found.' })
  async updateProfile(
    @Param('id') id: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<Profile> {
    const profile = await this.profileService.updateProfile(
      id,
      updateProfileDto,
    );
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a profile by ID' })
  @ApiResponse({
    status: 204,
    description: 'The profile has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Profile not found.' })
  async deleteProfile(@Param('id') id: string): Promise<void> {
    await this.profileService.deleteProfile(id);
  }
}
