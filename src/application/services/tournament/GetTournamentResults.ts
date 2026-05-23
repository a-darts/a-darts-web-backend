import { TournamentResultDTO } from '../../dtos/tournament/result/TournamentResultDTO.js';
import { TournamentResultRepository } from '../../../domain/repositories/TournamentResultRepository.js';
import { TournamentResultNotFoundException } from '../../../domain/exceptions/TournamentResultException.js';
import { TournamentResultMapper } from '../../dtos/tournament/result/TournamentResultMapper.js';
import { TournamentRepository } from '../../../domain/repositories/TournamentRepository.js';
import { TournamentNotFoundException } from '../../../domain/exceptions/TournamentExceptions.js';

export class GetTournamentResults {
    constructor(
        private readonly tournamentRepository: TournamentRepository,
        private readonly tournamentResultRepository: TournamentResultRepository,
    ) { }

    public async execute(tournamentId: string): Promise<TournamentResultDTO> {
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
