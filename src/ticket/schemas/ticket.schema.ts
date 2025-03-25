import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { TicketType } from '../enums/ticket-type.enum';
import { TicketStatus } from '../enums/ticket-status.enum';

export type TicketDocument = Ticket & Document;

@Schema({ timestamps: true })
export class Ticket {
  @Prop({ required: true, type: String, enum: TicketType })
  @ApiProperty({ enum: TicketType, description: 'Type of ticket' })
  type: TicketType;

  @Prop({ required: true })
  @ApiProperty({ description: 'Ticket price' })
  price: number;

  @Prop({
    required: true,
    type: String,
    enum: TicketStatus,
    default: TicketStatus.AVAILABLE,
  })
  @ApiProperty({ enum: TicketStatus, description: 'Current status of ticket' })
  status: TicketStatus;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Event', required: true })
  @ApiProperty({ description: 'Associated event ID' })
  event: string;

  @Prop({ required: true })
  @ApiProperty({ description: 'Maximum quantity of tickets that can be sold' })
  quantity: number;

  @Prop({ required: true, default: 0 })
  @ApiProperty({ description: 'Quantity of tickets sold' })
  soldQuantity: number;
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);
