import { TournamentStatus } from '../../../domain/entities/Tournament.js';
import { BracketNotFoundException } from '../../../domain/exceptions/BracketExceptions.js';
import { InvalidTournamentStatusUpdateException, TournamentNotFoundException } from '../../../domain/exceptions/TournamentExceptions.js';
import { IBracketRepository } from '../../../domain/repositories/IBracketRepository.js';
import { TournamentRepository } from '../../../domain/repositories/TournamentRepository.js';
import { UnitOfWork } from '../../../domain/repositories/UnitOfWork.js';
import { MatchRepository } from '../../../domain/repositories/MatchRepository.js';
import { MatchStatus } from '../../../domain/entities/Match.js';

export class CancelTournament {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly tournamentRepository: TournamentRepository,
    private readonly bracketRepository: IBracketRepository,
    private readonly matchRepository: MatchRepository,
  ) { }

  public async execute(id: string): Promise<void> {
    // 1. Rehydrate the tournament from the DB
    const tournament = await this.tournamentRepository.findById(id);
    if (!tournament) {
      throw new TournamentNotFoundException();
    }

    // 2. Rehydrate the bracket from the DB
    const bracket = await this.bracketRepository.findByTournamentId(id);

    // 3. Rehydrate all the tournament matches from the DB
    const matches = await this.matchRepository.findManyByTournamentId(id);

    // 4. Cancel the tournament, the bracket and all not FINISHED matches
    tournament.cancel();
    if (bracket) {
      bracket.cancel();
    }
    const matchesToUpdate = matches.filter(m => m.getStatus() !== MatchStatus.FINISHED);
    for (const match of matchesToUpdate) {
      match.cancel();
    }

    // 5. Persist the changes in the DB
    await this.unitOfWork.transaction(async () => {
      await this.tournamentRepository.update(tournament);
      if (bracket) {
        await this.bracketRepository.update(bracket);
      }
      for (const match of matchesToUpdate) {
        await this.matchRepository.update(match);
      }
    });
  }
}
