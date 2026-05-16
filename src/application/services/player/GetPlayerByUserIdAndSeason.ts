import { PlayerNotFoundException } from '../../../domain/exceptions/PlayerExceptions.js';
import { PlayerRepository } from '../../../domain/repositories/PlayerRepository.js';
import { GetPlayerByUserIdAndSeasonRequestDTO, PlayerResponseDTO } from '../../../application/dtos/player/PlayerDTOs.js';
import { PlayerMapper } from '../../../application/dtos/player/PlayerMapper.js';

export class GetPlayerByUserIdAndSeason {
  constructor(private readonly playerRepository: PlayerRepository) { }

  public async execute(request: GetPlayerByUserIdAndSeasonRequestDTO): Promise<PlayerResponseDTO> {
    // 1. Rehydrate the player from the DB
    const player = await this.playerRepository.findByUserIdAndSeason(
      request.userId,
      request.seasonStartYear,
    );
    if (!player) {
      throw new PlayerNotFoundException();
    }

    // 2. Return the player data (without password)
    return PlayerMapper.toResponse(player);
  }
}
