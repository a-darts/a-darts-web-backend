import { PlayingAreaRepository } from "../../domain/repositories/PlayingAreaRepository.js";
import { TournamentFinishedEvent } from "../../domain/events/TournamentFinishedEvent.js";

export class DeletePlayingAreaOnTournamentFinished {
    constructor(
        private readonly playingAreaRepository: PlayingAreaRepository,
    ) { }

    public async on(event: TournamentFinishedEvent): Promise<void> {
        const playingArea = await this.playingAreaRepository.findByTournamentId(event.tournamentId);
        if (playingArea) {
            await this.playingAreaRepository.delete(playingArea.getId());
        }
    }
}
