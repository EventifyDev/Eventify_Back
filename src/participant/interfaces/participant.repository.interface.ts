import { Participant } from '../schemas/participant.schema';
import { CreateParticipantDto } from '../dtos/create-participant.dto';
import { UpdateParticipantDto } from '../dtos/update-participant.dto';

export interface IParticipantRepository {
  create(createParticipantDto: CreateParticipantDto): Promise<Participant>;
  findByEventId(eventId: string): Promise<Participant[]>;
  findByEmail(email: string, eventId: string): Promise<Participant | null>;
  findById(id: string): Promise<Participant | null>;
  update(
    id: string,
    updateParticipantDto: UpdateParticipantDto,
  ): Promise<Participant | null>;
  delete(id: string): Promise<boolean>;
  getParticipantCount(eventId?: string): Promise<number>;
}
