import { RegisteredParticipant } from '../../../domain/entities/Participant.js';
import { RegisteredParticipantResponseDTO } from './RegisteredParticipantDTOs.js';

export class RegisteredParticipantMapper {
    public static toResponse(registeredParticipant: RegisteredParticipant): RegisteredParticipantResponseDTO {
        return {
            id: registeredParticipant.getId(),
            playerId: registeredParticipant.getPlayerId(),
            registeredAt: registeredParticipant.getRegisteredAt(),
            checkedInAt: registeredParticipant.getCheckedInAt(),
            alias: registeredParticipant.getAlias(),
            federation: registeredParticipant.getFederation(),
        };
    }
}
