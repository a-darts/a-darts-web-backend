import { ITournamentRepository } from "../../domain/repositories/ITournamentRepository.js";
import { BracketFinishedEvent } from "../../domain/events/BracketFinishedEvent.js";
import { EventBus } from "../../domain/events/EventBus.js";

export class FinishTournamentOnBracketFinished {
    constructor(
        private readonly tournamentRepository: ITournamentRepository,
        private readonly eventBus: EventBus,
    ) { }

    public async on(event: BracketFinishedEvent): Promise<void> {
        const tournament = await this.tournamentRepository.findById(event.tournamentId);
        if (tournament) {
            tournament.finish();
            await this.tournamentRepository.update(tournament);
            
            const events = tournament.pullEvents();
            if (events.length > 0) {
                await this.eventBus.publish(events);
            }
        }
    }
}
