import { TournamentInfo } from '../../../domain/entities/TournamentInfo.js';
import { TournamentNotFoundException } from '../../../domain/exceptions/TournamentExceptions.js';
import { TournamentRepository } from '../../../domain/repositories/TournamentRepository.js';
import { UpdateTournamentInfoRequestDTO } from '../../dtos/tournament/TournamentDTOs.js';

export class UpdateTournamentInfo {
  constructor(private readonly tournamentRepository: TournamentRepository) { }

  public async execute(request: UpdateTournamentInfoRequestDTO): Promise<void> {
    // 1. Rehydrate the tournament from the DB
    const tournament = await this.tournamentRepository.findById(request.id);
    if (!tournament) {
      throw new TournamentNotFoundException();
    }

    // 2. Update the info in the tournament object
    const newInfo = new TournamentInfo(
      request.newInfo.place,
      request.newInfo.dateTime,
      request.newInfo.mode,
      request.newInfo.game,
      request.newInfo.schedule,
      request.newInfo.maxPlayers,
      request.newInfo.gameType,
      request.newInfo.numLegs,
      request.newInfo.numSets,
      request.newInfo.rules,
      request.newInfo.info,
      request.newInfo.federation,
    );
    tournament.updateInfo(newInfo);

    // 3. Persist the changes in the DB
    await this.tournamentRepository.update(tournament);
  }
}
