import { MatchStatus } from '../../../../domain/entities/Match.js';
import { InvalidMatchStatusUpdateException, MatchNotFoundException } from '../../../../domain/exceptions/MatchExceptions.js';
import { PlayingAreaNotFoundException } from '../../../../domain/exceptions/PlayingAreaExceptions.js';
import { MatchRepository } from '../../../../domain/repositories/MatchRepository.js';
import { PlayingAreaRepository } from '../../../../domain/repositories/PlayingAreaRepository.js';
import { UnitOfWork } from '../../../../domain/repositories/UnitOfWork.js';
import { UpdateMatchBoardNumberRequestDTO } from '../../../dtos/tournament/match/MatchDTOs.js';

export class UpdateMatchBoardNumber {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly matchRepository: MatchRepository,
    private readonly playingAreaRepository: PlayingAreaRepository,
  ) { }

  public async execute(request: UpdateMatchBoardNumberRequestDTO): Promise<void> {
    // 1. Rehydrate the match from the DB
    const match = await this.matchRepository.findById(request.id);
    if (!match) {
      throw new MatchNotFoundException();
    }

    // 2. Rehydrate the playing area from the DB
    const playingArea = await this.playingAreaRepository.findByTournamentId(match.getTournamentId());
    if (!playingArea) {
      throw new PlayingAreaNotFoundException();
    }

    // 3. Update the boardNumber in the match object
    match.assignBoardNumber(request.newBoardNumber);
    playingArea.reassignMatchToBoard(request.id, request.newBoardNumber);

    // 4. Persist the changes in the DB
    await this.unitOfWork.transaction(async () => {
      await this.playingAreaRepository.update(playingArea);
      await this.matchRepository.update(match);
    });
  }
}
