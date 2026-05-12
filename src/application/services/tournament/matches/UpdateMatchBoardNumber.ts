import { MatchStatus } from '../../../../domain/entities/Match.js';
import { InvalidMatchStatusUpdateException, MatchNotFoundException } from '../../../../domain/exceptions/MatchExceptions.js';
import { MatchRepository } from '../../../../domain/repositories/MatchRepository.js';
import { UpdateMatchBoardNumberRequestDTO } from '../../../dtos/tournament/match/MatchDTOs.js';

export class UpdateMatchBoardNumber {
  constructor(private readonly matchRepository: MatchRepository) { }

  public async execute(request: UpdateMatchBoardNumberRequestDTO): Promise<void> {
    // 1. Rehydrate the match from the DB
    const match = await this.matchRepository.findById(request.id);
    if (!match) {
      throw new MatchNotFoundException();
    }

    // 2. Update the boardNumber in the match object
    match.assignBoardNumber(request.newBoardNumber);

    // 3. Persist the changes in the DB
    await this.matchRepository.update(match);
  }
}
