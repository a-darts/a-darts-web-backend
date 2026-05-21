import { PlayingAreaNotFoundException } from '../../../domain/exceptions/PlayingAreaExceptions.js';
import { PlayingAreaRepository } from '../../../domain/repositories/PlayingAreaRepository.js';
import { ReleasePlayingAreaBoardRequestDTO } from '../../dtos/playingArea/PlayingAreaDTOs.js';

export class ReleasePlayingAreaBoard {
    constructor(
        private readonly playingAreaRepository: PlayingAreaRepository,
    ) { }

    public async execute(request: ReleasePlayingAreaBoardRequestDTO): Promise<void> {
        // 1. Rehydrate the playing area from the DB
        const playingArea = await this.playingAreaRepository.findById(request.id);
        if (!playingArea) {
            throw new PlayingAreaNotFoundException();
        }

        // 2. Release the board in the playing area
        playingArea.releaseBoard(request.boardNumber);

        // 3. Persist the changes in the DB
        await this.playingAreaRepository.update(playingArea);
    }
}
