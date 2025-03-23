import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class BlacklistedRefreshToken extends Document {
  @Prop({ required: true, index: true })
  token: string;

  @Prop({ required: true, index: true })
  userId: string;

  @Prop({ required: true })
  expiresAt: Date;
}

export const BlacklistedRefreshTokenSchema = SchemaFactory.createForClass(
  BlacklistedRefreshToken,
);
