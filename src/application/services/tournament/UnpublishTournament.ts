import { TournamentNotFoundException } from '../../../domain/exceptions/TournamentExceptions.js';
import { BracketRepository } from '../../../domain/repositories/BracketRepository.js';
import { TournamentRepository } from '../../../domain/repositories/TournamentRepository.js';
import { UnitOfWork } from '../../../domain/repositories/UnitOfWork.js';

export class UnpublishTournament {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly tournamentRepository: TournamentRepository,
    private readonly bracketRepository: BracketRepository,
  ) { }

  public async execute(id: string): Promise<void> {
    // 1. Rehydrate the tournament from the DB
    const tournament = await this.tournamentRepository.findById(id);
    if (!tournament) {
      throw new TournamentNotFoundException();
    }

    // 2. Rehydrate the bracket from the DB
    const bracket = await this.bracketRepository.findByTournamentId(id);

    // 3. Update the status in the tournament and bracket
    tournament.unpublish();
    if (bracket) {
      bracket.unpublish();
    }

    // 4. Persist the changes in the DB
    await this.unitOfWork.transaction(async () => {
      await this.tournamentRepository.update(tournament);
      if (bracket) {
        await this.bracketRepository.update(bracket);
      }
    });
  }
}
