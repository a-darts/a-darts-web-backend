import { PlayerNotFoundException } from '../../../domain/exceptions/PlayerExceptions.js';
import { PlayerRepository } from '../../../domain/repositories/PlayerRepository.js';
import { PlayerResponseDTO, PlayerWithUserResponseDTO } from '../../../application/dtos/player/PlayerDTOs.js';
import { PlayerMapper } from '../../../application/dtos/player/PlayerMapper.js';

export class GetPlayerData {
  constructor(private readonly playerRepository: PlayerRepository) { }

  public async execute(id: string): Promise<PlayerWithUserResponseDTO> {
    // 1. Rehydrate the player from the DB
    const player = await this.playerRepository.findByIdWithUser(id);
    if (!player) {
      throw new PlayerNotFoundException();
    }

    // 2. Return the player data
    return PlayerMapper.toResponseWithUser(player);
  }
}
