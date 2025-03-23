import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ description: 'Ticket ID for the payment' })
  @IsNotEmpty()
  @IsString()
  ticketId: string;

  @ApiProperty({ description: 'User ID making the payment' })
  @IsNotEmpty()
  @IsString()
  userId: string;

  @ApiProperty({ description: 'Quantity of tickets to purchase', default: 1 })
  @IsOptional()
  @IsNumber()
  quantity: number = 1;

  @ApiProperty({ description: 'Redirect URL after payment completion' })
  @IsNotEmpty()
  @IsString()
  redirectUrl: string;

  @ApiProperty({ description: 'Optional metadata for the payment' })
  @IsOptional()
  metadata?: Record<string, any>;
}
