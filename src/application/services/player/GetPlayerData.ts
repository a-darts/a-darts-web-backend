import { PlayerNotFoundException } from '../../../domain/exceptions/PlayerExceptions.js';
import { PlayerRepository } from '../../../domain/repositories/PlayerRepository.js';
import { PlayerResponseDto } from '../../../application/dtos/player/PlayerDTOs.js';
import { PlayerMapper } from '../../../application/dtos/player/PlayerMapper.js';

export class GetPlayerData {
  constructor(private readonly playerRepository: PlayerRepository) { }

  public async execute(userId: string): Promise<PlayerResponseDto> {
    // 1. Rehydrate the player from the DB
    const player = await this.playerRepository.findByUserId(userId);
    if (!player) {
      throw new PlayerNotFoundException();
    }

    // 2. Return the player data (without password)
    return PlayerMapper.toResponse(player);
  }
}
