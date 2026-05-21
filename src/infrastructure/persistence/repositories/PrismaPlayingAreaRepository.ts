import { PrismaClient } from '@prisma/client';
import { PlayingArea } from '../../../domain/entities/PlayingArea.js';
import { PlayingAreaMapper } from '../mappers/PlayingAreaMapper.js';
import { PlayingAreaRepository } from '../../../domain/repositories/PlayingAreaRepository.js';
import { transactionStorage } from '../TransactionContext.js';

export class PrismaPlayingAreaRepository implements PlayingAreaRepository {
    constructor(private readonly prisma: PrismaClient) { }

    private get client() {
        const tx = transactionStorage.getStore();
        if (tx) {
            return tx;
        }
        return this.prisma;
    }

    async create(playingArea: PlayingArea): Promise<void> {
        const data = PlayingAreaMapper.toPersistence(playingArea);
        await this.client.playingArea.create({ data });
    }

    async update(playingArea: PlayingArea): Promise<void> {
        const data = PlayingAreaMapper.toPersistence(playingArea);
        await this.client.playingArea.update({
            where: { id: playingArea.getId() },
            data: {
                ...data,
                boards: {
                    deleteMany: {},
                    create: data.boards.create
                }
            },
        });
    }

    async delete(id: string): Promise<void> {
        await this.client.playingArea.delete({
            where: { id }
        });
    }

    async findById(id: string): Promise<PlayingArea | null> {
        const playingAreaData = await this.client.playingArea.findUnique({
            where: { id },
            include: {
                boards: true,
            },
        });
        return playingAreaData ? PlayingAreaMapper.toDomain(playingAreaData) : null;
    }

    async findByTournamentId(tournamentId: string): Promise<PlayingArea | null> {
        const playingAreaData = await this.client.playingArea.findUnique({
            where: { tournamentId },
            include: {
                boards: true,
            },
        });
        return playingAreaData ? PlayingAreaMapper.toDomain(playingAreaData) : null;
    }
}
