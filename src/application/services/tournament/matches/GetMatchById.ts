import { MatchNotFoundException } from '../../../../domain/exceptions/MatchExceptions.js';
import { MatchRepository } from '../../../../domain/repositories/MatchRepository.js';
import { MatchResponseDTO } from '../../../dtos/tournament/match/MatchDTOs.js';
import { MatchMapper } from '../../../dtos/tournament/match/MatchMapper.js';

export class GetMatchById {
  constructor(private readonly matchRepository: MatchRepository) { }

  public async execute(id: string): Promise<MatchResponseDTO> {
    // 1. Rehydrate the match from the DB
    const match = await this.matchRepository.findByIdWithParticipants(id);
    if (!match) {
      throw new MatchNotFoundException();
    }

    // 2. Return the match data
    return MatchMapper.toResponse(match);
  }
}
