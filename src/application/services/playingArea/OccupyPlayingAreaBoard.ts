import { MatchNotFoundException } from '../../../domain/exceptions/MatchExceptions.js';
import { PlayingAreaNotFoundException } from '../../../domain/exceptions/PlayingAreaExceptions.js';
import { MatchRepository } from '../../../domain/repositories/MatchRepository.js';
import { PlayingAreaRepository } from '../../../domain/repositories/PlayingAreaRepository.js';
import { OccupyPlayingAreaBoardRequestDTO } from '../../dtos/playingArea/PlayingAreaDTOs.js';

export class OccupyPlayingAreaBoard {
    constructor(
        private readonly playingAreaRepository: PlayingAreaRepository,
        private readonly matchRepository: MatchRepository,
    ) { }

    public async execute(request: OccupyPlayingAreaBoardRequestDTO): Promise<void> {
        // 1. Rehydrate the playing area from the DB
        const playingArea = await this.playingAreaRepository.findById(request.id);
        if (!playingArea) {
            throw new PlayingAreaNotFoundException();
        }

        // 2. Rehydrate the match from the DB
        const match = await this.matchRepository.findById(request.matchId);
        if (!match) {
            throw new MatchNotFoundException();
        }

        // 3. Occupy the board in the playing area
        playingArea.assignMatchToBoard(request.matchId, request.boardNumber);

        // 4. Persist the changes in the DB
        await this.playingAreaRepository.update(playingArea);
    }
}
