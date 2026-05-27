import { MatchStatus } from '../../../../../domain/entities/Match.js';
import { MatchNotFoundException } from '../../../../../domain/exceptions/MatchExceptions.js';
import { MatchRepository } from '../../../../../domain/repositories/MatchRepository.js';
import { PlayingAreaRepository } from '../../../../../domain/repositories/PlayingAreaRepository.js';
import { MatchStateCache } from '../../../../../infrastructure/cache/MatchStateCache.js';
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
        const boardShortId = await playingArea.findBoardByMatchId(id).getShortId();
        console.log(`[OccupyPlayingAreaBoard] Sending match_assigned to room_board_${boardShortId} with matchId: ${id}`);
        const roomName = `room_board_${boardShortId}`;
        console.log(`[StartMatch] Sending match_started_confirmed to ${roomName} with matchId: ${id}`);
        getSocketServer().to(roomName).emit('match_started_confirmed', { matchId: id });
      } catch (error) {
        console.log("Error while fetching the match board in the playing area");
      }
    }

    // 5. Save the match status in Redis
    await MatchStateCache.setMatchStatus(id, MatchStatus.IN_PROGRESS);
  }
}
