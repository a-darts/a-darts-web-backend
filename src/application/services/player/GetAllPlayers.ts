import { PlayerRepository } from '../../../domain/repositories/PlayerRepository.js';
import { PlayerResponseDTO } from '../../dtos/player/PlayerDTOs.js';
import { PlayerMapper } from '../../dtos/player/PlayerMapper.js';

export class GetAllPlayers {
  constructor(private readonly playerRepository: PlayerRepository) { }

  public async execute(): Promise<PlayerResponseDTO[]> {
    // 1. Rehydrate all players from the DB
    const players = await this.playerRepository.findAll();

    // 2. Return the players data (without password)
    return players.map(player => PlayerMapper.toResponse(player));
  }
}
