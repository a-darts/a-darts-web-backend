import { Match } from '../../../../domain/entities/Match.js';
import { RegisteredParticipant } from '../../../../domain/entities/Participant.js';
import { MatchResponseDTO } from './MatchDTOs.js';

export class MatchMapper {
    public static toResponse(
        match: Match,
        participant1: RegisteredParticipant,
        participant2: RegisteredParticipant,
    ): MatchResponseDTO {
        const participant1Score = match.getMatchScore().getScoreForParticipant(match.getParticipant1Id());
        const participant2Score = match.getMatchScore().getScoreForParticipant(match.getParticipant2Id());

        const matchData = {
            id: match.getId(),
            round: match.getRound(),
            boardNumber: match.getBoardNumber(),
            startedAt: match.getStartedAt(),
            finishedAt: match.getFinishedAt(),
            status: match.getStatus(),
            participant1Id: participant1.getId(),
            participant1Alias: participant1.getAlias(),
            participant1Federation: participant1.getFederation(),
            participant2Id: participant2.getId(),
            participant2Alias: participant2.getAlias(),
            participant2Federation: participant2.getFederation(),
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
