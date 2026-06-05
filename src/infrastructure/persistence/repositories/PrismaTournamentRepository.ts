import { PrismaClient } from '@prisma/client';
import { ITournamentRepository } from '../../../domain/ports/repositories/ITournamentRepository.js';
import { Tournament, TournamentStatus } from '../../../domain/entities/Tournament.js';
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

    async findAll(includeDeleted?: boolean): Promise<Tournament[]> {
        const whereClause: any = {};
        if (includeDeleted) {
            whereClause.status = { not: TournamentStatus.DELETED };
        }

        const tournamentsData = await this.client.tournament.findMany({
            where: whereClause,
            orderBy: { infoDateTime: 'desc' },
        });
        return tournamentsData.map(TournamentMapper.toDomain);
    }

    async findById(id: string, includeDeleted?: boolean): Promise<Tournament | null> {
        const whereClause: any = { id };
        if (!includeDeleted) {
            whereClause.status = { not: TournamentStatus.DELETED };
        }

        const tournamentData = await this.client.tournament.findFirst({
            where: whereClause,
        });

        return tournamentData ? TournamentMapper.toDomain(tournamentData) : null;
    }
}
