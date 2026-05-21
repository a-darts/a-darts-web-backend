import { TournamentRepository } from "../../domain/repositories/TournamentRepository.js";
import { BracketFinishedEvent } from "../../domain/events/BracketFinishedEvent.js";

export class FinishTournamentOnBracketFinished {
    constructor(
        private readonly tournamentRepository: TournamentRepository,
    ) { }

    public async on(event: BracketFinishedEvent): Promise<void> {
        const tournament = await this.tournamentRepository.findById(event.tournamentId);
        if (tournament) {
            tournament.finish();
            await this.tournamentRepository.update(tournament);
        }
    }
}
