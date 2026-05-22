import { BracketRepository } from "../../domain/repositories/BracketRepository.js";
import { MatchRepository } from "../../domain/repositories/MatchRepository.js";
import { TournamentResultRepository } from "../../domain/repositories/TournamentResultRepository.js";
import { TournamentFinishedEvent } from "../../domain/events/TournamentFinishedEvent.js";
import { CalculateTournamentResultsService } from "../../domain/services/CalculateTournamentResultsService.js";

export class CalculateResultsOnTournamentFinished {
    private calculateService: CalculateTournamentResultsService;

    constructor(
        private readonly bracketRepository: BracketRepository,
        private readonly matchRepository: MatchRepository,
        private readonly tournamentResultRepository: TournamentResultRepository,
    ) {
        this.calculateService = new CalculateTournamentResultsService();
    }

    public async on(event: TournamentFinishedEvent): Promise<void> {
        const bracket = await this.bracketRepository.findByTournamentId(event.tournamentId);
        if (!bracket) return; // No bracket, no results to calculate

        const matches = await this.matchRepository.findManyByTournamentId(event.tournamentId);
        if (matches.length === 0) return;

        // Calculate results
        const results = this.calculateService.execute(bracket, matches);

        // Save results
        if (results.length > 0) {
            await this.tournamentResultRepository.createMany(results);
        }
    }
}
