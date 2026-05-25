import { TournamentAlreadyHasBracketException, TournamentNotFoundException } from '../../../../domain/exceptions/TournamentExceptions.js';
import { BracketRepository } from '../../../../domain/repositories/BracketRepository.js';
import { TournamentRepository } from '../../../../domain/repositories/TournamentRepository.js';

export class OpenRegistration {
    constructor(
        private readonly tournamentRepository: TournamentRepository,
        private readonly bracketRepository: BracketRepository,
    ) { }

    public async execute(id: string): Promise<void> {
        // 1. Rehydrate the tournament from the DB
        const tournament = await this.tournamentRepository.findById(id);
        if (!tournament) {
            throw new TournamentNotFoundException();
        }

        // 2. Check the tournament does not have a bracket
        const bracket = await this.bracketRepository.findByTournamentId(id);
        if (bracket) {
            throw new TournamentAlreadyHasBracketException();
        }

        // 3. Open the registration in the tournament object
        tournament.openRegistration();

        // 4. Persist the changes in the DB
        await this.tournamentRepository.update(tournament);
    }
}
