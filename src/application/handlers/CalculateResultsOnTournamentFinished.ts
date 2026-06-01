import { IBracketRepository } from "../../domain/ports/repositories/IBracketRepository.js";
import { IMatchRepository } from "../../domain/ports/repositories/IMatchRepository.js";
import { ITournamentResultRepository } from "../../domain/ports/repositories/ITournamentResultRepository.js";
import { TournamentFinishedEvent } from "../../domain/events/TournamentFinishedEvent.js";
import { CalculateTournamentResultsService } from "../../domain/services/CalculateTournamentResultsService.js";

export class CalculateResultsOnTournamentFinished {
    private calculateService: CalculateTournamentResultsService;

    constructor(
        private readonly bracketRepository: IBracketRepository,
        private readonly matchRepository: IMatchRepository,
        private readonly tournamentResultRepository: ITournamentResultRepository,
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
