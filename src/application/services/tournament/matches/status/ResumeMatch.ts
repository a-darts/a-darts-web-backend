import { MatchStatus } from '../../../../../domain/entities/Match.js';
import { EventBus } from '../../../../../domain/events/EventBus.js';
import { MatchResumedEvent } from '../../../../../domain/events/MatchEvents.js';
import { MatchNotFoundException } from '../../../../../domain/exceptions/MatchExceptions.js';
import { PlayingAreaNotFoundException } from '../../../../../domain/exceptions/PlayingAreaExceptions.js';
import { MatchRepository } from '../../../../../domain/repositories/MatchRepository.js';
import { PlayingAreaRepository } from '../../../../../domain/repositories/PlayingAreaRepository.js';
import { MatchStateCache } from '../../../../../infrastructure/cache/MatchStateCache.js';

export class ResumeMatch {
  constructor(
    private readonly matchRepository: MatchRepository,
    private readonly playingAreaRepository: PlayingAreaRepository,
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

    // 3. Resume the match
    match.resume();

    // 4. Persist the changes in the DB
    await this.matchRepository.update(match);

    // 5. Save the match status in Redis
    await MatchStateCache.setMatchStatus(id, MatchStatus.IN_PROGRESS);

    // 6. Publish the event
    this.eventBus.publish([
      new MatchResumedEvent(id, boardShortId),
    ]);
  }
}
