import { BracketNotFoundException, BracketUnfinishedException } from '../../../domain/exceptions/BracketExceptions.js';
import { TournamentNotFoundException } from '../../../domain/exceptions/TournamentExceptions.js';
import { BracketRepository } from '../../../domain/repositories/BracketRepository.js';
import { MatchRepository } from '../../../domain/repositories/MatchRepository.js';
import { TournamentRepository } from '../../../domain/repositories/TournamentRepository.js';
import { UnitOfWork } from '../../../domain/repositories/UnitOfWork.js';

export class StartTournament {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly tournamentRepository: TournamentRepository,
    private readonly bracketRepository: BracketRepository,
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
    if (!bracket) {
      throw new BracketNotFoundException();
    }

    // 2.5. Check that all bracket positions are occupied by real participants
    const realParticipantsInBracket = bracket
      .getPositions()
      .filter((position) => !position.isBye() && !position.isEmpty()).length;

    const registeredParticipantsInTournament = tournament
      .getRegistration()
      .getRegisteredParticipantsCount();

    if (realParticipantsInBracket !== registeredParticipantsInTournament) {
      throw new BracketUnfinishedException();
    }

    // 3. Start the tournament, the bracket and generate the initial matches
    tournament.start();
    bracket.start();

    const initialMatches = bracket.generateInitialMatches();

    // 4. Persist the changes in the DB
    await this.unitOfWork.transaction(async () => {
      await this.tournamentRepository.update(tournament);
      await this.bracketRepository.update(bracket);
      for (const match of initialMatches) {
        await this.matchRepository.create(match);
      }
    });
  }
}
