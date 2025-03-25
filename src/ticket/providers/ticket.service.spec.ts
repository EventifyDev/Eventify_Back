import { Test, TestingModule } from '@nestjs/testing';
import { TicketService } from './ticket.service';
import { TicketRepository } from '../repositories/ticket.repository';
import { CreateTicketDto } from '../dtos/create-ticket.dto';
import { UpdateTicketDto } from '../dtos/update-ticket.dto';
import { PurchaseTicketDto } from '../dtos/purchase-ticket.dto';
import { TicketDocument } from '../schemas/ticket.schema';
import { TicketType } from '../enums/ticket-type.enum';
import { TicketStatus } from '../enums/ticket-status.enum';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('TicketService', () => {
  let service: TicketService;
  let repository: TicketRepository;

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
      providers: [
        TicketService,
        {
          provide: TicketRepository,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findById: jest.fn(),
            findByEventId: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            updateTicketStatus: jest.fn(),
            findAvailableTicketsForEvent: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TicketService>(TicketService);
    repository = module.get<TicketRepository>(TicketRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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

      jest.spyOn(repository, 'create').mockResolvedValue(mockTicket);

      const result = await service.createTicket(createTicketDto);

      expect(repository.create).toHaveBeenCalledWith(createTicketDto);
      expect(result).toEqual(mockTicket);
    });
  });

  describe('getAllTickets', () => {
    it('should return all tickets', async () => {
      jest.spyOn(repository, 'findAll').mockResolvedValue(mockTickets);

      const result = await service.getAllTickets();

      expect(repository.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockTickets);
    });
  });

  describe('getTicketById', () => {
    it('should return a ticket by ID', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(mockTicket);

      const result = await service.getTicketById('ticket-id-1');

      expect(repository.findById).toHaveBeenCalledWith('ticket-id-1');
      expect(result).toEqual(mockTicket);
    });

    it('should throw NotFoundException if ticket not found', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(null);

      await expect(service.getTicketById('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getTicketsByEventId', () => {
    it('should return tickets for an event', async () => {
      jest.spyOn(repository, 'findByEventId').mockResolvedValue(mockTickets);

      const result = await service.getTicketsByEventId('event-id-1');

      expect(repository.findByEventId).toHaveBeenCalledWith('event-id-1');
      expect(result).toEqual(mockTickets);
    });
  });

  describe('updateTicket', () => {
    it('should update a ticket', async () => {
      const updateTicketDto: UpdateTicketDto = {
        price: 150,
      };

      const updatedTicket = { ...mockTicket, price: 150 };

      jest
        .spyOn(repository, 'update')
        .mockResolvedValue(updatedTicket as TicketDocument);

      const result = await service.updateTicket('ticket-id-1', updateTicketDto);

      expect(repository.update).toHaveBeenCalledWith(
        'ticket-id-1',
        updateTicketDto,
      );
      expect(result).toEqual(updatedTicket);
    });
  });

  describe('deleteTicket', () => {
    it('should delete a ticket', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(mockTicket);
      jest.spyOn(repository, 'delete').mockResolvedValue(true);

      const result = await service.deleteTicket('ticket-id-1');

      expect(repository.findById).toHaveBeenCalledWith('ticket-id-1');
      expect(repository.delete).toHaveBeenCalledWith('ticket-id-1');
      expect(result).toBe(true);
    });

    it('should throw BadRequestException if ticket is sold', async () => {
      const soldTicket = { ...mockTicket, status: TicketStatus.SOLD };
      jest
        .spyOn(repository, 'findById')
        .mockResolvedValue(soldTicket as TicketDocument);

      await expect(service.deleteTicket('ticket-id-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if ticket not found', async () => {
      jest.spyOn(repository, 'findById').mockResolvedValue(null);

      await expect(service.deleteTicket('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
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

      jest.spyOn(repository, 'findById').mockResolvedValue(mockTicket);
      jest
        .spyOn(repository, 'updateTicketStatus')
        .mockResolvedValue(purchasedTicket as TicketDocument);

      const result = await service.purchaseTicket(purchaseTicketDto);

      expect(repository.findById).toHaveBeenCalledWith('ticket-id-1');
      expect(repository.updateTicketStatus).toHaveBeenCalledWith(
        'ticket-id-1',
        TicketStatus.SOLD,
      );
      expect(result).toEqual(purchasedTicket);
    });

    it('should throw BadRequestException if ticket is not available', async () => {
      const purchaseTicketDto: PurchaseTicketDto = {
        ticketId: 'ticket-id-1',
        userId: 'user-id-1',
      };

      const reservedTicket = { ...mockTicket, status: TicketStatus.RESERVED };
      jest
        .spyOn(repository, 'findById')
        .mockResolvedValue(reservedTicket as TicketDocument);

      await expect(service.purchaseTicket(purchaseTicketDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(repository.updateTicketStatus).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if not enough tickets available', async () => {
      const purchaseTicketDto: PurchaseTicketDto = {
        ticketId: 'ticket-id-1',
        userId: 'user-id-1',
        quantity: 101, // More than available
      };

      jest.spyOn(repository, 'findById').mockResolvedValue(mockTicket);

      await expect(service.purchaseTicket(purchaseTicketDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(repository.updateTicketStatus).not.toHaveBeenCalled();
    });
  });

  describe('getAvailableTicketsForEvent', () => {
    it('should return available tickets for an event', async () => {
      const availableTickets = mockTickets.filter(
        (ticket) => ticket.status === TicketStatus.AVAILABLE,
      );

      jest
        .spyOn(repository, 'findAvailableTicketsForEvent')
        .mockResolvedValue(availableTickets);

      const result = await service.getAvailableTicketsForEvent('event-id-1');

      expect(repository.findAvailableTicketsForEvent).toHaveBeenCalledWith(
        'event-id-1',
      );
      expect(result).toEqual(availableTickets);
    });
  });
});
