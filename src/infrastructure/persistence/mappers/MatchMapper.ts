import { MatchStatus as PrismaMatchStatus, Match as PrismaMatch, Board as PrismaBoard, ParticipantTypes as PrismaParticipantTypes } from '@prisma/client';
import { Match, MatchStatus } from '../../../domain/entities/Match.js';
import { prisma } from '../prismaClient.js';
import { Board } from '../../../domain/entities/PlayingArea.js';
import { ParticipantTypes } from '../../../domain/entities/Participant.js';

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
            participant1Type: match.getParticipant1Type() as unknown as PrismaParticipantTypes,
            participant2Type: match.getParticipant2Type() as unknown as PrismaParticipantTypes,
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
            boardId: prismaMatch.board?.id ?? null,
            boardShortId: prismaMatch.board?.shortId ?? null,
            startedAt: prismaMatch.startedAt,
            finishedAt: prismaMatch.finishedAt,
            status: prismaMatch.status as MatchStatus,
            participant1Id: prismaMatch.participant1Id,
            participant2Id: prismaMatch.participant2Id,
            participant1Type: prismaMatch.participant1Type as unknown as ParticipantTypes,
            participant2Type: prismaMatch.participant2Type as unknown as ParticipantTypes,
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
