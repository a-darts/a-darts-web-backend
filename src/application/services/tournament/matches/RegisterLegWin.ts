import { MatchNotFoundException } from '../../../../domain/exceptions/MatchExceptions.js';
import { MatchRepository } from '../../../../domain/repositories/MatchRepository.js';
import { RegisterLegWinRequestDTO } from '../../../dtos/tournament/match/MatchDTOs.js';

export class RegisterLegWin {
  constructor(private readonly matchRepository: MatchRepository) { }

  public async execute(request: RegisterLegWinRequestDTO): Promise<void> {
    // 1. Rehydrate the match from the DB
    const match = await this.matchRepository.findById(request.id);
    if (!match) {
      throw new MatchNotFoundException();
    }

    // 2. Add the leg won by participantId
    match.addWinLeg(request.participantId);

    // 3. Persist the changes in the DB
    await this.matchRepository.update(match);
  }
}
