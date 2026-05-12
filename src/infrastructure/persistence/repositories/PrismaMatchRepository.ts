import { PrismaClient } from '@prisma/client';
import { Match } from '../../../domain/entities/Match.js';
import { MatchMapper } from '../mappers/MatchMapper.js';
import { MatchRepository } from '../../../domain/repositories/MatchRepository.js';

export class PrismaMatchRepository implements MatchRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async create(match: Match): Promise<void> {
        const data = MatchMapper.toPersistence(match);
        await this.prisma.match.create({ data });
    }

    async update(match: Match): Promise<void> {
        const data = MatchMapper.toPersistence(match);
        await this.prisma.match.update({
            where: { id: match.getId() },
            data,
        });
    }

    async delete(id: string): Promise<void> {
        await this.prisma.match.delete({
            where: { id }
        });
    }

    async findAll(): Promise<Match[]> {
        const matchesData = await this.prisma.match.findMany();
        return matchesData.map(MatchMapper.toDomain);
    }

    async findById(id: string): Promise<Match | null> {
        const matchesData = await this.prisma.match.findUnique({
            where: { id }
        });
        return matchesData ? MatchMapper.toDomain(matchesData) : null;
    }

    async findManyByIds(ids: string[]): Promise<Match[]> {
        const matchesData = await this.prisma.match.findMany({
            where: { id: { in: ids } }
        });
        return matchesData.map(MatchMapper.toDomain);
    }

    async findByParticipantsIdsAndTournamentId(participant1Id: string, participant2Id: string, tournamentId: string): Promise<Match | null> {
        const matchData = await this.prisma.match.findFirst({
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
        });
        return matchData ? MatchMapper.toDomain(matchData) : null;
    }
}
