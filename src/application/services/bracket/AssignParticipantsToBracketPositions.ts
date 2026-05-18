import { EmptyParticipant, ByeParticipant, IParticipant } from '../../../domain/entities/Participant.js';
import { BracketNotFoundException } from '../../../domain/exceptions/BracketExceptions.js';
import { RegisteredParticipantNotFoundException } from '../../../domain/exceptions/ParticipantExceptions.js';
import { BracketRepository } from '../../../domain/repositories/BracketRepository.js';
import { RegisteredParticipantRepository } from '../../../domain/repositories/RegisteredParticipantRepository.js';
import { AssignParticipantToBracketPositionRequestDTO } from '../../dtos/bracket/BracketDTOs.js';

export class AssignParticipantsToBracketPositions {
    constructor(
        private readonly bracketRepository: BracketRepository,
        private readonly registeredParticipantRepository: RegisteredParticipantRepository,
    ) { }

    public async execute(request: AssignParticipantToBracketPositionRequestDTO): Promise<void> {
        // 1. Rehydrate the bracket from the DB
        const bracket = await this.bracketRepository.findById(request.id);
        if (!bracket) {
            throw new BracketNotFoundException();
        }

        // 2. Fetch all registered participants for the tournament
        const allTournamentParticipants = await this.registeredParticipantRepository.findAllByTournamentId(bracket.getTournamentId());

        // Count how many unique real registered participants are assigned in the payload
        const assignedParticipantIds = new Set(
            request.newPositions
                .map(p => p.participantId)
                .filter(Boolean)
        );

        // If all registered participants have been placed in the bracket,
        // any remaining empty positions become Byes. Otherwise they remain empty.
        const allParticipantsAssigned = assignedParticipantIds.size === allTournamentParticipants.length;

        const newPositionsData = await Promise.all(
            request.newPositions.map(async (positionData) => {
                let participant: IParticipant = allParticipantsAssigned
                    ? ByeParticipant.create()
                    : EmptyParticipant.create();
                if (positionData.participantId) {
                    const registeredParticipant = await this.registeredParticipantRepository.findById(
                        positionData.participantId,
                    );
                    if (!registeredParticipant) {
                        throw new RegisteredParticipantNotFoundException();
                    }
                    participant = registeredParticipant;
                }
                return {
                    position: positionData.position,
                    participant,
                };
            })
        );

        // 3. Assign the participant to the position in the bracket
        bracket.setupPositions(newPositionsData);

        // 4. Persist the changes in the DB
        await this.bracketRepository.update(bracket);
    }
}
