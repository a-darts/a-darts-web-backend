import { RegistrationStatus } from '../../../../domain/entities/Registration.js';
import { InvalidRegistrationStatusException } from '../../../../domain/exceptions/RegistrationExceptions.js';
import { TournamentNotFoundException } from '../../../../domain/exceptions/TournamentExceptions.js';
import { TournamentRepository } from '../../../../domain/repositories/TournamentRepository.js';
import { UpdateTournamentRegistrationStatusRequestDTO } from '../../../dtos/tournament/TournamentDTOs.js';

export class UpdateTournamentRegistrationStatus {
    constructor(private readonly tournamentRepository: TournamentRepository) { }

    public async execute(request: UpdateTournamentRegistrationStatusRequestDTO): Promise<void> {
        // 1. Rehydrate the tournament from the DB
        const tournament = await this.tournamentRepository.findById(request.id);
        if (!tournament) {
            throw new TournamentNotFoundException();
        }

        // 2. Update the registration status in the tournament object
        switch (request.newRegistrationStatus) {
            case RegistrationStatus.OPEN:
                tournament.openRegistration();
                break;
            case RegistrationStatus.CLOSED:
                tournament.closeRegistration();
                break;
            default:
                throw new InvalidRegistrationStatusException();
        }

        // 3. Persist the changes in the DB
        await this.tournamentRepository.update(tournament);
    }
}
