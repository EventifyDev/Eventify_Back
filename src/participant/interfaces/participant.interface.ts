import { Participant } from '../schemas/participant.schema';
import { CreateParticipantDto } from '../dtos/create-participant.dto';
import { UpdateParticipantDto } from '../dtos/update-participant.dto';

export interface IParticipantService {
  register(createParticipantDto: CreateParticipantDto): Promise<Participant>;
  update(
    id: string,
    updateParticipantDto: UpdateParticipantDto,
  ): Promise<Participant>;
  getEventParticipants(eventId: string): Promise<Participant[]>;
  cancelParticipation(id: string): Promise<boolean>;
}
