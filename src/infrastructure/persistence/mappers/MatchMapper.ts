import { MatchStatus as PrismaMatchStatus, Match as PrismaMatch, Board as PrismaBoard } from '@prisma/client';
import { Match, MatchStatus } from '../../../domain/entities/Match.js';
import { prisma } from '../client.js';

export class MatchMapper {
    // From Domain Entity to Prisma Object
    static toPersistence(match: Match) {
        const score = match.getMatchScore();
        return {
            id: match.getId(),
            round: match.getRound(),
            matchIndex: match.getMatchIndex(),
            startedAt: match.getStartedAt(),
            finishedAt: match.getFinishedAt(),
            status: match.getStatus() as PrismaMatchStatus,
            participant1Id: match.getParticipant1Id(),
            participant2Id: match.getParticipant2Id(),
            isParticipant1Bye: match.getIsParticipant1Bye(),
            isParticipant2Bye: match.getIsParticipant2Bye(),
            matchScoreParticipant1SetsWon: score.getParticipant1Score().getSetsWon(),
            matchScoreParticipant1LegsWon: score.getParticipant1Score().getLegsWon(),
            matchScoreParticipant2SetsWon: score.getParticipant2Score().getSetsWon(),
            matchScoreParticipant2LegsWon: score.getParticipant2Score().getLegsWon(),
            tournamentId: match.getTournamentId(),
        };
    }

    // From Prisma Object to Domain Entity
    static toDomain(prismaMatch: PrismaMatch & { board?: PrismaBoard | null; }): Match {
        return Match.rehydrate({
            id: prismaMatch.id,
            round: prismaMatch.round,
            matchIndex: prismaMatch.matchIndex,
            boardNumber: prismaMatch.board?.number ?? null,
            startedAt: prismaMatch.startedAt,
            finishedAt: prismaMatch.finishedAt,
            status: prismaMatch.status as MatchStatus,
            participant1Id: prismaMatch.participant1Id,
            participant2Id: prismaMatch.participant2Id,
            isParticipant1Bye: prismaMatch.isParticipant1Bye,
            isParticipant2Bye: prismaMatch.isParticipant2Bye,
            matchScore: {
                participant1: {
                    setsWon: prismaMatch.matchScoreParticipant1SetsWon,
                    legsWon: prismaMatch.matchScoreParticipant1LegsWon,
                },
                participant2: {
                    setsWon: prismaMatch.matchScoreParticipant2SetsWon,
                    legsWon: prismaMatch.matchScoreParticipant2LegsWon,
                },
            },
            tournamentId: prismaMatch.tournamentId,
        });
    }
}
