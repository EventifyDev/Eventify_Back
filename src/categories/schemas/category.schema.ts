import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type CategoryDocument = Category & Document;

@Schema({
  collection: 'categories',
  timestamps: true,
})
export class Category {
  @ApiProperty({
    type: String,
    description: 'Name of the category',
    example: 'CULTURAL',
    required: true,
  })
  @Prop({
    required: true,
    unique: true,
    trim: true,
  })
  name: string;

  @ApiProperty({
    type: String,
    description: 'Description of the category',
    example: 'Events related to cultural activities',
  })
  @Prop({
    trim: true,
  })
  description: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
