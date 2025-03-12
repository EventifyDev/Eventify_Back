import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { User } from '../../user/schemas/user.schema';
import { NotificationType } from '../enums/notification-type.enum';

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true, enum: NotificationType })
  type: NotificationType;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  recipient: User | string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  sender: User | string;

  @Prop({ type: MongooseSchema.Types.Mixed })
  data: Record<string, any>;

  @Prop({ default: false })
  read: boolean;

  @Prop({ default: null })
  readAt: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export type NotificationDocument = Notification & Document;
export const NotificationSchema = SchemaFactory.createForClass(Notification);
