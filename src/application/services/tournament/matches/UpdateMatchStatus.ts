import { MatchStatus } from '../../../../domain/entities/Match.js';
import { InvalidMatchStatusUpdateException, MatchNotFoundException } from '../../../../domain/exceptions/MatchExceptions.js';
import { MatchRepository } from '../../../../domain/repositories/MatchRepository.js';
import { UpdateMatchStatusRequestDTO } from '../../../dtos/tournament/match/MatchDTOs.js';

export class UpdateMatchStatus {
  constructor(private readonly matchRepository: MatchRepository) { }

  public async execute(request: UpdateMatchStatusRequestDTO): Promise<void> {
    // 1. Rehydrate the match from the DB
    const match = await this.matchRepository.findById(request.id);
    if (!match) {
      throw new MatchNotFoundException();
    }

    // 2. Update the status in the match object
    switch (request.newStatus) {
      case MatchStatus.IN_PROGRESS:
        if (match.getStatus() === MatchStatus.SUSPENDED) {
          match.resume();
        } else {
          match.start();
        }
        break;
      case MatchStatus.FINISHED:
        match.finish();
        break;
      case MatchStatus.SUSPENDED:
        match.suspend();
        break;
      case MatchStatus.ABANDONED:
        match.abandon();
        break;
      default:
        throw new InvalidMatchStatusUpdateException();
    }

    // 3. Persist the changes in the DB
    await this.matchRepository.update(match);
  }
}
