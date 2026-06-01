import { TournamentNotFoundException } from "../../domain/exceptions/TournamentExceptions.js";
import { TournamentResultNotFoundException } from "../../domain/exceptions/TournamentResultException.js";
import { ITournamentRepository } from "../../domain/ports/repositories/ITournamentRepository.js";
import { ITournamentResultRepository } from "../../domain/ports/repositories/ITournamentResultRepository.js";
import { TournamentResultDTO } from "../dtos/tournament/result/TournamentResultDTO.js";
import { TournamentResultMapper } from "../dtos/tournament/result/TournamentResultMapper.js";


export class TournamentResultsService {
    constructor(
        private readonly tournamentRepository: ITournamentRepository,
        private readonly tournamentResultRepository: ITournamentResultRepository,
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
}
