import { Payment } from '../schemas/payment.schema';
import { CreatePaymentDto } from '../dtos/create-payment.dto';
// import { WebhookPayloadDto } from '../dtos/webhook-payload.dto';

export interface IPaymentService {
  createPayment(createPaymentDto: CreatePaymentDto): Promise<Payment>;
  getPaymentById(id: string): Promise<Payment>;
  getPaymentsByUserId(userId: string): Promise<Payment[]>;
  getPaymentsByEventId(eventId: string): Promise<Payment[]>;
  // handleWebhook(webhookPayloadDto: WebhookPayloadDto): Promise<void>;
  cancelPayment(id: string): Promise<Payment>;
}
