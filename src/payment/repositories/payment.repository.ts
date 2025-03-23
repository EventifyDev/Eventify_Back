import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from '../schemas/payment.schema';
import { IPaymentRepository } from '../interfaces/payment.repository.interface';
import { PaymentStatus } from '../enums/payment-status.enum';

@Injectable()
export class PaymentRepository implements IPaymentRepository {
  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
  ) {}

  async create(payment: Partial<Payment>): Promise<Payment> {
    const createdPayment = new this.paymentModel(payment);
    return createdPayment.save();
  }

  async findById(id: string): Promise<Payment> {
    return this.paymentModel.findById(id).exec();
  }

  async findByProviderTransactionId(
    providerTransactionId: string,
  ): Promise<Payment> {
    return this.paymentModel.findOne({ providerTransactionId }).exec();
  }

  async updateStatus(
    id: string,
    status: PaymentStatus,
    additionalData?: Partial<Payment>,
  ): Promise<Payment> {
    const updateData = { status, ...additionalData };

    // Add timestamp based on status
    if (status === PaymentStatus.PAID) {
      updateData['paidAt'] = new Date();
    } else if (status === PaymentStatus.CANCELED) {
      updateData['canceledAt'] = new Date();
    }

    return this.paymentModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .exec();
  }

  async findByTicketId(ticketId: string): Promise<Payment[]> {
    return this.paymentModel.find({ ticketId }).exec();
  }

  async findByUserId(userId: string): Promise<Payment[]> {
    return this.paymentModel.find({ userId }).exec();
  }

  async findByEventId(eventId: string): Promise<Payment[]> {
    return this.paymentModel.find({ eventId }).exec();
  }
}
