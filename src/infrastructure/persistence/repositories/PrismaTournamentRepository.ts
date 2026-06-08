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

    async findAll(skip?: number, take?: number, statuses?: TournamentStatus[], federation?: string, mode?: string): Promise<Tournament[]> {
        const whereClause: any = {};
        if (statuses && statuses.length > 0) {
            whereClause.status = { in: statuses };
        }
        if (federation) {
            whereClause.infoFederation = federation;
        }
        if (mode) {
            whereClause.infoMode = mode;
        }

        const tournamentsData = await this.client.tournament.findMany({
            where: whereClause,
            skip,
            take,
            orderBy: { infoDateTime: 'desc' },
        });

        return tournamentsData.map(TournamentMapper.toDomain);
    }

    async count(statuses?: TournamentStatus[], federation?: string, mode?: string): Promise<number> {
        const whereClause: any = {};
        if (statuses && statuses.length > 0) {
            whereClause.status = { in: statuses };
        }
        if (federation) {
            whereClause.infoFederation = federation;
        }
        if (mode) {
            whereClause.infoMode = mode;
        }

        return await this.client.tournament.count({
            where: whereClause,
        });
    }

    async findById(id: string): Promise<Tournament | null> {
        const tournamentData = await this.client.tournament.findFirst({
            where: { id },
        });

        return tournamentData ? TournamentMapper.toDomain(tournamentData) : null;
    }
}
