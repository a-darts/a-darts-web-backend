import { MatchNotFoundException } from '../../../../../domain/exceptions/MatchExceptions.js';
import { MatchRepository } from '../../../../../domain/repositories/MatchRepository.js';
import { PlayingAreaRepository } from '../../../../../domain/repositories/PlayingAreaRepository.js';
import { getSocketServer } from '../../../../../infrastructure/websockets/SocketServer.js';

export class StartMatch {
  constructor(
      private readonly matchRepository: MatchRepository,
      private readonly playingAreaRepository: PlayingAreaRepository,
  ) { }

  public async execute(id: string): Promise<void> {
    // 1. Rehydrate the match from the DB
    const match = await this.matchRepository.findById(id);
    if (!match) {
      throw new MatchNotFoundException();
    }

    // 2. Start the match
    match.start();

    // 3. Persist the changes in the DB
    await this.matchRepository.update(match);

    // 4. Notify the board via socket
    console.log(`[StartMatch] Checking if match has a board assigned... Board number:`, match.getBoardNumber());
    if (match.getBoardNumber() !== null && match.getBoardNumber() !== undefined) {
      const playingArea = await this.playingAreaRepository.findByTournamentId(match.getTournamentId());
      console.log(`[StartMatch] PlayingArea found?`, !!playingArea);
      if (playingArea) {
        const board = playingArea.getBoards().find(b => b.getNumber() === match.getBoardNumber());
        console.log(`[StartMatch] Board found in PlayingArea?`, !!board);
        if (board) {
          const roomName = `room_board_${board.getId()}`;
          console.log(`[StartMatch] Sending match_started to ${roomName} with matchId: ${id}`);
          getSocketServer().to(roomName).emit('match_started', { matchId: id });
        }
      }
    }
  }
}
