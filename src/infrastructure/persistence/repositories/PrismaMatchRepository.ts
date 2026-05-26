import { PrismaClient } from '@prisma/client';
import { Match } from '../../../domain/entities/Match.js';
import { MatchMapper } from '../mappers/MatchMapper.js';
import { RegisteredParticipantMapper } from '../mappers/RegisteredParticipantMapper.js';
import { MatchRepository, MatchWithParticipants } from '../../../domain/repositories/MatchRepository.js';
import { transactionStorage } from '../TransactionContext.js';

export class PrismaMatchRepository implements MatchRepository {
    constructor(private readonly prisma: PrismaClient) { }

    private get client() {
        const tx = transactionStorage.getStore();
        if (tx) {
            return tx;
        }
        return this.prisma;
    }

    async create(match: Match): Promise<void> {
        const data = MatchMapper.toPersistence(match);
        await this.client.match.create({ data });
    }

    async update(match: Match): Promise<void> {
        const data = MatchMapper.toPersistence(match);
        await this.client.match.update({
            where: { id: match.getId() },
            data,
        });
    }

    async delete(id: string): Promise<void> {
        await this.client.match.delete({
            where: { id }
        });
    }

    async findAll(): Promise<Match[]> {
        const matchesData = await this.client.match.findMany({
            include: {
                board: true,
            },
        });
        return matchesData.map(MatchMapper.toDomain);
    }

    async findById(id: string): Promise<Match | null> {
        const matchData = await this.client.match.findUnique({
            where: { id },
            include: {
                board: true,
            },
        });
        return matchData ? MatchMapper.toDomain(matchData) : null;
    }

    async findByIdWithParticipants(id: string): Promise<MatchWithParticipants | null> {
        const matchesData = await this.client.match.findUnique({
            where: { id },
            include: {
                participant1: {
                    include: { player: { include: { user: true } } }
                },
                participant2: {
                    include: { player: { include: { user: true } } }
                },
                board: true,
            },
        });
        if (!matchesData) return null;

        return {
            match: MatchMapper.toDomain(matchesData),
            participant1: matchesData.participant1 ? RegisteredParticipantMapper.toDomain(matchesData.participant1) : null,
            participant2: matchesData.participant2 ? RegisteredParticipantMapper.toDomain(matchesData.participant2) : null,
        };
    }

    async findManyByIds(ids: string[]): Promise<Match[]> {
        const matchesData = await this.client.match.findMany({
            where: { id: { in: ids } },
            include: {
                board: true,
            },
        });
        return matchesData.map(MatchMapper.toDomain);
    }

    async findByParticipantsIdsAndTournamentId(participant1Id: string, participant2Id: string, tournamentId: string): Promise<Match | null> {
        const matchData = await this.client.match.findFirst({
            where: {
                tournamentId: tournamentId,
                OR: [
                    {
                        participant1Id: participant1Id,
                        participant2Id: participant2Id,
                    },
                    {
                        participant1Id: participant2Id,
                        participant2Id: participant1Id,
                    },
                ],
            },
            include: {
                board: true,
            },
        });
        return matchData ? MatchMapper.toDomain(matchData) : null;
    }

    async findManyByTournamentId(tournamentId: string): Promise<Match[]> {
        const matchesData = await this.client.match.findMany({
            where: { tournamentId: tournamentId },
            include: {
                board: true,
            },
        });

        return matchesData.map(data => MatchMapper.toDomain(data));
    }

    async findManyByTournamentIdWithParticipants(tournamentId: string): Promise<MatchWithParticipants[]> {
        const matchesData = await this.client.match.findMany({
            where: { tournamentId: tournamentId },
            include: {
                participant1: {
                    include: { player: { include: { user: true } } }
                },
                participant2: {
                    include: { player: { include: { user: true } } }
                },
                board: true,
            },

        });

        return matchesData.map(data => ({
            match: MatchMapper.toDomain(data),
            participant1: data.participant1 ? RegisteredParticipantMapper.toDomain(data.participant1) : null,
            participant2: data.participant2 ? RegisteredParticipantMapper.toDomain(data.participant2) : null,
        }));
    }

    async findByTournamentRoundAndMatchIndex(tournamentId: string, round: number, matchIndex: number): Promise<Match | null> {
        const matchData = await this.client.match.findFirst({
            where: {
                tournamentId: tournamentId,
                round: round,
                matchIndex: matchIndex,
            },
            include: {
                board: true,
            },
        });
        return matchData ? MatchMapper.toDomain(matchData) : null;
    }
}
