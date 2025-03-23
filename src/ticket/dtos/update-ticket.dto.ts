import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsOptional,
  IsNumber,
  IsString,
  Min,
  IsBoolean,
} from 'class-validator';
import { TicketType } from '../enums/ticket-type.enum';
import { TicketStatus } from '../enums/ticket-status.enum';

export class UpdateTicketDto {
  @ApiPropertyOptional({ description: 'Ticket name/description' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Ticket description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: TicketType, description: 'Type of ticket' })
  @IsOptional()
  @IsEnum(TicketType)
  type?: TicketType;

  @ApiPropertyOptional({ description: 'Ticket price' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({
    enum: TicketStatus,
    description: 'Current status of ticket',
  })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

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
