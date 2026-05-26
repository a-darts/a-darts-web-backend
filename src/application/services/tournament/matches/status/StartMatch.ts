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
    const playingArea = await this.playingAreaRepository.findByTournamentId(match.getTournamentId());
    if (playingArea) {
      try {
        const boardId = await playingArea.findBoardByMatchId(id);
        console.log(`[OccupyPlayingAreaBoard] Sending match_assigned to room_board_${boardId} with matchId: ${id}`);
        const roomName = `room_board_${boardId}`;
        console.log(`[StartMatch] Sending match_started to ${roomName} with matchId: ${id}`);
        getSocketServer().to(roomName).emit('match_started', { matchId: id });
      } catch (error) {
        console.log("Error while fetching the match board in the playing area");
      }
    }
  }
}
