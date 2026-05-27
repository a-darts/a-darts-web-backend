import { Match } from '../../../../domain/entities/Match.js';
import { RegisteredParticipant } from '../../../../domain/entities/Participant.js';
import { MatchWithParticipants } from '../../../../domain/repositories/MatchRepository.js';
import { MatchResponseDTO } from './MatchDTOs.js';

export class MatchMapper {
    public static toResponse(
        matchData: MatchWithParticipants,
    ): MatchResponseDTO {
        const { match, participant1, participant2, board } = matchData;

        const participant1Score = match.getMatchScore().getParticipant1Score();
        const participant2Score = match.getMatchScore().getParticipant2Score();

        return {
            id: match.getId(),
            round: match.getRound(),
            matchIndex: match.getMatchIndex(),
            boardNumber: match.getBoardNumber(),
            boardId: board?.getId() ?? null,
            boardShortId: board?.getShortId() ?? null,
            startedAt: match.getStartedAt(),
            finishedAt: match.getFinishedAt(),
            status: match.getStatus(),
            tournamentId: match.getTournamentId(),
            participant1: this.mapParticipant(
                participant1,
                match.getIsParticipant1Bye()
            ),
            participant2: this.mapParticipant(
                participant2,
                match.getIsParticipant2Bye()
            ),
            matchScore: {
                participant1: {
                    setsWon: participant1Score.getSetsWon(),
                    legsWon: participant1Score.getLegsWon(),
                },
                participant2: {
                    setsWon: participant2Score.getSetsWon(),
                    legsWon: participant2Score.getLegsWon(),
                },
            },
        };
    }


    /**
     * Helper encargado de discernir si el espacio vacío de la BD 
     * representa un Bye confirmado o un hueco que espera rival.
     */
    private static mapParticipant(
        participant: RegisteredParticipant | null,
        isBye: boolean
    ) {
        // Escenario A: Es un participante real
        if (participant) {
            return {
                id: participant.getId(),
                alias: participant.getAlias(),
                federation: participant.getFederation(),
            };
        }

        // Escenario B: Es un BYE
        if (isBye) {
            return {
                id: null,
                alias: 'Bye',
                federation: 'N/A',
            };
        }

        // Escenario C: Es NULL en la BD y NO es un Bye (pendiente de asignar)
        return {
            id: null,
            alias: 'Por determinar',
            federation: 'N/A',
        };
    }
}
