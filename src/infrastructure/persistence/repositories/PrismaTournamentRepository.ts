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

    async findAll(skip?: number, take?: number, statuses?: TournamentStatus[]): Promise<Tournament[]> {
        const tournamentsData = await this.client.tournament.findMany({
            where: statuses && statuses.length > 0
                ? { status: { in: statuses } }
                : undefined,
            skip,
            take,
            orderBy: { infoDateTime: 'desc' },
        });

        return tournamentsData.map(TournamentMapper.toDomain);
    }

    async count(statuses?: TournamentStatus[]): Promise<number> {
        return await this.client.tournament.count({
            where: statuses && statuses.length > 0
                ? { status: { in: statuses } }
                : undefined,
        });
    }

    async findById(id: string): Promise<Tournament | null> {
        const tournamentData = await this.client.tournament.findFirst({
            where: { id },
        });

        return tournamentData ? TournamentMapper.toDomain(tournamentData) : null;
    }
}
