import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import mongoose from 'mongoose';
import { User } from '../../user/schemas/user.schema';

export type ProfileDocument = Profile & Document;

@Schema({
  timestamps: true,
})
export class Profile {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userId: User;

  @Prop({
    required: false,
    min: 0,
    max: 150,
  })
  age?: number;

  @Prop({
    required: false,
    minlength: 10,
    maxlength: 500,
  })
  bio?: string;

  @Prop({
    required: false,
  })
  imageUrl?: string;

  @Prop({
    required: false,
  })
  phoneNumber?: string;

  @Prop({
    required: false,
  })
  address?: string;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
