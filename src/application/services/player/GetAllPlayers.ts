import { PlayerRepository } from '../../../domain/repositories/PlayerRepository.js';
import { PlayerWithUserResponseDTO } from '../../dtos/player/PlayerDTOs.js';
import { PlayerMapper } from '../../dtos/player/PlayerMapper.js';

export interface PaginatedPlayersWithUserResponse {
  players: PlayerWithUserResponseDTO[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class GetAllPlayers {
  constructor(private readonly playerRepository: PlayerRepository) { }

  public async execute(page?: number, limit?: number): Promise<PlayerWithUserResponseDTO[] | PaginatedPlayersWithUserResponse> {
    if (page !== undefined && limit !== undefined) {
      const skip = (page - 1) * limit;
      const take = limit;

      const [players, total] = await Promise.all([
        this.playerRepository.findAllWithUser(skip, take),
        this.playerRepository.count()
      ]);

      return {
        players: players.map(player => PlayerMapper.toResponseWithUser(player)),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    }

    // 1. Rehydrate all players from the DB
    const players = await this.playerRepository.findAllWithUser();

    // 2. Return the players data (without password)
    return players.map(player => PlayerMapper.toResponseWithUser(player));
  }
}
