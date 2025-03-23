import { IsString, IsNotEmpty, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @ApiProperty({
    description: 'Name of the category',
    example: 'CULTURAL',
    required: true,
  })
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  @ApiProperty({
    description: 'Description of the category',
    example: 'Events related to cultural activities',
    required: false,
  })
  description?: string;
}
