import { MatchStatus } from '../../../../domain/entities/Match.js';
import { InvalidMatchStatusUpdateException, MatchNotFoundException } from '../../../../domain/exceptions/MatchExceptions.js';
import { PlayingAreaNotFoundException } from '../../../../domain/exceptions/PlayingAreaExceptions.js';
import { MatchRepository } from '../../../../domain/repositories/MatchRepository.js';
import { PlayingAreaRepository } from '../../../../domain/repositories/PlayingAreaRepository.js';
import { UnitOfWork } from '../../../../domain/repositories/UnitOfWork.js';
import { UpdateMatchBoardNumberRequestDTO } from '../../../dtos/tournament/match/MatchDTOs.js';
import { getSocketServer } from '../../../../infrastructure/websockets/SocketServer.js';

export class UpdateMatchBoardNumber {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly matchRepository: MatchRepository,
    private readonly playingAreaRepository: PlayingAreaRepository,
  ) { }

  public async execute(request: UpdateMatchBoardNumberRequestDTO): Promise<void> {
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

    // 3. Update the boardNumber in the match object and reassign the match to the new board in the playing area
    match.assignBoardNumber(request.newBoardNumber);
    playingArea.reassignMatchToBoard(request.id, request.newBoardNumber);

    // 4. Persist the changes in the DB
    await this.unitOfWork.transaction(async () => {
      await this.playingAreaRepository.update(playingArea);
      await this.matchRepository.update(match);
    });

    // 5. Notify the board via socket
    const boardId = playingArea.findBoardByNumber(request.newBoardNumber).getId();
    console.log(`[OccupyPlayingAreaBoard] Sending match_assigned to room_board_${boardId} with matchId: ${request.id}`);
    const roomName = `room_board_${boardId}`;
    getSocketServer().to(roomName).emit('match_assigned', { matchId: request.id });
  }
}
