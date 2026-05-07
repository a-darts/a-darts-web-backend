import { Tournament } from '../../../domain/entities/Tournament.js';
import { CreateTournamentRequestDTO, TournamentResponseDTO } from '../../dtos/tournament/TournamentDTOs.js';
import { TournamentMapper } from '../../dtos/tournament/TournamentMapper.js';
import { TournamentRepository } from '../../../domain/repositories/TournamentRepository.js';
import { TournamentInfo } from '../../../domain/entities/TournamentInfo.js';

export class CreateTournament {
  constructor(
    private readonly tournamentRepository: TournamentRepository,
  ) { }

  public async execute(request: CreateTournamentRequestDTO): Promise<TournamentResponseDTO> {

    // 3. Create the tournament (with the factory method)
    const tournament = Tournament.create(
      request.name,
      new TournamentInfo(
        request.info.place,
        request.info.dateTime,
        request.info.mode,
        request.info.game,
        request.info.schedule,
        request.info.maxPlayers,
        request.info.gameType,
        request.info.numLegs,
        request.info.numSets,
        request.info.rules,
        request.info.info,
        request.info.federation,
      ),
    );

    // 4. Persist the tournament in the DB
    await this.tournamentRepository.create(tournament);

    // 5. Return the tournament data
    return TournamentMapper.toResponse(tournament);
  }
}
