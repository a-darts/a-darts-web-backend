import { TournamentRepository } from '../../../domain/repositories/TournamentRepository.js';
import { TournamentNotFoundException } from '../../../domain/exceptions/TournamentExceptions.js';
import { PlayingAreaRepository } from '../../../domain/repositories/PlayingAreaRepository.js';
import { CreatePlayingAreaRequestDTO, PlayingAreaResponseDTO } from '../../dtos/playingArea/PlayingAreaDTOs.js';
import { PlayingAreaAlreadyExistsException } from '../../../domain/exceptions/PlayingAreaExceptions.js';
import { PlayingArea } from '../../../domain/entities/PlayingArea.js';
import { PlayingAreaMapper } from '../../dtos/playingArea/PlayingAreaMapper.js';

export class CreateTournamentPlayingArea {
    constructor(
        private readonly tournamentRepository: TournamentRepository,
        private readonly playingAreaRepository: PlayingAreaRepository,
    ) { }

    public async execute(request: CreatePlayingAreaRequestDTO): Promise<PlayingAreaResponseDTO> {
        // 1. Rehydrate the tournament object
        const tournament = await this.tournamentRepository.findById(request.id);
        if (!tournament) {
            throw new TournamentNotFoundException();
        }

        // 2. Check the player area not exists yet
        const existingPlayingArea = await this.playingAreaRepository.findByTournamentId(request.id);
        if (existingPlayingArea) {
            throw new PlayingAreaAlreadyExistsException();
        }

        // 3. Create the playing area
        const playingArea = PlayingArea.create(request.id, request.numBoards);

        // 4. Persist the playing area in the DB
        await this.playingAreaRepository.create(playingArea);

        // 5. Return the playing area data
        return PlayingAreaMapper.toResponse(playingArea);
    }
}
