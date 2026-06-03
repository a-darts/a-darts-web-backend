import { IPlayingAreaRepository } from "../../domain/ports/repositories/IPlayingAreaRepository.js";
import { TournamentCancelledEvent, TournamentFinishedEvent } from "../../domain/events/TournamentEvents.js";

export class DeletePlayingArea {
    constructor(
        private readonly playingAreaRepository: IPlayingAreaRepository,
    ) { }

    public async on(event: TournamentFinishedEvent | TournamentCancelledEvent): Promise<void> {
        const playingArea = await this.playingAreaRepository.findByTournamentId(event.tournamentId);
        if (playingArea) {
            await this.playingAreaRepository.delete(playingArea.getId());
        }
    }
}
