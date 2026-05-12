import { MatchNotFoundException } from '../../../../domain/exceptions/MatchExceptions.js';
import { MatchRepository } from '../../../../domain/repositories/MatchRepository.js';
import { RegisterSetWinRequestDTO } from '../../../dtos/tournament/match/MatchDTOs.js';

export class RegisterSetWin {
  constructor(private readonly matchRepository: MatchRepository) { }

  public async execute(request: RegisterSetWinRequestDTO): Promise<void> {
    // 1. Rehydrate the match from the DB
    const match = await this.matchRepository.findById(request.id);
    if (!match) {
      throw new MatchNotFoundException();
    }

    // 2. Add the set won by participantId
    match.addWinSet(request.participantId);

    // 3. Persist the changes in the DB
    await this.matchRepository.update(match);
  }
}
