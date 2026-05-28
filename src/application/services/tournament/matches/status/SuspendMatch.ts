import { MatchStatus } from '../../../../../domain/entities/Match.js';
import { EventBus } from '../../../../../domain/events/EventBus.js';
import { MatchSuspendedEvent } from '../../../../../domain/events/MatchEvents.js';
import { MatchNotFoundException } from '../../../../../domain/exceptions/MatchExceptions.js';
import { PlayingAreaNotFoundException } from '../../../../../domain/exceptions/PlayingAreaExceptions.js';
import { MatchRepository } from '../../../../../domain/repositories/MatchRepository.js';
import { PlayingAreaRepository } from '../../../../../domain/repositories/PlayingAreaRepository.js';
import { MatchCacheRepository } from '../../../../../domain/repositories/MatchCacheRepository.js';

export class SuspendMatch {
  constructor(
    private readonly matchRepository: MatchRepository,
    private readonly playingAreaRepository: PlayingAreaRepository,
    private readonly matchCacheRepository: MatchCacheRepository,
    private readonly eventBus: EventBus,
  ) { }

  public async execute(id: string): Promise<void> {
    // 1. Rehydrate the match from the DB
    const match = await this.matchRepository.findById(id);
    if (!match) {
      throw new MatchNotFoundException();
    }

    // 2. Get the boardShortId
    const playingArea = await this.playingAreaRepository.findByTournamentId(match.getTournamentId());
    if (!playingArea) {
      throw new PlayingAreaNotFoundException();
    }
    const boardShortId = playingArea.findBoardByMatchId(id).getShortId();

    
    // 3. Suspend the match
    match.suspend();

    // 4. Persist the changes in the DB
    await this.matchRepository.update(match);

    // 5. Save the match status in Redis
    await this.matchCacheRepository.setMatchStatus(id, MatchStatus.SUSPENDED);

    // 6. Publish the event
    this.eventBus.publish([
      new MatchSuspendedEvent(id, boardShortId),
    ]);
  }
}
