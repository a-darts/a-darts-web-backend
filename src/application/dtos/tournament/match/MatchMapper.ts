import { Match } from '../../../../domain/entities/Match.js';
import { MatchResponseDTO } from './MatchDTOs.js';

export class MatchMapper {
    public static toResponse(match: Match): MatchResponseDTO {
        const participant1Score = match.getMatchScore().getScoreForParticipant(match.getParticipant1Id());
        const participant2Score = match.getMatchScore().getScoreForParticipant(match.getParticipant2Id());

        const matchData = {
            id: match.getId(),
            round: match.getRound(),
            boardNumber: match.getBoardNumber(),
            startedAt: match.getStartedAt(),
            finishedAt: match.getFinishedAt(),
            status: match.getStatus(),
            participant1Id: match.getParticipant1Id(),
            participant2Id: match.getParticipant2Id(),
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
