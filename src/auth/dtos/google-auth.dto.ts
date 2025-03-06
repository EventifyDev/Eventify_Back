import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsUrl,
  IsOptional,
} from 'class-validator';

export class GoogleAuthDto {
  @ApiProperty({
    example: 'user@gmail.com',
    description: 'Email address from Google profile',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    example: 'John',
    description: 'First name from Google profile',
  })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Last name from Google profile',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({
    example: 'https://lh3.googleusercontent.com/a/photo',
    description: 'Profile picture URL',
  })
  @IsUrl()
  @IsOptional()
  picture?: string;

  @ApiProperty({
    example: 'ya29.a0AfB_byDgL...',
    description: 'Google OAuth access token',
  })
  @IsString()
  @IsNotEmpty()
  accessToken: string;

  @ApiProperty({
    example: '1//04s9UgplL...',
    description: 'Google OAuth refresh token',
  })
  @IsString()
  @IsOptional()
  refreshToken?: string;
}
