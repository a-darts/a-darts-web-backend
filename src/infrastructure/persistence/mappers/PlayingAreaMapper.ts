import { Board, BoardStatus as DomainBoardStatus, PlayingArea } from '../../../domain/entities/PlayingArea.js';
import { PlayingArea as PrismaPlayingArea, Board as PrismaBoard, BoardStatus as PrismaBoardStatus } from '@prisma/client';

export class PlayingAreaMapper {
    public static toDomain(
        prismaPlayingArea: PrismaPlayingArea & { boards: PrismaBoard[] }
    ): PlayingArea {
        const boards = prismaPlayingArea.boards.map(b => new Board(
            b.id,
            b.shortId,
            b.number,
            b.status as unknown as DomainBoardStatus,
            b.matchId,
        ));

        return new PlayingArea(
            prismaPlayingArea.id,
            prismaPlayingArea.shortId,
            prismaPlayingArea.tournamentId,
            boards
        );
    }

    public static toPersistence(domainPlayingArea: PlayingArea) {
        return {
            id: domainPlayingArea.getId(),
            shortId: domainPlayingArea.getShortId(),
            tournamentId: domainPlayingArea.getTournamentId(),
            boards: {
                create: domainPlayingArea.getBoards().map((b) => ({
                    id: b.getId(),
                    shortId: b.getShortId(),
                    number: b.getNumber(),
                    status: b.getStatus() as unknown as PrismaBoardStatus,
                    matchId: b.getMatchId(),
                    playingAreaId: domainPlayingArea.getId(),
                }))
            }
        };
    }

    public static boardToDomain(
        board: PrismaBoard
    ): Board {
        return new Board(
            board.id,
            board.shortId,
            board.number,
            board.status as unknown as DomainBoardStatus,
            board.matchId,
        );
    }
}
