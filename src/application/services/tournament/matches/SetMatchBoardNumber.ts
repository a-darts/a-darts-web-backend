import { MatchNotFoundException } from '../../../../domain/exceptions/MatchExceptions.js';
import { PlayingAreaNotFoundException } from '../../../../domain/exceptions/PlayingAreaExceptions.js';
import { MatchRepository } from '../../../../domain/repositories/MatchRepository.js';
import { PlayingAreaRepository } from '../../../../domain/repositories/PlayingAreaRepository.js';
import { UnitOfWork } from '../../../../domain/repositories/UnitOfWork.js';
import { MatchStateCache } from '../../../../infrastructure/cache/MatchStateCache.js';
import { getSocketServer } from '../../../../infrastructure/websockets/SocketServer.js';
import { SetMatchBoardNumberRequestDTO } from '../../../dtos/tournament/match/MatchDTOs.js';

export class SetMatchBoardNumber {
  constructor(
    private readonly matchRepository: MatchRepository,
    private readonly playingAreaRepository: PlayingAreaRepository,
  ) { }

  public async execute(request: SetMatchBoardNumberRequestDTO): Promise<void> {
    // 1. Rehydrate the match from the DB
    const match = await this.matchRepository.findById(request.id);
    if (!match) {
      throw new MatchNotFoundException();
    }

    // 2. Rehydrate the playing area from the DB
    const playingArea = await this.playingAreaRepository.findByTournamentId(match.getTournamentId());
    if (!playingArea) {
      throw new PlayingAreaNotFoundException();
    }

    // 3. Assign the match to the board in the playing area
    playingArea.assignMatchToBoard(request.id, request.boardNumber);

    // 4. Persist the changes in the DB
    await this.playingAreaRepository.update(playingArea);

    // 5. Notify the board via socket
    const boardId = playingArea.findBoardByNumber(request.boardNumber).getId();

    await MatchStateCache.setActiveMatchForBoard(boardId, request.id);

    console.log(`[OccupyPlayingAreaBoard] Sending match_assigned to room_board_${boardId} with matchId: ${request.id}`);
    const roomName = `room_board_${boardId}`;
    getSocketServer().to(roomName).emit('match_assigned', { matchId: request.id });

    // MIRAR: notificar si se ha desasignado el partido de la diana previa via socket
  }
}
