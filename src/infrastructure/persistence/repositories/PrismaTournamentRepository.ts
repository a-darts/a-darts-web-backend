import { PrismaClient } from '@prisma/client';
import { ITournamentRepository, TournamentFilter } from '../../../domain/ports/repositories/ITournamentRepository.js';
import { Tournament } from '../../../domain/entities/Tournament.js';
import { TournamentMapper } from '../mappers/TournamentMapper.js';
import { transactionStorage } from '../TransactionContext.js';

export class PrismaTournamentRepository implements ITournamentRepository {
    constructor(private readonly prisma: PrismaClient) { }

    private get client() {
        const tx = transactionStorage.getStore();
        if (tx) {
            return tx;
        }
        return this.prisma;
    }

    async create(tournament: Tournament): Promise<void> {
        const data = TournamentMapper.toPersistence(tournament);
        await this.client.tournament.create({ data });
    }

    async update(tournament: Tournament): Promise<void> {
        const data = TournamentMapper.toPersistence(tournament);
        await this.client.tournament.update({
            where: { id: tournament.getId() },
            data,
        });
    }

    async delete(id: string): Promise<void> {
        await this.client.tournament.delete({
            where: { id }
        });
    }

    async findAll(filter?: TournamentFilter): Promise<Tournament[]> {
        const whereClause: any = {};
        if (!filter?.includeDeleted) {
            whereClause.status = { not: 'DELETED' };
        }

        const tournamentsData = await this.client.tournament.findMany({
            where: whereClause,
            orderBy: { infoDateTime: 'desc' },
        });
        return tournamentsData.map(TournamentMapper.toDomain);
    }

    async findById(id: string): Promise<Tournament | null> {
        const tournamentData = await this.client.tournament.findUnique({
            where: {
                id,
                status: { not: 'DELETED' },
            },
        });
        return tournamentData ? TournamentMapper.toDomain(tournamentData) : null;
    }
}
