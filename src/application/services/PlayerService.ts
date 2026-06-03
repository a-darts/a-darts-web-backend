import { Player, PlayerStatus } from "../../domain/entities/Player.js";
import { Season } from "../../domain/entities/Season.js";
import { PlayerAlreadyExistsException, PlayerNotFoundException } from "../../domain/exceptions/PlayerExceptions.js";
import { TournamentNotFoundException } from "../../domain/exceptions/TournamentExceptions.js";
import { UserNotFoundException } from "../../domain/exceptions/UserExceptions.js";
import { IPlayerRepository } from "../../domain/ports/repositories/IPlayerRepository.js";
import { IRegisteredParticipantRepository } from "../../domain/ports/repositories/IRegisteredParticipantRepository.js";
import { ITournamentRepository } from "../../domain/ports/repositories/ITournamentRepository.js";
import { ITournamentResultRepository } from "../../domain/ports/repositories/ITournamentResultRepository.js";
import { IUserRepository } from "../../domain/ports/repositories/IUserRepository.js";
import {
  CreatePlayerRequestDTO,
  GetPlayerByUserIdAndSeasonRequestDTO,
  PaginatedPlayersWithUserResponse,
  PlayerResponseDTO,
  PlayerWithUserResponseDTO,
  UpdatePlayerFederationRequestDTO,
} from "../dtos/player/PlayerDTOs.js";
import { PlayerMapper } from "../dtos/player/PlayerMapper.js";

export class PlayerService {
  constructor(
    private readonly playerRepository: IPlayerRepository,
    private readonly userRepository: IUserRepository,
    private readonly tournamentRepository: ITournamentRepository,
    private readonly registeredParticipantRepository: IRegisteredParticipantRepository,
    private readonly tournamentResultRepository: ITournamentResultRepository,
  ) { }


  public async getAll(
    page?: number,
    limit?: number,
    status: PlayerStatus = PlayerStatus.ACTIVE,
  ): Promise<PlayerWithUserResponseDTO[] | PaginatedPlayersWithUserResponse> {
    if (page !== undefined && limit !== undefined) {
      const skip = (page - 1) * limit;
      const take = limit;

      const [players, total] = await Promise.all([
        this.playerRepository.findAllWithUser(skip, take, status),
        this.playerRepository.count(status),
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
    const players = await this.playerRepository.findAllWithUser(undefined, undefined, status);

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


  public async getUnregisteredPlayersInTournament(id: string): Promise<PlayerWithUserResponseDTO[]> {
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
    const allPlayers = await this.playerRepository.findAllBySeasonWithUser(tournament.getSeason().getStartYear());
    if (!allPlayers) {
      return [];
    }

    // 4. Filter players that are not registered in the tournament
    const registeredPlayerIds = registeredParticipants.map(participant => participant.getPlayerId());
    const unregisteredPlayers = allPlayers.filter(player => !registeredPlayerIds.includes(player.player.getId()));

    // 5. Return the players data
    return unregisteredPlayers.map(player => PlayerMapper.toResponseWithUser(player));
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

  public async delete(id: string): Promise<void> {
    // 1. Rehydrate the player from the DB
    const player = await this.playerRepository.findById(id);
    if (!player) {
      throw new PlayerNotFoundException();
    }

    // 2. Check if the player is already registered in a tournament or has tournament results
    const registeredParticipants = await this.registeredParticipantRepository.findAllByPlayerId(id);
    const tournamentResults = await this.tournamentResultRepository.findAllByPlayerId(id);
    const hasHistory = (registeredParticipants && registeredParticipants.length > 0) || (tournamentResults && tournamentResults.length > 0);

    if (hasHistory) {
      // 2.1. Player has a history in the system
      player.delete();
      await this.playerRepository.update(player);
    } else {
      // 2.2. Player does not have a history in the system
      await this.playerRepository.delete(id);
    }
  }

  public async restore(id: string): Promise<void> {
    // 1. Rehydrate the player from the DB
    const player = await this.playerRepository.findById(id);
    if (!player) {
      throw new PlayerNotFoundException();
    }

    // 2. Execute domain logic to change status to ACTIVE
    player.restore();

    // 3. Persist the changes in the DB
    await this.playerRepository.update(player);
  }
}
