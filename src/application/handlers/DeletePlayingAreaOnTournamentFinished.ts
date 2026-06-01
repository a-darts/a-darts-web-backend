import { IPlayingAreaRepository } from "../../domain/ports/repositories/IPlayingAreaRepository.js";
import { TournamentFinishedEvent } from "../../domain/events/TournamentEvents.js";

export class DeletePlayingAreaOnTournamentFinished {
    constructor(
        private readonly playingAreaRepository: IPlayingAreaRepository,
    ) { }

    public async on(event: TournamentFinishedEvent): Promise<void> {
        const playingArea = await this.playingAreaRepository.findByTournamentId(event.tournamentId);
        if (playingArea) {
            await this.playingAreaRepository.delete(playingArea.getId());
        }
    }
}
