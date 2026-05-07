import { PrismaClient } from '@prisma/client';
import { TournamentRepository } from '../../../domain/repositories/TournamentRepository.js';
import { Tournament } from '../../../domain/entities/Tournament.js';
import { TournamentMapper } from '../mappers/TournamentMapper.js';

export class PrismaTournamentRepository implements TournamentRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async create(tournament: Tournament): Promise<void> {
        const data = TournamentMapper.toPersistence(tournament);
        await this.prisma.tournament.create({ data });
    }

    async update(tournament: Tournament): Promise<void> {
        const data = TournamentMapper.toPersistence(tournament);
        await this.prisma.tournament.update({
            where: { id: tournament.getId() },
            data,
        });
    }

    async delete(id: string): Promise<void> {
        await this.prisma.tournament.delete({
            where: { id }
        });
    }

    async findAll(): Promise<Tournament[]> {
        const tournamentsData = await this.prisma.tournament.findMany();
        return tournamentsData.map(TournamentMapper.toDomain);
    }

    async findById(id: string): Promise<Tournament | null> {
        const tournamentsData = await this.prisma.tournament.findUnique({
            where: { id }
        });
        return tournamentsData ? TournamentMapper.toDomain(tournamentsData) : null;
    }
}
