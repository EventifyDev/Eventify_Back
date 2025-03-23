import { IsNotEmpty, IsString, IsArray, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({
    example: 'Administrator',
    description: 'Role name',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: ['read:users', 'write:users'],
    description: 'List of permissions',
  })
  @IsArray()
  @IsString({ each: true })
  permissions: string[];

  @ApiProperty({
    example: 'Manages user accounts and settings',
    description: 'Role description',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
