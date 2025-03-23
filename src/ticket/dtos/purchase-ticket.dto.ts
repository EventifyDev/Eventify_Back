import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsMongoId,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';

export class PurchaseTicketDto {
  @ApiProperty({ description: 'Ticket ID to purchase' })
  @IsNotEmpty()
  @IsMongoId()
  ticketId: string;

  @ApiProperty({ description: 'User ID making the purchase' })
  @IsNotEmpty()
  @IsMongoId()
  userId: string;

  @ApiPropertyOptional({
    description: 'Number of tickets to purchase',
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @ApiPropertyOptional({ description: 'Payment information' })
  @IsOptional()
  paymentInfo?: Record<string, any>;
}
