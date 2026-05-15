import { Match } from '../../../../domain/entities/Match.js';
import { RegisteredParticipant } from '../../../../domain/entities/Participant.js';
import { MatchWithParticipants } from '../../../../domain/repositories/MatchRepository.js';
import { MatchResponseDTO } from './MatchDTOs.js';

export class MatchMapper {
    public static toResponse(
        match: MatchWithParticipants,
    ): MatchResponseDTO {
        const participant1Score = match.match.getMatchScore().getParticipant1Score();
        const participant2Score = match.match.getMatchScore().getParticipant2Score();

        const matchData = {
            id: match.match.getId(),
            round: match.match.getRound(),
            boardNumber: match.match.getBoardNumber(),
            startedAt: match.match.getStartedAt(),
            finishedAt: match.match.getFinishedAt(),
            status: match.match.getStatus(),
            participant1: match.participant1 ? {
                id: match.participant1.getId(),
                alias: match.participant1.getAlias(),
                federation: match.participant1.getFederation(),
            } : {
                id: null,
                alias: 'Bye',
                federation: 'N/A',
            },
            participant2: match.participant2 ? {
                id: match.participant2.getId(),
                alias: match.participant2.getAlias(),
                federation: match.participant2.getFederation(),
            } : {
                id: null,
                alias: 'Bye',
                federation: 'N/A',
            },
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

        return matchData;
    }
}
