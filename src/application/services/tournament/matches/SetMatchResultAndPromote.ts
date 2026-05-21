import { BracketNotFoundException } from '../../../../domain/exceptions/BracketExceptions.js';
import { MatchNotFoundException, MatchNotInProgressException } from '../../../../domain/exceptions/MatchExceptions.js';
import { BracketRepository } from '../../../../domain/repositories/BracketRepository.js';
import { MatchRepository } from '../../../../domain/repositories/MatchRepository.js';
import { UnitOfWork } from '../../../../domain/repositories/UnitOfWork.js';
import { SetMatchResultRequestDTO } from '../../../dtos/tournament/match/MatchDTOs.js';

export class SetMatchResultAndPromote {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly matchRepository: MatchRepository,
    private readonly bracketRepository: BracketRepository,
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

    // 2. Set final score and finish the match
    match.setFinalScore(
      request.participant1Sets,
      request.participant1Legs,
      request.participant2Sets,
      request.participant2Legs,
    );
    match.finish();

    // 3. Obtain the winner
    const winnerId = match.getWinnerId();
    let nextMatch = null;

    // Si no era la final, promocionamos al ganador a la siguiente partida
    if (winnerId) {
      const nextCoords = bracket.getNextMatchCoordinatesFor(match);

      // Si no era la final, promocionamos al ganador a la siguiente partida
      if (nextCoords) {
        nextMatch = await this.matchRepository.findByTournamentRoundAndMatchIndex(
          match.getTournamentId(),
          nextCoords.round,
          nextCoords.matchIndex,
        );
        if (nextMatch) {
          bracket.advanceWinner(match, nextMatch);
        }
      }
    }

    // Persist the next match changes
    await this.unitOfWork.transaction(async () => {
      await this.matchRepository.update(match);
      if (nextMatch) {
        await this.matchRepository.update(nextMatch);
      }
    });
  }
}
