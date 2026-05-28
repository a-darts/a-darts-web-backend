import { PlayingAreaNotFoundException } from '../../../domain/exceptions/PlayingAreaExceptions.js';
import { TournamentNotFoundException } from '../../../domain/exceptions/TournamentExceptions.js';
import { PlayingAreaRepository } from '../../../domain/repositories/PlayingAreaRepository.js';
import { TournamentRepository } from '../../../domain/repositories/TournamentRepository.js';
import { PlayingAreaResponseDTO } from '../../dtos/playingArea/PlayingAreaDTOs.js';
import { PlayingAreaMapper } from '../../dtos/playingArea/PlayingAreaMapper.js';

export class GetTournamentPlayingArea {
  constructor(
    private readonly tournamentRepository: TournamentRepository,
    private readonly playingAreaRepository: PlayingAreaRepository,
  ) { }

  public async execute(id: string): Promise<PlayingAreaResponseDTO> {
    // 1. Fetch the tournament in the DB
    const tournament = await this.tournamentRepository.findById(id);
    if (!tournament) {
      throw new TournamentNotFoundException();
    }

    // 2. Fetch the playing area in the DB
    const playingArea = await this.playingAreaRepository.findByTournamentId(id);
    if (!playingArea) {
      throw new PlayingAreaNotFoundException();
    }

    // 3. Return the tournament data
    return PlayingAreaMapper.toResponse(playingArea);
  }
}
