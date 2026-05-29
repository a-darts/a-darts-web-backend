import { Player } from "../../domain/entities/Player.js";
import { Season } from "../../domain/entities/Season.js";
import { PlayerAlreadyExistsException, PlayerNotFoundException } from "../../domain/exceptions/PlayerExceptions.js";
import { UserNotFoundException } from "../../domain/exceptions/UserExceptions.js";
import { PlayerRepository } from "../../domain/repositories/PlayerRepository.js";
import { UserRepository } from "../../domain/repositories/UserRepository.js";
import { CreatePlayerRequestDTO, GetPlayerByUserIdAndSeasonRequestDTO, PaginatedPlayersWithUserResponse, PlayerResponseDTO, PlayerWithUserResponseDTO, UpdatePlayerFederationRequestDTO } from "../dtos/player/PlayerDTOs.js";
import { PlayerMapper } from "../dtos/player/PlayerMapper.js";

export class PlayerService {
  constructor(
    private readonly playerRepository: PlayerRepository,
    private readonly userRepository: UserRepository,
  ) { }
    

  public async getAll(page?: number, limit?: number): Promise<PlayerWithUserResponseDTO[] | PaginatedPlayersWithUserResponse> {
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


  public async getById(id: string): Promise<PlayerWithUserResponseDTO> {
    // 1. Rehydrate the player from the DB
    const player = await this.playerRepository.findByIdWithUser(id);
    if (!player) {
      throw new PlayerNotFoundException();
    }

    // 2. Return the player data
    return PlayerMapper.toResponseWithUser(player);
  }
    

  public async getByUserIdAndSeason(request: GetPlayerByUserIdAndSeasonRequestDTO): Promise<PlayerResponseDTO> {
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
    

  public async create(request: CreatePlayerRequestDTO): Promise<PlayerResponseDTO> {
    // 1. Check if the player already exists in that season
    const existingPlayer = await this.playerRepository.findByUserIdAndSeason(
      request.userId,
      request.season.startYear,
    );
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
      new Season(request.season.startYear),
    );
  
    // 4. Persist the player in the DB
    await this.playerRepository.create(player);
  
    // 5. Return the player data
    return PlayerMapper.toResponse(player);
  }


  public async updateFederation(request: UpdatePlayerFederationRequestDTO): Promise<void> {
    // 1. Rehydrate the player from the DB
    const player = await this.playerRepository.findById(request.id);
    if (!player) {
      throw new PlayerNotFoundException();
    }

    // 2. Update the federation in the player object
    player.updateFederation(request.newFederation);

    // 3. Persist the changes in the DB
    await this.playerRepository.update(player);
  }
}
