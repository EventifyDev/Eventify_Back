import { Test, TestingModule } from '@nestjs/testing';
import { TicketController } from './ticket.controller';
import { TicketService } from '../providers/ticket.service';
import { CreateTicketDto } from '../dtos/create-ticket.dto';
import { UpdateTicketDto } from '../dtos/update-ticket.dto';
import { PurchaseTicketDto } from '../dtos/purchase-ticket.dto';
import { TicketDocument } from '../schemas/ticket.schema';
import { TicketType } from '../enums/ticket-type.enum';
import { TicketStatus } from '../enums/ticket-status.enum';

describe('TicketController', () => {
  let controller: TicketController;
  let ticketService: TicketService;

  const mockTicket = {
    _id: 'ticket-id-1',
    type: TicketType.STANDARD,
    price: 100,
    status: TicketStatus.AVAILABLE,
    event: 'event-id-1',
    quantity: 100,
    soldQuantity: 0,
  } as unknown as TicketDocument;

  const mockTickets = [
    mockTicket,
    {
      _id: 'ticket-id-2',
      type: TicketType.VIP,
      price: 200,
      status: TicketStatus.AVAILABLE,
      event: 'event-id-1',
      quantity: 50,
      soldQuantity: 0,
    } as unknown as TicketDocument,
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TicketController],
      providers: [
        {
          provide: TicketService,
          useValue: {
            createTicket: jest.fn(),
            getTicketsByEventId: jest.fn(),
            getAvailableTicketsForEvent: jest.fn(),
            updateTicket: jest.fn(),
            deleteTicket: jest.fn(),
            purchaseTicket: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TicketController>(TicketController);
    ticketService = module.get<TicketService>(TicketService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createTicket', () => {
    it('should create a ticket', async () => {
      const createTicketDto: CreateTicketDto = {
        type: TicketType.STANDARD,
        price: 100,
        status: TicketStatus.AVAILABLE,
        event: 'event-id-1',
        quantity: 100,
      };

      jest.spyOn(ticketService, 'createTicket').mockResolvedValue(mockTicket);

      const result = await controller.createTicket(createTicketDto);

      expect(ticketService.createTicket).toHaveBeenCalledWith(createTicketDto);
      expect(result).toEqual(mockTicket);
    });
  });

  describe('getTicketsByEventId', () => {
    it('should return tickets for an event', async () => {
      jest
        .spyOn(ticketService, 'getTicketsByEventId')
        .mockResolvedValue(mockTickets);

      const result = await controller.getTicketsByEventId('event-id-1');

      expect(ticketService.getTicketsByEventId).toHaveBeenCalledWith(
        'event-id-1',
      );
      expect(result).toEqual(mockTickets);
      expect(result.length).toBe(2);
    });
  });

  describe('getAvailableTicketsForEvent', () => {
    it('should return available tickets for an event', async () => {
      const availableTickets = mockTickets.filter(
        (ticket) => ticket.status === TicketStatus.AVAILABLE,
      );

      jest
        .spyOn(ticketService, 'getAvailableTicketsForEvent')
        .mockResolvedValue(availableTickets);

      const result = await controller.getAvailableTicketsForEvent('event-id-1');

      expect(ticketService.getAvailableTicketsForEvent).toHaveBeenCalledWith(
        'event-id-1',
      );
      expect(result).toEqual(availableTickets);
    });
  });

  describe('updateTicket', () => {
    it('should update a ticket', async () => {
      const updateTicketDto: UpdateTicketDto = {
        price: 150,
      };

      const updatedTicket = { ...mockTicket, price: 150 };

      jest
        .spyOn(ticketService, 'updateTicket')
        .mockResolvedValue(updatedTicket as TicketDocument);

      const result = await controller.updateTicket(
        'ticket-id-1',
        updateTicketDto,
      );

      expect(ticketService.updateTicket).toHaveBeenCalledWith(
        'ticket-id-1',
        updateTicketDto,
      );
      expect(result).toEqual(updatedTicket);
      expect(result.price).toBe(150);
    });
  });

  describe('deleteTicket', () => {
    it('should delete a ticket', async () => {
      jest.spyOn(ticketService, 'deleteTicket').mockResolvedValue(undefined);

      await controller.deleteTicket('ticket-id-1');

      expect(ticketService.deleteTicket).toHaveBeenCalledWith('ticket-id-1');
    });
  });

  describe('purchaseTicket', () => {
    it('should purchase a ticket', async () => {
      const purchaseTicketDto: PurchaseTicketDto = {
        ticketId: 'ticket-id-1',
        userId: 'user-id-1',
        quantity: 2,
      };

      const purchasedTicket = {
        ...mockTicket,
        status: TicketStatus.SOLD,
        soldQuantity: 2,
      };

      jest
        .spyOn(ticketService, 'purchaseTicket')
        .mockResolvedValue(purchasedTicket as TicketDocument);

      const result = await controller.purchaseTicket(purchaseTicketDto);

      expect(ticketService.purchaseTicket).toHaveBeenCalledWith(
        purchaseTicketDto,
      );
      expect(result).toEqual(purchasedTicket);
      expect(result.status).toBe(TicketStatus.SOLD);
      expect(result.soldQuantity).toBe(2);
    });
  });
});
