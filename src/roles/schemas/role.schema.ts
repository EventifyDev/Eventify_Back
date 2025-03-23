import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type RoleDocument = Role & Document;

@Schema({
  collection: 'roles',
  timestamps: true,
})
export class Role {
  @ApiProperty({
    example: 'Administrator',
    description: 'Role name',
  })
  @Prop({ required: true, unique: true })
  name: string;

  @ApiProperty({
    example: ['read:users', 'write:users'],
    description: 'List of permissions for this role',
  })
  @Prop({ type: [String], default: [] })
  permissions: string[];

  @ApiProperty({
    description: 'Role description',
    example: 'Manages user accounts and settings',
  })
  @Prop()
  description?: string;
}

export const RoleSchema = SchemaFactory.createForClass(Role);
