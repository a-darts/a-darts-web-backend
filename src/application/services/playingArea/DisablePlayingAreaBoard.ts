import { PlayingAreaNotFoundException } from '../../../domain/exceptions/PlayingAreaExceptions.js';
import { PlayingAreaRepository } from '../../../domain/repositories/PlayingAreaRepository.js';
import { DisablePlayingAreaBoardRequestDTO } from '../../dtos/playingArea/PlayingAreaDTOs.js';

export class DisablePlayingAreaBoard {
    constructor(
        private readonly playingAreaRepository: PlayingAreaRepository,
    ) { }

    public async execute(request: DisablePlayingAreaBoardRequestDTO): Promise<void> {
        // 1. Rehydrate the playing area from the DB
        const playingArea = await this.playingAreaRepository.findById(request.id);
        if (!playingArea) {
            throw new PlayingAreaNotFoundException();
        }

        // 2. Disable the board in the playing area
        playingArea.disableBoard(request.boardNumber);

        // 3. Persist the changes in the DB
        await this.playingAreaRepository.update(playingArea);
    }
}
