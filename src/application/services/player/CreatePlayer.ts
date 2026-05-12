import { Player, Season } from '../../../domain/entities/Player.js';
import { PlayerAlreadyExistsException } from '../../../domain/exceptions/PlayerExceptions.js';
import { UserNotFoundException } from '../../../domain/exceptions/UserExceptions.js';
import { PlayerRepository } from '../../../domain/repositories/PlayerRepository.js';
import { CreatePlayerRequestDTO, PlayerResponseDTO } from '../../dtos/player/PlayerDTOs.js';
import { PlayerMapper } from '../../dtos/player/PlayerMapper.js';
import { UserRepository } from '../../../domain/repositories/UserRepository.js';

export class CreatePlayer {
  constructor(
    private readonly playerRepository: PlayerRepository,
    private readonly userRepository: UserRepository,
  ) { }

  public async execute(request: CreatePlayerRequestDTO): Promise<PlayerResponseDTO> {
    // 1. Check if the player already exists in that season
    const existingPlayer = await this.playerRepository.findByUserIdAndSeason(request.userId, request.season.startYear);
    if (existingPlayer) {
      throw new PlayerAlreadyExistsException();
    }

    // 2. Check if the user exists
    const existingUser = await this.userRepository.findById(request.userId);
    if (!existingUser) {
      throw new UserNotFoundException();
    }

    // 3. Create the player (with the factory method)
    const player = Player.create(
      request.userId,
      request.registrationNumber,
      request.federation,
      new Season(request.season.startYear, request.season.endYear),
    );

    // 4. Persist the player in the DB
    await this.playerRepository.create(player);

    // 5. Return the player data
    return PlayerMapper.toResponse(player);
  }
}
