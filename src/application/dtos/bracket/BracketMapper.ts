import { Bracket } from '../../../domain/entities/Bracket.js';
import { BracketResponseDTO } from './BracketDTOs.js';

export class BracketMapper {
    public static toResponse(bracket: Bracket): BracketResponseDTO {
        return {
            id: bracket.getId(),
            tournamentId: bracket.getTournamentId(),
            status: bracket.getStatus(),
            totalPositions: bracket.getPositions().length,
            positions: bracket.getPositions().map(pos => {
                const participant = pos.getParticipant();

                return {
                    position: pos.getPosition(),
                    participantId: participant.getId(),
                    participantAlias: participant.getAlias(),
                    participantFederation: participant.getFederation(),
                };
            }).sort((a, b) => a.position - b.position) // Ordenado por posicion
        };
    }
}
