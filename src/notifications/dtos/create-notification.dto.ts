import {
  IsEnum,
  IsNotEmpty,
  IsString,
  IsMongoId,
  IsOptional,
  IsObject,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../enums/notification-type.enum';

export class CreateNotificationDto {
  @ApiProperty({
    enum: NotificationType,
    example: NotificationType.EVENT_CREATED,
    description: 'Type of notification',
  })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @ApiProperty({
    example: 'Nouvel événement créé',
    description: 'Title of the notification',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    example:
      'Un nouvel événement "Festival de Musique" a été créé et nécessite votre approbation',
    description: 'Detailed message of the notification',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiProperty({
    example: '60d21b4667d0d8992e610c85',
    description: 'MongoDB ID of the recipient user',
  })
  @IsMongoId()
  @IsNotEmpty()
  recipient: string;

  @ApiProperty({
    example: '60d21b4667d0d8992e610c86',
    description: 'MongoDB ID of the sender user (optional)',
  })
  @IsMongoId()
  @IsOptional()
  sender?: string;

  @ApiProperty({
    example: {
      eventId: '60d21b4667d0d8992e610c87',
      eventName: 'Festival de Musique',
      requiresApproval: true,
    },
    description: 'Additional data related to the notification',
  })
  @IsObject()
  @IsOptional()
  data?: Record<string, any>;
}
