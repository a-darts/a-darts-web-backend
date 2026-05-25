import { RegisteredParticipantNotFoundException } from '../../../../domain/exceptions/ParticipantExceptions.js';
import { TournamentAlreadyHasBracketException, TournamentNotFoundException } from '../../../../domain/exceptions/TournamentExceptions.js';
import { BracketRepository } from '../../../../domain/repositories/BracketRepository.js';
import { RegisteredParticipantRepository } from '../../../../domain/repositories/RegisteredParticipantRepository.js';
import { TournamentRepository } from '../../../../domain/repositories/TournamentRepository.js';
import { UnregisterParticipantInTournamentRequestDTO } from '../../../dtos/tournament/TournamentDTOs.js';


export class UnregisterParticipantFromTournament {
    constructor(
        private readonly tournamentRepository: TournamentRepository,
        private readonly bracketRepository: BracketRepository,
        private readonly registeredParticipantRepository: RegisteredParticipantRepository,
    ) { }

    public async execute(request: UnregisterParticipantInTournamentRequestDTO): Promise<void> {
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

        // 3. Check if the participant is not registered
        const registeredParticipant = await this.registeredParticipantRepository.findById(request.participantId);
        if (!registeredParticipant) {
            throw new RegisteredParticipantNotFoundException();
        }

        // 4. Unregister the participant from the tournament
        tournament.unregisterParticipant(request.participantId);

        // 5. Persist the changes in the DB
        // 5.1. Update the tournament registered participants ids
        await this.tournamentRepository.update(tournament);
        // 5.2. Delete the registered participant
        await this.registeredParticipantRepository.delete(
            request.participantId,
        );
    }
}
