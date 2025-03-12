import {
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EventApprovalDto {
  @ApiProperty({
    example: '60d21b4667d0d8992e610c87',
    description: 'MongoDB ID of the event',
  })
  @IsMongoId()
  @IsNotEmpty()
  eventId: string;

  @ApiProperty({
    example: true,
    description: 'Whether the event is approved',
  })
  @IsBoolean()
  @IsNotEmpty()
  approved: boolean;

  @ApiProperty({
    example: "Les informations sur l'événement sont incomplètes",
    description: 'Reason for rejection (required if approved is false)',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
