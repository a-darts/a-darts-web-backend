import { TournamentStatus } from '../../../domain/entities/Tournament.js';
import { InvalidTournamentStatusUpdateException, TournamentNotFoundException } from '../../../domain/exceptions/TournamentExceptions.js';
import { TournamentRepository } from '../../../domain/repositories/TournamentRepository.js';
import { UpdateTournamentStatusRequestDTO } from '../../dtos/tournament/TournamentDTOs.js';

export class UpdateTournamentStatus {
  constructor(private readonly tournamentRepository: TournamentRepository) { }

  public async execute(request: UpdateTournamentStatusRequestDTO): Promise<void> {
    // 1. Rehydrate the tournament from the DB
    const tournament = await this.tournamentRepository.findById(request.id);
    if (!tournament) {
      throw new TournamentNotFoundException();
    }

    // 2. Update the status in the tournament object
    switch (request.newStatus) {
      case TournamentStatus.PUBLISHED:
        tournament.publish();
        break;
      case TournamentStatus.IN_PROGRESS:
        tournament.start();
        break;
      case TournamentStatus.FINISHED:
        tournament.finish();
        break;
      case TournamentStatus.CANCELLED:
        tournament.cancel();
        break;
      default:
        throw new InvalidTournamentStatusUpdateException();
    }

    // 3. Persist the changes in the DB
    await this.tournamentRepository.update(tournament);
  }
}
