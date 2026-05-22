import { PlayingAreaNotFoundException } from '../../../domain/exceptions/PlayingAreaExceptions.js';
import { PlayingAreaRepository } from '../../../domain/repositories/PlayingAreaRepository.js';

export class AddBoardInPlayingArea {
    constructor(
        private readonly playingAreaRepository: PlayingAreaRepository,
    ) { }

    public async execute(id: string): Promise<void> {
        // 1. Rehydrate the playing area from the DB
        const playingArea = await this.playingAreaRepository.findById(id);
        if (!playingArea) {
            throw new PlayingAreaNotFoundException();
        }

        // 2. Add a new board in the playing area
        playingArea.addBoard();

        // 3. Persist the changes in the DB
        await this.playingAreaRepository.update(playingArea);
    }
}
