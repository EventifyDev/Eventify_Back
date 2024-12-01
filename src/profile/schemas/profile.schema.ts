import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import mongoose from 'mongoose';
import { User } from '../../user/schemas/user.schema';
import { ApiProperty } from '@nestjs/swagger';

export type ProfileDocument = Profile & Document;

@Schema({
  collection: 'profiles',
  timestamps: true,
})
export class Profile {
  @ApiProperty({ type: String, description: 'The ID of the associated user' })
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  userId: User;

  @ApiProperty({
    type: Number,
    minimum: 0,
    maximum: 150,
    required: false,
    description: 'Age of the user',
  })
  @Prop({
    required: false,
    min: 0,
    max: 150,
  })
  age?: number;

  @ApiProperty({
    type: String,
    minLength: 10,
    maxLength: 500,
    required: false,
    description: 'User biography',
  })
  @Prop({
    required: false,
    minlength: 10,
    maxlength: 500,
  })
  bio?: string;

  @ApiProperty({
    type: String,
    required: false,
    description: 'URL to user profile image',
  })
  @Prop({
    required: false,
  })
  imageUrl?: string;

  @ApiProperty({
    type: String,
    required: false,
    description: 'User phone number',
  })
  @Prop({
    required: false,
  })
  phoneNumber?: string;

  @ApiProperty({
    type: String,
    required: false,
    description: 'User address',
  })
  @Prop({
    required: false,
  })
  address?: string;
}

export const ProfileSchema = SchemaFactory.createForClass(Profile);
