import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '../enums/payment-status.enum';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @ApiProperty({ description: 'Unique identifier for the payment' })
  @Prop({ required: true, unique: true })
  paymentId: string;

  @ApiProperty({ description: 'Ticket ID associated with this payment' })
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Ticket' })
  ticketId: string;

  @ApiProperty({ description: 'User ID who made the payment' })
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userId: string;

  @ApiProperty({ description: 'Event ID associated with this payment' })
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'Event' })
  eventId: string;

  @ApiProperty({ description: 'Payment amount' })
  @Prop({ required: true })
  amount: number;

  @ApiProperty({ description: 'Payment status' })
  @Prop({ required: true, enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @ApiProperty({ description: 'Payment provider transaction ID' })
  @Prop({ required: true })
  providerTransactionId: string;

  @ApiProperty({ description: 'Checkout URL for the payment' })
  @Prop({ required: true })
  checkoutUrl: string;

  @ApiProperty({ description: 'Redirect URL after payment completion' })
  @Prop({ required: true })
  redirectUrl: string;

  @ApiProperty({ description: 'Additional payment metadata' })
  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @ApiProperty({ description: 'Payment creation date' })
  @Prop({ required: true })
  createdAt: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
