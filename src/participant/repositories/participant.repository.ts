import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { IParticipantRepository } from '../interfaces/participant.repository.interface';
import { Participant } from '../schemas/participant.schema';
import { CreateParticipantDto } from '../dtos/create-participant.dto';
import { UpdateParticipantDto } from '../dtos/update-participant.dto';

@Injectable()
export class ParticipantRepository implements IParticipantRepository {
  constructor(
    @InjectModel(Participant.name)
    private readonly participantModel: Model<Participant>,
  ) {}

  async create(
    createParticipantDto: CreateParticipantDto,
  ): Promise<Participant> {
    const { eventId, username, email, phoneNumber } = createParticipantDto;

    const participant = new this.participantModel({
      event: new Types.ObjectId(eventId),
      username,
      email: email.toLowerCase(),
      phoneNumber,
    });

    return await participant.save();
  }

  async update(
    id: string,
    updateParticipantDto: UpdateParticipantDto,
  ): Promise<Participant | null> {
    const participant = await this.participantModel
      .findByIdAndUpdate(id, { $set: updateParticipantDto }, { new: true })
      .populate('event', 'name date')
      .exec();

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    return participant;
  }

  async findById(id: string): Promise<Participant | null> {
    return this.participantModel
      .findById(id)
      .populate('event', 'name date')
      .exec();
  }

  async findByEventId(eventId: string): Promise<Participant[]> {
    return this.participantModel
      .find({ event: eventId })
      .populate('event', 'name date')
      .exec();
  }

  async findByEmail(
    email: string,
    eventId: string,
  ): Promise<Participant | null> {
    return this.participantModel.findOne({ email, event: eventId }).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.participantModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException('Participant not found');
    }
    return true;
  }

  async getParticipantCount(eventId?: string): Promise<number> {
    const filter = eventId ? { event: new Types.ObjectId(eventId) } : {};

    return this.participantModel.countDocuments(filter).exec();
  }
}
