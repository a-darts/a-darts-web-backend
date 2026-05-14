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
                    // Si es Bye, el ID es null y el nombre es "Bye"
                    participantId: pos.isBye() ? null : participant.getId(),
                    // participantAlias: pos.isBye() ? 'Bye' : (participant as any).getAlias(),
                    participantAlias: 'Prueba', // MIRAR CAMBIAR
                };
            }).sort((a, b) => a.position - b.position) // Ordenado por posicion
        };
    }
}
