import { TournamentNotFoundException } from '../../../../domain/exceptions/TournamentExceptions.js';
import { MatchRepository } from '../../../../domain/repositories/MatchRepository.js';
import { TournamentRepository } from '../../../../domain/repositories/TournamentRepository.js';
import { MatchResponseDTO } from '../../../dtos/tournament/match/MatchDTOs.js';
import { MatchMapper } from '../../../dtos/tournament/match/MatchMapper.js';

export class GetMatchesByTournamentId {
  constructor(
    private readonly tournamentRepository: TournamentRepository,
    private readonly matchRepository: MatchRepository,
  ) { }

  public async execute(id: string): Promise<MatchResponseDTO[]> {
    // 1. Fetch the tournament in the DB
    const tournament = await this.tournamentRepository.findById(id);
    if (!tournament) {
      throw new TournamentNotFoundException();
    }

    // 2. Fetch the matches in the DB
    const matches = await this.matchRepository.findManyByTournamentId(id);
    if (!matches) {
      return [];
    }

    // 4. Return the matches data
    return matches.map(item => {
      return MatchMapper.toResponse(item.match, item.participant1, item.participant2);
    });
  }
}
