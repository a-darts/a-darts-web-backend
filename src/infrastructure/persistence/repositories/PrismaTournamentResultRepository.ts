import { PrismaClient } from '@prisma/client';
import { TournamentResult } from '../../../domain/entities/TournamentResult.js';
import { TournamentResultRepository } from '../../../domain/repositories/TournamentResultRepository.js';
import { ResultMapper } from '../mappers/ResultMapper.js';

export class PrismaTournamentResultRepository implements TournamentResultRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async create(result: TournamentResult): Promise<void> {
        await this.prisma.tournamentResult.create({
            data: ResultMapper.toPersistence(result)
        });
    }

    async createMany(results: TournamentResult[]): Promise<void> {
        if (results.length === 0) return;
        await this.prisma.tournamentResult.createMany({
            data: results.map(r => ResultMapper.toPersistence(r))
        });
    }

    async findByTournamentId(tournamentId: string): Promise<TournamentResult[]> {
        const results = await this.prisma.tournamentResult.findMany({
            where: { tournamentId },
            orderBy: { finalPosition: 'asc' }
        });
        return results.map(ResultMapper.toDomain);
    }
}
