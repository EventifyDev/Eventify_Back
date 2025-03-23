import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsMongoId,
  IsBoolean,
} from 'class-validator';
import { TicketType } from '../enums/ticket-type.enum';

export class CreateTicketDto {
  @ApiProperty({ description: 'Ticket name/description' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'Ticket description' })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiProperty({ enum: TicketType, description: 'Type of ticket' })
  @IsNotEmpty()
  @IsEnum(TicketType)
  type: TicketType;

  @ApiProperty({ description: 'Ticket price' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ description: 'Associated event ID' })
  @IsNotEmpty()
  @IsMongoId()
  event: string;

  @ApiPropertyOptional({
    description: 'Whether the ticket can be transferred to another user',
  })
  @IsOptional()
  @IsBoolean()
  transferable?: boolean;

  @ApiPropertyOptional({
    description: 'Maximum quantity of tickets that can be sold',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({
    description: 'Additional metadata for custom ticket types',
  })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Expiration date of the ticket' })
  @IsOptional()
  expiresAt?: Date;
}
