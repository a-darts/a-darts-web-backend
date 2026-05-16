import { MatchNotFoundException } from '../../../../../domain/exceptions/MatchExceptions.js';
import { MatchRepository } from '../../../../../domain/repositories/MatchRepository.js';

export class ResumeMatch {
  constructor(private readonly matchRepository: MatchRepository) { }

  public async execute(id: string): Promise<void> {
    // 1. Rehydrate the match from the DB
    const match = await this.matchRepository.findById(id);
    if (!match) {
      throw new MatchNotFoundException();
    }

    // 2. Resume the match
    match.resume();

    // 3. Persist the changes in the DB
    await this.matchRepository.update(match);
  }
}
