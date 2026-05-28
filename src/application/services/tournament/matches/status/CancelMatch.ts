import { MatchStatus } from '../../../../../domain/entities/Match.js';
import { MatchNotFoundException } from '../../../../../domain/exceptions/MatchExceptions.js';
import { MatchRepository } from '../../../../../domain/repositories/MatchRepository.js';
import { MatchCacheRepository } from '../../../../../domain/repositories/MatchCacheRepository.js';

export class CancelMatch {
  constructor(
    private readonly matchRepository: MatchRepository,
    private readonly matchCacheRepository: MatchCacheRepository,
  ) { }

  public async execute(id: string): Promise<void> {
    // 1. Rehydrate the match from the DB
    const match = await this.matchRepository.findById(id);
    if (!match) {
      throw new MatchNotFoundException();
    }

    // 2. Cancel the match
    match.cancel();

    // 3. Persist the changes in the DB
    await this.matchRepository.update(match);

    // 4. Save the match status in Redis
    await this.matchCacheRepository.setMatchStatus(id, MatchStatus.CANCELLED);
  }
}
