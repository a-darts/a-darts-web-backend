import { Match } from '../../../../domain/entities/Match.js';
import { ParticipantTypes, RegisteredParticipant } from '../../../../domain/entities/Participant.js';
import { RegistratedParticipantsTypesException } from '../../../../domain/exceptions/ParticipantExceptions.js';
import { MatchWithParticipants } from '../../../../domain/repositories/IMatchRepository.js';
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
            boardNumber: board?.getNumber() ?? null,
            boardId: board?.getId() ?? null,
            boardShortId: board?.getShortId() ?? null,
            startedAt: match.getStartedAt(),
            finishedAt: match.getFinishedAt(),
            status: match.getStatus(),
            tournamentId: match.getTournamentId(),
            participant1: this.mapParticipant(
                participant1,
                match.getParticipant1Type()
            ),
            participant2: this.mapParticipant(
                participant2,
                match.getParticipant2Type()
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
        participantType: ParticipantTypes,
    ) {
        // Escenario A: BYE confirmado
        if (participantType === ParticipantTypes.BYE) {
            return { id: null, alias: 'Bye', federation: 'N/A' };
        }

        // Escenario B: Slot vacío pendiente de asignar
        if (participantType === ParticipantTypes.EMPTY) {
            return { id: null, alias: 'Por determinar', federation: 'N/A' };
        }

        // Escenario C: Participante real
        if (participantType === ParticipantTypes.REGISTERED && participant) {
            return {
                id: participant.getId(),
                alias: participant.getAlias(),
                federation: participant.getFederation(),
            };
        }

        throw new RegistratedParticipantsTypesException();
    }
}
