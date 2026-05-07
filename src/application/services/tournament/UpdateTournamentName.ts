import { TournamentNotFoundException } from '../../../domain/exceptions/TournamentExceptions.js';
import { TournamentRepository } from '../../../domain/repositories/TournamentRepository.js';
import { UpdateTournamentNameRequestDTO } from '../../dtos/tournament/TournamentDTOs.js';

export class UpdateTournamentName {
  constructor(private readonly tournamentRepository: TournamentRepository) { }

  public async execute(request: UpdateTournamentNameRequestDTO): Promise<void> {
    // 1. Rehydrate the tournament from the DB
    const tournament = await this.tournamentRepository.findById(request.id);
    if (!tournament) {
      throw new TournamentNotFoundException();
    }

    // 2. Update the name in the tournament object
    tournament.updateName(request.newName);

    // 3. Persist the changes in the DB
    await this.tournamentRepository.update(tournament);
  }
}
