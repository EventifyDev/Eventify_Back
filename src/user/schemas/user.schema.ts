import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

@Schema({ timestamps: true })
export class User extends Document {

  @ApiProperty({
    description: 'Unique username',
    example: 'johndoe',
    required: true,
  })
  @Prop({
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  })
  username: string;

  @ApiProperty({
    description: 'Unique email address',
    example: 'john.doe@example.com',
    required: true,
  })
  @Prop({
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  })
  email: string;

  @ApiProperty({
    description: 'User password (hashed)',
    required: true,
    writeOnly: true,
  })
  @Prop({
    required: true,
    select: false,
  })
  password: string;

  @Prop()
  refreshToken?: string;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop()
  otpCreatedAt?: Date;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
