import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsDate,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsFutureDate } from '../../common/decorators/is-future-date.decorator';

export enum EventType {
  SPORT = 'SPORT',
  CULTURAL = 'CULTURAL',
  PROFESSIONAL = 'PROFESSIONAL',
  SOCIAL = 'SOCIAL',
  OTHER = 'OTHER',
}

export class CreateEventDto {
  @ApiProperty({
    description: 'Name of the event',
    example: 'Jazz Concert',
    minLength: 3,
    maxLength: 100,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Detailed description of the event',
    example: 'An exceptional evening featuring the best jazz artists...',
    minLength: 20,
    maxLength: 1000,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(20)
  @MaxLength(1000)
  description: string;

  @ApiProperty({
    description: 'Date of the event',
    example: '2024-12-31',
    type: Date,
  })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  @IsFutureDate()
  date: Date;

  @ApiProperty({
    description: 'Maximum capacity of the event',
    example: 1000,
    minimum: 1,
    maximum: 100000,
  })
  @IsNotEmpty()
  @Type(() => Number)
  @Min(1)
  @Max(100000)
  capacity: number;

  @ApiProperty({
    description: 'Location of the event',
    example: 'Convention Center, New York',
  })
  @IsNotEmpty()
  @IsString()
  location: string;

  @ApiProperty({
    description: 'Type of event',
    enum: EventType,
    example: EventType.CULTURAL,
    enumName: 'EventType',
  })
  @IsNotEmpty()
  @IsEnum(EventType)
  eventType: EventType;

  @ApiProperty({
    description: 'Image file for the event',
    type: 'string',
    required: true,
  })
  image?: Express.Multer.File | string;
}
