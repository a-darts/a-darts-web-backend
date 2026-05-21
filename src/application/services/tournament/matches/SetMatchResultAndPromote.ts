import { MatchNotFoundException, MatchNotInProgressException } from '../../../../domain/exceptions/MatchExceptions.js';
import { MatchRepository } from '../../../../domain/repositories/MatchRepository.js';
import { UnitOfWork } from '../../../../domain/repositories/UnitOfWork.js';

export class SetMatchResultAndPromote {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly matchRepository: MatchRepository,
  ) { }

  public async execute(
    id: string,
    p1Sets: number,
    p1Legs: number,
    p2Sets: number,
    p2Legs: number
  ): Promise<void> {
    // 1. Rehydrate the match from the DB
    const match = await this.matchRepository.findById(id);
    if (!match) {
      throw new MatchNotFoundException();
    }

    // 2. Set final score and finish the match
    match.setFinalScore(p1Sets, p1Legs, p2Sets, p2Legs);
    match.finish();

    // 3. Obtain the winner
    const winnerId = match.getWinnerId();

    // 4. Si no hay ganador (empate o error), solo guardamos el partido
    if (!winnerId) {
      await this.matchRepository.update(match);
      return;
    }

    // 5. Comprobamos que haya una diana
    const currentRound = match.getRound();
    const currentMatchIndex = match.getMatchIndex();

    const nextRound = currentRound + 1;
    const nextMatchIndex = Math.floor((currentMatchIndex - 1) / 2) + 1;
    const slot = (currentMatchIndex % 2 !== 0) ? 'P1' : 'P2';

    // Fetch the next match in the bracket
    const nextMatch = await this.matchRepository.findByTournamentRoundAndMatchIndex(
      match.getTournamentId(),
      nextRound,
      nextMatchIndex,
    );

    // If there is no next match, it means this was the final or the bracket is incomplete
    if (nextMatch) {
      // Promote the winner
      nextMatch.promoteWinner(winnerId, slot);
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
