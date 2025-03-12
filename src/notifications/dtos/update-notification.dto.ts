import { IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateNotificationDto } from './create-notification.dto';

export class UpdateNotificationDto extends PartialType(CreateNotificationDto) {
  @ApiProperty({
    example: true,
    description: 'Whether the notification has been read',
  })
  @IsBoolean()
  @IsOptional()
  read?: boolean;
}
