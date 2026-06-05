import { TournamentNotFoundException } from "../../domain/exceptions/TournamentExceptions.js";
import { TournamentResultNotFoundException } from "../../domain/exceptions/TournamentResultException.js";
import { UserNotFoundException } from "../../domain/exceptions/UserExceptions.js";
import { IPlayerRepository } from "../../domain/ports/repositories/IPlayerRepository.js";
import { ITournamentRepository } from "../../domain/ports/repositories/ITournamentRepository.js";
import { ITournamentResultRepository } from "../../domain/ports/repositories/ITournamentResultRepository.js";
import { IUserRepository } from "../../domain/ports/repositories/IUserRepository.js";
import { TournamentResultDTO } from "../dtos/tournamentResult/TournamentResultDTO.js";
import { TournamentResultMapper } from "../dtos/tournamentResult/TournamentResultMapper.js";


export class TournamentResultsService {
    constructor(
        private readonly tournamentRepository: ITournamentRepository,
        private readonly tournamentResultRepository: ITournamentResultRepository,
        private readonly playerRepository: IPlayerRepository,
        private readonly userRepository: IUserRepository,
    ) { }

    public async getByTournamentId(tournamentId: string): Promise<TournamentResultDTO> {
        // 1. Rehydrate the tournament from the DB
        const tournament = await this.tournamentRepository.findById(tournamentId);
        if (!tournament) {
            throw new TournamentNotFoundException();
        }

        // 2. Rehydrate the results from the DB
        const tournamentResults = await this.tournamentResultRepository.findAllByTournamentIdWithPlayerAndUser(tournamentId);
        if (!tournamentResults || tournamentResults.length === 0) {
            throw new TournamentResultNotFoundException();
        }

        // 3. Return the results data
        return TournamentResultMapper.toResponse(tournamentResults);
    }


    public async getStatsByUserId(userId: string): Promise<any> {
        // 1. Rehydrate the user from the DB
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new UserNotFoundException();
        }

        // 2. Rehydrate all the player profiles of the user
        const playerProfiles = await this.playerRepository.findAllByUserId(userId);
        if (!playerProfiles || playerProfiles.length === 0) {
            return [];
        }

        // 3. Filter playerProfiles to obtain just the ids
        const playerIds = playerProfiles.map(player => player.getId());

        // 4. Fetch all the tournament results of the players
        const historicResults = await this.tournamentResultRepository.findAllByPlayerIdsWithTournament(playerIds);

        if (!historicResults || historicResults.length === 0) {
            return [];
        }

        // 5. Return the results data
        return TournamentResultMapper.toResponsePlayerStats(historicResults);
    }
}
