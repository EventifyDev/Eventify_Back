import { Payment } from '../schemas/payment.schema';
import { PaymentStatus } from '../enums/payment-status.enum';

export interface IPaymentRepository {
  create(payment: Partial<Payment>): Promise<Payment>;
  findById(id: string): Promise<Payment>;
  findByProviderTransactionId(providerTransactionId: string): Promise<Payment>;
  updateStatus(
    id: string,
    status: PaymentStatus,
    additionalData?: Partial<Payment>,
  ): Promise<Payment>;
  findByTicketId(ticketId: string): Promise<Payment[]>;
  findByUserId(userId: string): Promise<Payment[]>;
  findByEventId(eventId: string): Promise<Payment[]>;
}
