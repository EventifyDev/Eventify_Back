import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@/roles/schemas/role.schema';

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

  @ApiProperty({
    description: 'User role',
    type: String,
  })
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Role' })
  role: Role;

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop()
  otpCreatedAt?: Date;

  @Prop({ type: [String], default: [] })
  verifiedDevices: string[];

  @Prop({ type: String })
  deviceVerificationOtp: string;

  @Prop({ type: Date })
  deviceVerificationOtpCreatedAt: Date;

  @Prop({ type: String })
  pendingDeviceFingerprint: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
