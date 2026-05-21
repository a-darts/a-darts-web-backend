import { MatchNotFoundException, MatchNotInProgressException } from '../../../../domain/exceptions/MatchExceptions.js';
import { MatchRepository } from '../../../../domain/repositories/MatchRepository.js';

export class SetMatchResultAndPromote {
  constructor(private readonly matchRepository: MatchRepository) { }

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

    // 2. Set final score
    match.setFinalScore(p1Sets, p1Legs, p2Sets, p2Legs);

    // 3. Finish the match
    match.finish();

    // 4. Persist the current match changes
    await this.matchRepository.update(match);

    // 5. Promote winner to the next match
    const winnerId = match.getWinnerId();
    if (!winnerId) {
        // Tie or error (not promoting anyone)
        return;
    }

    const currentRound = match.getRound();
    const currentBoardNumber = match.getBoardNumber();

    // In some cases (e.g. final match) we shouldn't promote or board number might be null
    if (currentBoardNumber === null) {
        return;
    }

    const nextRound = currentRound + 1;
    // Calculate next board number. Matches pair up: (1,2)->1, (3,4)->2, etc.
    const nextBoardNumber = Math.floor((currentBoardNumber - 1) / 2) + 1;

    // Slot P1 for odd board numbers, P2 for even board numbers
    const slot = (currentBoardNumber % 2 !== 0) ? 'P1' : 'P2';

    // Fetch the next match in the bracket
    const nextMatch = await this.matchRepository.findByTournamentRoundAndBoardNumber(
      match.getTournamentId(),
      nextRound,
      nextBoardNumber
    );

    // If there is no next match, it means this was the final or the bracket is incomplete
    if (nextMatch) {
        // Promote the winner
        nextMatch.promoteWinner(winnerId, slot);
        
        // Persist the next match changes
        await this.matchRepository.update(nextMatch);
    }
  }
}
