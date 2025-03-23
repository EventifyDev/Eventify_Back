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

  @ApiProperty({ description: 'Payment currency' })
  @Prop({ required: true, default: 'EUR' })
  currency: string;

  @ApiProperty({ description: 'Payment description' })
  @Prop({ required: true })
  description: string;

  @ApiProperty({ description: 'Payment status' })
  @Prop({ required: true, enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @ApiProperty({ description: 'Payment provider (e.g., Mollie)' })
  @Prop({ required: true, default: 'mollie' })
  provider: string;

  @ApiProperty({ description: 'Payment provider transaction ID' })
  @Prop({ required: true })
  providerTransactionId: string;

  @ApiProperty({ description: 'Checkout URL for the payment' })
  @Prop()
  checkoutUrl: string;

  @ApiProperty({ description: 'Redirect URL after payment' })
  @Prop({ required: true })
  redirectUrl: string;

  @ApiProperty({ description: 'Webhook URL for payment notifications' })
  @Prop({ required: true })
  webhookUrl: string;

  @ApiProperty({ description: 'Payment metadata' })
  @Prop({ type: Object })
  metadata: Record<string, any>;

  @ApiProperty({ description: 'Payment creation date' })
  @Prop()
  createdAt: Date;

  @ApiProperty({ description: 'Payment last update date' })
  @Prop()
  updatedAt: Date;

  @ApiProperty({ description: 'Payment completion date' })
  @Prop()
  paidAt: Date;

  @ApiProperty({ description: 'Payment cancellation date' })
  @Prop()
  canceledAt: Date;

  @ApiProperty({ description: 'Payment expiration date' })
  @Prop()
  expiresAt: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
