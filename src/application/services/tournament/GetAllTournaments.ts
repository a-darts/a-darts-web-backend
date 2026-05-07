import { TournamentRepository } from '../../../domain/repositories/TournamentRepository.js';
import { TournamentResponseDTO } from '../../dtos/tournament/TournamentDTOs.js';
import { TournamentMapper } from '../../dtos/tournament/TournamentMapper.js';

export class GetAllTournaments {
  constructor(private readonly tournamentRepository: TournamentRepository) { }

  public async execute(): Promise<TournamentResponseDTO[]> {
    // 1. Rehydrate all tournaments from the DB
    const tournaments = await this.tournamentRepository.findAll();

    // 2. Return the tournaments data
    return tournaments.map(tournament => TournamentMapper.toResponse(tournament));
  }
}
