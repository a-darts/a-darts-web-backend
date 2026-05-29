import { PrismaClient } from '@prisma/client';
import { PlayingArea } from '../../../domain/entities/PlayingArea.js';
import { PlayingAreaMapper } from '../mappers/PlayingAreaMapper.js';
import { IPlayingAreaRepository } from '../../../domain/repositories/IPlayingAreaRepository.js';
import { transactionStorage } from '../TransactionContext.js';

export class PrismaPlayingAreaRepository implements IPlayingAreaRepository {
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
        // 1. Identificar qué dianas van a limpiar su matchId (release) y cuáles van a asignarse (occupy)
        const boards = playingArea.getBoards();

        // Dianas que quedan libres (matchId es null)
        const releasingBoards = boards.filter(b => b.getMatchId() === null);
        // Dianas que se van a ocupar (matchId tiene valor)
        const occupyingBoards = boards.filter(b => b.getMatchId() !== null);

        // 2. Mapeador auxiliar para no repetir código de persistencia
        const mapBoardData = (board: any) => ({
            shortId: board.getShortId(),
            number: board.getNumber(),
            status: board.getStatus() as any,
            matchId: board.getMatchId(),
        });

        // 3. Primero eliminamos del agregado las dianas que ya no existan en el dominio
        await this.client.playingArea.update({
            where: { id: playingArea.getId() },
            data: {
                tournamentId: playingArea.getTournamentId(),
                boards: {
                    deleteMany: {
                        id: { notIn: boards.map(b => b.getId()) }
                    }
                }
            }
        });

        // 4. Actualizar primero las que LIBERAN el partido
        for (const board of releasingBoards) {
            await this.client.board.upsert({
                where: { id: board.getId() },
                update: mapBoardData(board),
                create: { id: board.getId(), playingAreaId: playingArea.getId(), ...mapBoardData(board) }
            });
        }

        // 5. Ahora que el matchId está libre en toda la tabla, actualizamos las que OCUPAN el partido
        for (const board of occupyingBoards) {
            await this.client.board.upsert({
                where: { id: board.getId() },
                update: mapBoardData(board),
                create: { id: board.getId(), playingAreaId: playingArea.getId(), ...mapBoardData(board) }
            });
        }
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
                boards: {
                    orderBy: {
                        number: 'asc',
                    },
                },
            }
        });
        return playingAreaData ? PlayingAreaMapper.toDomain(playingAreaData) : null;
    }

    async findByTournamentId(tournamentId: string): Promise<PlayingArea | null> {
        const playingAreaData = await this.client.playingArea.findUnique({
            where: { tournamentId },
            include: {
                boards: {
                    orderBy: {
                        number: 'asc',
                    },
                },
            },
        });
        return playingAreaData ? PlayingAreaMapper.toDomain(playingAreaData) : null;
    }
}
