import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, Min, IsMongoId } from 'class-validator';
import { TicketType } from '../enums/ticket-type.enum';
import { TicketStatus } from '../enums/ticket-status.enum';

export class CreateTicketDto {
  @ApiProperty({ description: 'ID of the associated event' })
  @IsMongoId()
  @IsNotEmpty()
  event: string;

  @ApiProperty({
    enum: TicketType,
    description: 'Type of ticket (e.g., VIP, STANDARD, etc.)',
  })
  @IsEnum(TicketType)
  @IsNotEmpty()
  type: TicketType;

  @ApiProperty({
    description: 'Price of the ticket',
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  price: number;

  @ApiProperty({
    description: 'Number of tickets available',
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({
    enum: TicketStatus,
    description: 'Status of the ticket',
  })
  @IsEnum(TicketStatus)
  @IsNotEmpty()
  status: TicketStatus;
}
