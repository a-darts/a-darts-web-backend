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
        // Generamos las operaciones de actualización/creación para cada board individualmente
        const boardUpsertOperations = playingArea.getBoards().map(board => ({
            where: { id: board.getId() },
            update: {
                number: board.getNumber(),
                status: board.getStatus() as any,
                matchId: board.getMatchId(),
            },
            create: {
                id: board.getId(),
                number: board.getNumber(),
                status: board.getStatus() as any,
                matchId: board.getMatchId(),
            }
        }));

        // Prisma ejecuta TODO esto en una sola transacción nativa implícita de base de datos
        await this.client.playingArea.update({
            where: { id: playingArea.getId() },
            data: {
                tournamentId: playingArea.getTournamentId(),
                boards: {
                    // 1. Borra automáticamente las dianas que ya no están en tu modelo de dominio
                    deleteMany: {
                        id: { notIn: playingArea.getBoards().map(b => b.getId()) }
                    },
                    // 2. Hace un upsert individual optimizado por ID para cada diana
                    // Si existe la actualiza, si no existe la crea. ¡Sin duplicar llamadas!
                    upsert: boardUpsertOperations
                }
            }
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
