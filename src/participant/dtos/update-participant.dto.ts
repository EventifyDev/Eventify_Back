import { CreateParticipantDto } from './create-participant.dto';
import { PartialType } from '@nestjs/swagger';

export class UpdateParticipantDto extends PartialType(CreateParticipantDto) {}
