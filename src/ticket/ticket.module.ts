import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TicketController } from './controllers/ticket.controller';
import { TicketService } from './providers/ticket.service';
import { TicketRepository } from './repositories/ticket.repository';
import { Ticket, TicketSchema } from './schemas/ticket.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Ticket.name, schema: TicketSchema }]),
  ],
  controllers: [TicketController],
  providers: [TicketService, TicketRepository],
  exports: [TicketService],
})
export class TicketModule {}
