import { Board } from '../../../../domain/entities/PlayingArea.js';
import { MatchNotFoundException } from '../../../../domain/exceptions/MatchExceptions.js';
import { PlayingAreaNotFoundException } from '../../../../domain/exceptions/PlayingAreaExceptions.js';
import { MatchRepository } from '../../../../domain/repositories/MatchRepository.js';
import { PlayingAreaRepository } from '../../../../domain/repositories/PlayingAreaRepository.js';
import { MatchCacheRepository } from '../../../../domain/repositories/MatchCacheRepository.js';
import { getSocketServer } from '../../../../infrastructure/websockets/SocketServer.js';
import { SetMatchBoardNumberRequestDTO } from '../../../dtos/tournament/match/MatchDTOs.js';

export class SetMatchBoardNumber {
  constructor(
    private readonly matchRepository: MatchRepository,
    private readonly playingAreaRepository: PlayingAreaRepository,
    private readonly matchCacheRepository: MatchCacheRepository,
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

    // 3. Check if the match was previously assigned to a board
    let oldBoard: Board | null = null;
    try {
      oldBoard = playingArea.findBoardByMatchId(request.id);
    } catch (error) {
      // The match was not previously assigned to any board (ignore error)
    }

    // 4. Assign the match to the board in the playing area and release the previous board if assigned
    if (oldBoard) {
      playingArea.releaseBoard(oldBoard.getNumber());
    }
    playingArea.assignMatchToBoard(request.id, request.boardNumber);

    // 5. Persist the changes in the DB
    await this.playingAreaRepository.update(playingArea);

    // 6. Notify the old board about the unassignment
    if (oldBoard) {
      const oldBoardShortId = oldBoard.getShortId();
      await this.matchCacheRepository.clearBoardActiveMatch(oldBoardShortId);

      console.log(`[ReleasePlayingAreaBoard] Match unassigned from board. Sending match_unassigned to room_board_${oldBoardShortId}`);
      const oldRoomName = `room_board_${oldBoardShortId}`;
      getSocketServer().to(oldRoomName).emit('match_unassigned', { matchId: request.id });
    }

    // 7. Notify the board about the new match assignment
    const boardShortId = playingArea.findBoardByNumber(request.boardNumber).getShortId();
    await this.matchCacheRepository.setActiveMatchForBoard(boardShortId, request.id);
    
    const status = await this.matchCacheRepository.getMatchStatus(request.id);
    const historyThrows = await this.matchCacheRepository.getThrows(request.id);

    const roomName = `room_board_${boardShortId}`;
    
    if (status === 'IN_PROGRESS' && historyThrows && historyThrows.length > 0) {
      console.log(`[SetMatchBoardNumber] Match already in progress. Sending match_restored to ${roomName}`);
      
      // Enviamos match_restored a toda la sala para que la tablet se auto-configure en caliente
      getSocketServer().to(roomName).emit('match_restored', { 
        matchId: request.id, 
        historyThrows: historyThrows 
      });
    } else {
      // Enviamos match_assigned a toda la sala
      console.log(`[SetMatchBoardNumber] Match assigned to board. Sending match_assigned to ${roomName}`);
      getSocketServer().to(roomName).emit('match_assigned', { matchId: request.id });
    }
  }
}
