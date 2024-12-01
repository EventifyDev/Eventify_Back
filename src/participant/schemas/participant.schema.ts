import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import mongoose from 'mongoose';
import { Event } from '../../event/schemas/event.schema';
import { ApiProperty } from '@nestjs/swagger';

export type ParticipantDocument = Participant & Document;

@Schema({
  timestamps: true,
})
export class Participant {
  @ApiProperty({
    type: String,
    description: 'ID of the event being participated in',
    required: true,
  })
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true })
  event: Event;

  @ApiProperty({
    type: String,
    description: 'Name of the participant',
    example: 'John Doe',
    required: true,
  })
  @Prop({ required: true, trim: true })
  username: string;

  @ApiProperty({
    type: String,
    description: 'Email address of the participant',
    example: 'john.doe@example.com',
    required: true,
  })
  @Prop({ required: true, trim: true })
  email: string;

  @ApiProperty({
    type: String,
    description: 'Contact phone number of the participant',
    example: '+1-234-567-8900',
    required: true,
  })
  @Prop({ required: true, trim: true })
  phoneNumber: string;
}

export const ParticipantSchema = SchemaFactory.createForClass(Participant);
