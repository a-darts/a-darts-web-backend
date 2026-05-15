import { BracketNotFoundException } from '../../../domain/exceptions/BracketExceptions.js';
import { TournamentNotFoundException } from '../../../domain/exceptions/TournamentExceptions.js';
import { BracketRepository } from '../../../domain/repositories/BracketRepository.js';
import { TournamentRepository } from '../../../domain/repositories/TournamentRepository.js';
import { UnitOfWork } from '../../../domain/repositories/UnitOfWork.js';
import { UpdateTournamentStatusRequestDTO } from '../../dtos/tournament/TournamentDTOs.js';

export class PublishTournament {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly tournamentRepository: TournamentRepository,
    private readonly bracketRepository: BracketRepository,
  ) { }

  public async execute(request: UpdateTournamentStatusRequestDTO): Promise<void> {
    // 1. Rehydrate the tournament from the DB
    const tournament = await this.tournamentRepository.findById(request.id);
    if (!tournament) {
      throw new TournamentNotFoundException();
    }

    // 2. Rehydrate the bracket from the DB
    const bracket = await this.bracketRepository.findByTournamentId(request.id);
    if (!bracket) {
      throw new BracketNotFoundException();
    }

    // 3. Update the status in the tournament and bracket
    tournament.publish();
    bracket.publish();

    // 4. Persist the changes in the DB
    await this.unitOfWork.transaction(async () => {
      await this.tournamentRepository.update(tournament);
      await this.bracketRepository.update(bracket);
    });
  }
}
