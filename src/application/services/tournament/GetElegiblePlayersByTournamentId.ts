import { TournamentNotFoundException } from '../../../domain/exceptions/TournamentExceptions.js';
import { PlayerRepository } from '../../../domain/repositories/PlayerRepository.js';
import { RegisteredParticipantRepository } from '../../../domain/repositories/RegisteredParticipantRepository.js';
import { TournamentRepository } from '../../../domain/repositories/TournamentRepository.js';
import { PlayerWithUserResponseDTO } from '../../dtos/player/PlayerDTOs.js';
import { PlayerMapper } from '../../dtos/player/PlayerMapper.js';

export class GetElegiblePlayersByTournamentId {
  constructor(
    private readonly tournamentRepository: TournamentRepository,
    private readonly registeredParticipantRepository: RegisteredParticipantRepository,
    private readonly playerRepository: PlayerRepository,
  ) { }

  public async execute(id: string): Promise<PlayerWithUserResponseDTO[]> {
    // 1. Rehydrate the tournament from the DB
    const tournament = await this.tournamentRepository.findById(id);
    if (!tournament) {
      throw new TournamentNotFoundException();
    }

    // 2. Rehydrate the registered participants in the tournament from the DB
    const registeredParticipants = await this.registeredParticipantRepository.findAllByTournamentId(id);
    if (!registeredParticipants) {
      return [];
    }

    // 3. Rehydrate the players registered in the same season from the DB
    const allPlayers = await this.playerRepository.findAllBySeasonWithUser(tournament.getInfo().getDateTime().getFullYear());
    if (!allPlayers) {
      return [];
    }

    // 4. Filter players that are not registered in the tournament
    const registeredPlayerIds = registeredParticipants.map(participant => participant.getPlayerId());
    const elegiblePlayers = allPlayers.filter(player => !registeredPlayerIds.includes(player.player.getId()));

    // 5. Return the players data
    return elegiblePlayers.map(player => PlayerMapper.toResponseWithUser(player));
  }
}
