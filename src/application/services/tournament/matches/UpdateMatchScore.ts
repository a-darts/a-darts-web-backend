import { MatchNotFoundException } from '../../../../domain/exceptions/MatchExceptions.js';
import { MatchRepository } from '../../../../domain/repositories/MatchRepository.js';
import { UpdateMatchScoreRequestDTO } from '../../../dtos/tournament/match/MatchDTOs.js';

export class UpdateMatchScore {
  constructor(private readonly matchRepository: MatchRepository) { }

  public async execute(request: UpdateMatchScoreRequestDTO): Promise<void> {
    // 1. Rehydrate the match from the DB
    const match = await this.matchRepository.findById(request.id);
    if (!match) {
      throw new MatchNotFoundException();
    }

    // 2. Update the match result
    match.setScore(
      request.participant1Sets,
      request.participant1Legs,
      request.participant2Sets,
      request.participant2Legs,
    );

    // 3. Persist the changes in the DB
    await this.matchRepository.update(match);
  }
}
