import { PlayingAreaNotFoundException, BoardPairedWithTabletException } from '../../../domain/exceptions/PlayingAreaExceptions.js';
import { PlayingAreaRepository } from '../../../domain/repositories/PlayingAreaRepository.js';
import { getSocketServer } from '../../../infrastructure/websockets/SocketServer.js';

export class RemoveLastBoardFromPlayingArea {
    constructor(
        private readonly playingAreaRepository: PlayingAreaRepository,
    ) { }

    public async execute(id: string): Promise<void> {
        // 1. Rehydrate the playing area from the DB
        const playingArea = await this.playingAreaRepository.findById(id);
        if (!playingArea) {
            throw new PlayingAreaNotFoundException();
        }

        const boards = playingArea.getBoards();
        if (boards.length === 0) {
            playingArea.removeLastBoard();
            return;
        }

        const lastBoard = boards[boards.length - 1];

        try {
            const io = getSocketServer();
            const roomName = `room_board_${lastBoard.getId()}`;
            const room = io.sockets.adapter.rooms.get(roomName);

            if (room && room.size > 0) {
                throw new BoardPairedWithTabletException();
            }
        } catch (e: any) {
            if (e.message.includes('has not been initialized')) {
                // Ignore if socket is not running (e.g., in tests)
            } else {
                throw e;
            }
        }

        // 2. Remove the last board from the playing area
        playingArea.removeLastBoard();

        // 3. Persist the changes in the DB
        await this.playingAreaRepository.update(playingArea);
    }
}
