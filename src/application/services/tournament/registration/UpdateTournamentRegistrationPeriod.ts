import { TournamentAlreadyHasBracketException, TournamentNotFoundException } from '../../../../domain/exceptions/TournamentExceptions.js';
import { BracketRepository } from '../../../../domain/repositories/BracketRepository.js';
import { TournamentRepository } from '../../../../domain/repositories/TournamentRepository.js';
import { UpdateTournamentRegistrationPeriodRequestDTO } from '../../../dtos/tournament/TournamentDTOs.js';

export class UpdateTournamentRegistrationPeriod {
    constructor(
        private readonly tournamentRepository: TournamentRepository,
        private readonly bracketRepository: BracketRepository,
    ) { }

    public async execute(request: UpdateTournamentRegistrationPeriodRequestDTO): Promise<void> {
        // 1. Rehydrate the tournament from the DB
        const tournament = await this.tournamentRepository.findById(request.id);
        if (!tournament) {
            throw new TournamentNotFoundException();
        }

        // 2. Check the tournament does not have a bracket
        const bracket = await this.bracketRepository.findByTournamentId(request.id);
        if (bracket) {
            throw new TournamentAlreadyHasBracketException();
        }

        // 3. Update the registration period in the tournament object
        tournament.scheduleRegistration(
            request.newRegistrationPeriod.startsAt,
            request.newRegistrationPeriod.endsAt,
        );

        // 4. Persist the changes in the DB
        await this.tournamentRepository.update(tournament);
    }
}
