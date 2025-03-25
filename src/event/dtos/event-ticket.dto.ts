import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsEnum, Min } from 'class-validator';
import { TicketType } from '../../ticket/enums/ticket-type.enum';

export class EventTicketDto {
  @ApiProperty({ enum: TicketType, example: TicketType.VIP })
  @IsEnum(TicketType)
  type: TicketType;

  @ApiProperty({ example: 100, minimum: 0 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 50, minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;
}
