import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class WebhookPayloadDto {
  @ApiProperty({ description: 'Payment ID from the payment provider' })
  @IsNotEmpty()
  @IsString()
  id: string;
}
