import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  Max,
  IsUrl,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProfileDto {
  @ApiProperty({
    description: 'The ID of the user associated with the profile',
    example: '60d0fe4f5311236168a109ca',
  })
  @IsString()
  userId: string;

  @ApiProperty({
    description: 'The age of the user',
    example: 25,
  })
  @IsNumber()
  @Min(0)
  @Max(150)
  @IsOptional()
  age?: number;

  @ApiProperty({
    description: 'A short biography of the user',
    example: 'Software developer with 5 years of experience.',
  })
  @IsString()
  @IsOptional()
  @MinLength(10)
  @MaxLength(500)
  bio?: string;

  @ApiProperty({
    description: "URL to the user's profile image",
    example: 'http://example.com/image.jpg',
  })
  @IsString()
  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @ApiProperty({
    description: "The user's phone number",
    example: '+1234567890',
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({
    description: "The user's address",
    example: '123 Main St, Anytown, USA',
  })
  @IsString()
  @IsOptional()
  address?: string;
}
