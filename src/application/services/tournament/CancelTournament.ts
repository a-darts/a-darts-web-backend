import { TournamentStatus } from '../../../domain/entities/Tournament.js';
import { BracketNotFoundException } from '../../../domain/exceptions/BracketExceptions.js';
import { InvalidTournamentStatusUpdateException, TournamentNotFoundException } from '../../../domain/exceptions/TournamentExceptions.js';
import { BracketRepository } from '../../../domain/repositories/BracketRepository.js';
import { TournamentRepository } from '../../../domain/repositories/TournamentRepository.js';
import { UpdateTournamentStatusRequestDTO } from '../../dtos/tournament/TournamentDTOs.js';

export class UpdateTournamentStatus {
  constructor(
    private readonly tournamentRepository: TournamentRepository,
    private readonly bracketRepository: BracketRepository,
  ) { }

  public async execute(request: UpdateTournamentStatusRequestDTO): Promise<void> {
    // 1. Rehydrate the tournament from the DB
    const tournament = await this.tournamentRepository.findById(request.id);
    if (!tournament) {
      throw new TournamentNotFoundException();
    }

    // 2. Update the status in the tournament object
    switch (request.newStatus) {
      case TournamentStatus.PUBLISHED:
        tournament.publish();
        break;
      case TournamentStatus.IN_PROGRESS:
        const bracket = await this.bracketRepository.findByTournamentId(request.id);
        if (!bracket) {
          throw new BracketNotFoundException();
        }
        tournament.start();
        bracket.start();
        const initialMatches = bracket.generateInitialMatches();

        await this.unitOfWork.transaction(async () => {
          await this.tournamentRepository.save(tournament);
          await this.bracketRepository.save(bracket);
          for (const match of initialMatches) {
            await this.matchRepository.save(match);
          }
        });

        break;
      case TournamentStatus.FINISHED:
        tournament.finish();
        break;
      case TournamentStatus.CANCELLED:
        tournament.cancel();
        break;
      default:
        throw new InvalidTournamentStatusUpdateException();
    }

    // 3. Persist the changes in the DB
    await this.tournamentRepository.update(tournament);
  }
}
