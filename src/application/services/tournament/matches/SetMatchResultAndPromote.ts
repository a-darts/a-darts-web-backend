import { EventBus } from '../../../../domain/events/EventBus.js';
import { BracketNotFoundException } from '../../../../domain/exceptions/BracketExceptions.js';
import { MatchNotFoundException, MatchNotInProgressException } from '../../../../domain/exceptions/MatchExceptions.js';
import { SingleEliminationMatchGenerator } from '../../../../domain/services/SingleEliminationMatchGenerator.js';
import { BracketRepository } from '../../../../domain/repositories/BracketRepository.js';
import { MatchRepository } from '../../../../domain/repositories/MatchRepository.js';
import { UnitOfWork } from '../../../../domain/repositories/UnitOfWork.js';
import { SetMatchResultRequestDTO } from '../../../dtos/tournament/match/MatchDTOs.js';
import { PlayingAreaRepository } from '../../../../domain/repositories/PlayingAreaRepository.js';
import { PlayingAreaNotFoundException } from '../../../../domain/exceptions/PlayingAreaExceptions.js';

export class SetMatchResultAndPromote {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly matchRepository: MatchRepository,
    private readonly bracketRepository: BracketRepository,
    private readonly playingAreaRepository: PlayingAreaRepository,
    private readonly matchGenerator: SingleEliminationMatchGenerator,
    private readonly eventBus: EventBus,
  ) { }

  public async execute(request: SetMatchResultRequestDTO): Promise<void> {
    // 1. Rehydrate the match from the DB
    const match = await this.matchRepository.findById(request.id);
    if (!match) {
      throw new MatchNotFoundException();
    }

    // 2. Rehydrate the bracket from the DB
    const bracket = await this.bracketRepository.findByTournamentId(match.getTournamentId());
    if (!bracket) {
      throw new BracketNotFoundException();
    }

    // 3. Rehydrate the playing area from the DB
    const playingArea = await this.playingAreaRepository.findByTournamentId(match.getTournamentId());
    if (!playingArea) {
      throw new PlayingAreaNotFoundException();
    }

    // 4. Set final score and finish the match
    match.setFinalScore(
      request.participant1Sets,
      request.participant1Legs,
      request.participant2Sets,
      request.participant2Legs,
    );
    match.finish();
    const matchBoardNumber = match.getBoardNumber();
    if (matchBoardNumber) {
      playingArea.releaseBoard(matchBoardNumber);
    }

    // 5. Obtain the winner
    const winnerId = match.getWinnerId();
    let nextMatch = null;

    // 6. Si no era la final, promocionamos al ganador a la siguiente partida
    if (winnerId) {
      const nextCoords = this.matchGenerator.getNextMatchCoordinates(
        match.getRound(),
        match.getMatchIndex(),
        bracket.getPositions().length,
      );

      if (nextCoords) {
        nextMatch = await this.matchRepository.findByTournamentRoundAndMatchIndex(
          match.getTournamentId(),
          nextCoords.round,
          nextCoords.matchIndex,
        );
        if (nextMatch) {
          nextMatch.promoteWinner(winnerId, nextCoords.slot);
        }
      } else {
        bracket.finish();
      }
    }

    // 7. Persist the next match changes and bracket status
    await this.unitOfWork.transaction(async () => {
      await this.bracketRepository.update(bracket);
      await this.matchRepository.update(match);
      if (nextMatch) {
        await this.matchRepository.update(nextMatch);
      }
      await this.playingAreaRepository.update(playingArea);
    });

    const events = bracket.pullEvents();
    if (events.length > 0) {
      await this.eventBus.publish(events);
    }
  }
}
