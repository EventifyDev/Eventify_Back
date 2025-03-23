import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { TicketType } from '../enums/ticket-type.enum';
import { TicketStatus } from '../enums/ticket-status.enum';

export type TicketDocument = Ticket & Document;

@Schema({ timestamps: true })
export class Ticket {
  @Prop({ required: true })
  @ApiProperty({ description: 'Ticket name/description' })
  name: string;

  @Prop({ required: true })
  @ApiProperty({ description: 'Ticket description' })
  description: string;

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

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  @ApiProperty({
    description: 'User who purchased the ticket',
    required: false,
  })
  owner: string;

  @Prop()
  @ApiProperty({ description: 'QR code data for ticket validation' })
  qrCode: string;

  @Prop({ default: 0 })
  @ApiProperty({ description: 'Number of times the ticket has been validated' })
  validationCount: number;

  @Prop({ default: false })
  @ApiProperty({
    description: 'Whether the ticket can be transferred to another user',
  })
  transferable: boolean;

  @Prop()
  @ApiProperty({
    description: 'Date when the ticket was sold',
    required: false,
  })
  soldAt: Date;

  @Prop({ type: Object })
  @ApiProperty({
    description: 'Additional metadata for custom ticket types',
    required: false,
  })
  metadata: Record<string, any>;

  @Prop({ default: 1 })
  @ApiProperty({ description: 'Maximum quantity of tickets that can be sold' })
  quantity: number;

  @Prop({ default: 0 })
  @ApiProperty({ description: 'Quantity of tickets sold' })
  soldQuantity: number;

  @Prop()
  @ApiProperty({ description: 'Expiration date of the ticket' })
  expiresAt: Date;
}

export const TicketSchema = SchemaFactory.createForClass(Ticket);
