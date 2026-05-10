import { TournamentNotFoundException } from '../../../domain/exceptions/TournamentExceptions.js';
import { TournamentRepository } from '../../../domain/repositories/TournamentRepository.js';
import { TournamentResponseDTO } from '../../dtos/tournament/TournamentDTOs.js';
import { TournamentMapper } from '../../dtos/tournament/TournamentMapper.js';

export class GetTournamentById {
  constructor(private readonly tournamentRepository: TournamentRepository) { }

  public async execute(id: string): Promise<TournamentResponseDTO> {
    // 1. Fetch the tournament in the DB
    const tournament = await this.tournamentRepository.findById(id);
    if (!tournament) {
      throw new TournamentNotFoundException();
    }

    // 2. Return the tournament data
    return TournamentMapper.toResponse(tournament);
  }
}
