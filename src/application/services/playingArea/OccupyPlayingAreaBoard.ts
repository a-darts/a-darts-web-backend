import { MatchNotFoundException } from '../../../domain/exceptions/MatchExceptions.js';
import { PlayingAreaNotFoundException } from '../../../domain/exceptions/PlayingAreaExceptions.js';
import { MatchRepository } from '../../../domain/repositories/MatchRepository.js';
import { PlayingAreaRepository } from '../../../domain/repositories/PlayingAreaRepository.js';
import { UnitOfWork } from '../../../domain/repositories/UnitOfWork.js';
import { OccupyPlayingAreaBoardRequestDTO } from '../../dtos/playingArea/PlayingAreaDTOs.js';
import { getSocketServer } from '../../../infrastructure/websockets/SocketServer.js';

export class OccupyPlayingAreaBoard {
    constructor(
        private readonly unitOfWork: UnitOfWork,
        private readonly playingAreaRepository: PlayingAreaRepository,
        private readonly matchRepository: MatchRepository,
    ) { }

    public async execute(request: OccupyPlayingAreaBoardRequestDTO): Promise<void> {
        // 1. Rehydrate the playing area from the DB
        const playingArea = await this.playingAreaRepository.findById(request.id);
        if (!playingArea) {
            throw new PlayingAreaNotFoundException();
        }

        // 2. Rehydrate the match from the DB
        const match = await this.matchRepository.findById(request.matchId);
        if (!match) {
            throw new MatchNotFoundException();
        }



        // 3. Occupy the board in the playing area
        playingArea.assignMatchToBoard(request.matchId, request.boardNumber);
        match.assignBoardNumber(request.boardNumber);

        // 4. Persist the changes in the DB
        await this.unitOfWork.transaction(async () => {
            await this.playingAreaRepository.update(playingArea);
            await this.matchRepository.update(match);
        });

        // 5. Notify the board via socket
        const boardId = playingArea.findBoardByNumber(request.boardNumber).getId();
        console.log(`[OccupyPlayingAreaBoard] Sending match_assigned to room_board_${boardId} with matchId: ${request.matchId}`);
        const roomName = `room_board_${boardId}`;
        getSocketServer().to(roomName).emit('match_assigned', { matchId: request.matchId });
    }
}
