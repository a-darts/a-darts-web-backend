import { PlayingAreaNotFoundException } from '../../../domain/exceptions/PlayingAreaExceptions.js';
import { PlayingAreaRepository } from '../../../domain/repositories/PlayingAreaRepository.js';

export class RemoveLastBoardFromPlayingArea {
    constructor(
        private readonly playingAreaRepository: PlayingAreaRepository,
    ) { }

    public async execute(id: string): Promise<void> {
        // 1. Rehydrate the playing area from the DB
        const playingArea = await this.playingAreaRepository.findById(id);
        if (!playingArea) {
            throw new PlayingAreaNotFoundException();
        }

        // 2. Remove the last board from the playing area
        playingArea.removeLastBoard();

        // 3. Persist the changes in the DB
        await this.playingAreaRepository.update(playingArea);
    }
}
