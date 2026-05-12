import { RegisteredParticipantNotFoundException } from '../../../../domain/exceptions/ParticipantExceptions.js';
import { TournamentNotFoundException } from '../../../../domain/exceptions/TournamentExceptions.js';
import { RegisteredParticipantRepository } from '../../../../domain/repositories/RegisteredParticipantRepository.js';
import { TournamentRepository } from '../../../../domain/repositories/TournamentRepository.js';
import { UndoCheckInParticipantRequestDTO } from '../../../dtos/tournament/TournamentDTOs.js';


export class UndoCheckInParticipant {
    constructor(
        private readonly tournamentRepository: TournamentRepository,
        private readonly registeredParticipantRepository: RegisteredParticipantRepository,
    ) { }

    public async execute(request: UndoCheckInParticipantRequestDTO): Promise<void> {
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

        // 3. Check if the participant is already registered in this tournament
        const existingParticipant = await this.registeredParticipantRepository.findByTournamentIdAndPlayerId(
            request.id,
            registeredParticipant.getPlayerId(),
        );
        if (!existingParticipant) {
            throw new RegisteredParticipantNotFoundException();
        }

        // 4. Do check in participant
        registeredParticipant.undoCheckIn();

        // 5. Persist the changes in the DB
        await this.registeredParticipantRepository.update(
            registeredParticipant,
        );
    }
}
