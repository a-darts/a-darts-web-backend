import { RegisteredParticipantNotFoundException } from '../../../../domain/exceptions/ParticipantExceptions.js';
import { TournamentNotFoundException } from '../../../../domain/exceptions/TournamentExceptions.js';
import { RegisteredParticipantRepository } from '../../../../domain/repositories/RegisteredParticipantRepository.js';
import { TournamentRepository } from '../../../../domain/repositories/TournamentRepository.js';
import { UnregisterParticipantInTournamentRequestDTO } from '../../../dtos/tournament/TournamentDTOs.js';


export class UnregisterParticipantFromTournament {
    constructor(
        private readonly tournamentRepository: TournamentRepository,
        private readonly registeredParticipantRepository: RegisteredParticipantRepository,
    ) { }

    public async execute(request: UnregisterParticipantInTournamentRequestDTO): Promise<void> {
        // 1. Rehydrate the tournament from the DB
        const tournament = await this.tournamentRepository.findById(request.id);
        if (!tournament) {
            throw new TournamentNotFoundException();
        }

        // 2. Check if the participant is not registered
        const registeredParticipant = await this.registeredParticipantRepository.findById(request.participantId);
        if (!registeredParticipant) {
            throw new RegisteredParticipantNotFoundException();
        }

        // 3. Unregister the participant from the tournament
        tournament.unregisterParticipant(registeredParticipant.getPlayerId());

        // 4. Persist the changes in the DB
        // 4.1. Update the tournament registered participants ids
        await this.tournamentRepository.update(tournament);
        // 4.2. Delete the registered participant
        await this.registeredParticipantRepository.delete(
            request.participantId,
        );
    }
}
