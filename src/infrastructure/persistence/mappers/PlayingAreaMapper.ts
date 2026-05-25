import { Board, BoardStatus as DomainBoardStatus, PlayingArea } from '../../../domain/entities/PlayingArea.js';
import { PlayingArea as PrismaPlayingArea, Board as PrismaBoard, BoardStatus as PrismaBoardStatus } from '@prisma/client';

export class PlayingAreaMapper {
    public static toDomain(
        prismaPlayingArea: PrismaPlayingArea & { boards: PrismaBoard[] }
    ): PlayingArea {
        const boards = prismaPlayingArea.boards.map(b => new Board(
            b.id,
            b.number,
            b.status as unknown as DomainBoardStatus,
            b.matchId,
        ));

        return new PlayingArea(
            prismaPlayingArea.id,
            prismaPlayingArea.tournamentId,
            boards
        );
    }

    public static toPersistence(domainPlayingArea: PlayingArea) {
        return {
            id: domainPlayingArea.getId(),
            tournamentId: domainPlayingArea.getTournamentId(),
            boards: {
                create: domainPlayingArea.getBoards().map((b) => ({
                    number: b.getNumber(),
                    status: b.getStatus() as unknown as PrismaBoardStatus,
                    matchId: b.getMatchId(),
                }))
            }
        };
    }
}
