import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';;

import { User } from '../../user/schemas/user.schema';
import { ApiProperty } from '@nestjs/swagger';

export type EventDocument = Event & Document;

@Schema({
  collection: 'events',
  timestamps: true,
})
export class Event {
  @ApiProperty({
    type: String,
    description: 'ID of the event organizer',
    required: true,
  })
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  organizer: User;

  @ApiProperty({
    type: String,
    minLength: 3,
    maxLength: 100,
    description: 'Name of the event',
    example: 'Summer Music Festival 2024',
    required: true,
  })
  @Prop({
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100,
  })
  name: string;

  @ApiProperty({
    type: String,
    minLength: 20,
    maxLength: 1000,
    description: 'Detailed description of the event',
    example:
      'Join us for an amazing evening of live music and entertainment...',
    required: true,
  })
  @Prop({
    required: true,
    minlength: 20,
    maxlength: 1000,
  })
  description: string;

  @ApiProperty({
    type: Date,
    description: 'Date and time of the event',
    example: '2024-07-15T18:00:00Z',
    required: true,
  })
  @Prop({
    required: true,
    type: Date,
  })
  date: Date;

  @ApiProperty({
    type: Number,
    minimum: 1,
    maximum: 100000,
    description: 'Maximum number of attendees',
    example: 500,
    required: true,
  })
  @Prop({
    required: true,
    min: 1,
    max: 100000,
    type: Number,
  })
  capacity: number;

  @ApiProperty({
    type: String,
    description: 'Event venue location',
    example: 'Central Park, New York',
    required: true,
  })
  @Prop({
    required: true,
    trim: true,
  })
  location: string;

  @ApiProperty({
    enum: ['SPORT', 'CULTURAL', 'PROFESSIONAL', 'SOCIAL', 'OTHER'],
    description: 'Type of the event',
    example: 'CULTURAL',
    default: 'OTHER',
    required: true,
  })
  @Prop({
    required: true,
    enum: ['SPORT', 'CULTURAL', 'PROFESSIONAL', 'SOCIAL', 'OTHER'],
    default: 'OTHER',
  })
  eventType: string;

  @ApiProperty({
    type: String,
    description: 'URL of the event cover image',
    example: 'https://example.com/images/event-cover.jpg',
    required: true,
  })
  @Prop({
    required: true,
    type: String,
  })
  image: string;
}

export const EventSchema = SchemaFactory.createForClass(Event);
