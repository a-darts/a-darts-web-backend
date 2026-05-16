import { TournamentNotFoundException } from '../../../../domain/exceptions/TournamentExceptions.js';
import { TournamentRepository } from '../../../../domain/repositories/TournamentRepository.js';

export class CloseRegistration {
    constructor(private readonly tournamentRepository: TournamentRepository) { }

    public async execute(id: string): Promise<void> {
        // 1. Rehydrate the tournament from the DB
        const tournament = await this.tournamentRepository.findById(id);
        if (!tournament) {
            throw new TournamentNotFoundException();
        }

        // 2. Open the registration in the tournament object
        tournament.closeRegistration();

        // 3. Persist the changes in the DB
        await this.tournamentRepository.update(tournament);
    }
}
