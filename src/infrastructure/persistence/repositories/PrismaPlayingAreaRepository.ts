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
        console.log("Creating playing area...", playingArea);
        const data = PlayingAreaMapper.toPersistence(playingArea);
        await this.client.playingArea.create({ data });
    }

    async update(playingArea: PlayingArea): Promise<void> {
        console.log("Updating playing area...", playingArea);

        await this.client.$transaction(async (tx) => {
            // Update the main playing area fields
            await tx.playingArea.update({
                where: { id: playingArea.getId() },
                data: { tournamentId: playingArea.getTournamentId() },
            });

            // Delete boards that are no longer in the domain model
            const currentBoardIds = playingArea.getBoards().map(b => b.getId());
            await tx.board.deleteMany({
                where: {
                    playingAreaId: playingArea.getId(),
                    id: { notIn: currentBoardIds }
                }
            });

            // Upsert each board to preserve their IDs
            for (const board of playingArea.getBoards()) {
                await tx.board.upsert({
                    where: { id: board.getId() },
                    create: {
                        id: board.getId(),
                        number: board.getNumber(),
                        status: board.getStatus() as any,
                        matchId: board.getMatchId(),
                        playingAreaId: playingArea.getId(),
                    },
                    update: {
                        number: board.getNumber(),
                        status: board.getStatus() as any,
                        matchId: board.getMatchId(),
                    }
                });
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
