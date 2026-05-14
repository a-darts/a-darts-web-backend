import { Bracket } from '../../../domain/entities/Bracket.js';
import { CreateBracketRequestDTO, BracketResponseDTO } from '../../dtos/bracket/BracketDTOs.js';
import { BracketMapper } from '../../dtos/bracket/BracketMapper.js';
import { BracketRepository } from '../../../domain/repositories/BracketRepository.js';
import { TournamentRepository } from '../../../domain/repositories/TournamentRepository.js';
import { RegisteredParticipantRepository } from '../../../domain/repositories/RegisteredParticipantRepository.js';
import { TournamentNotFoundException } from '../../../domain/exceptions/TournamentExceptions.js';
import { BracketAlreadyExistsException } from '../../../domain/exceptions/BracketExceptions.js';
import { RegistratedParticipantsEmptyException, RegistratedParticipantsNotEnoughException } from '../../../domain/exceptions/ParticipantExceptions.js';
import { RegisteredParticipant } from '../../../domain/entities/Participant.js';

export class CreateBracket {
    constructor(
        private readonly bracketRepository: BracketRepository,
        private readonly tournamentRepository: TournamentRepository,
        private readonly registeredParticipantRepository: RegisteredParticipantRepository,
    ) { }

    public async execute(request: CreateBracketRequestDTO): Promise<BracketResponseDTO> {
        // 1. Rehydrate the tournament object
        const tournament = await this.tournamentRepository.findById(request.id);
        if (!tournament) {
            throw new TournamentNotFoundException();
        }

        // 2. Check if the tournament already has a bracket
        const existingBracket = await this.bracketRepository.findByTournamentId(request.id);
        if (existingBracket) {
            throw new BracketAlreadyExistsException();
        }

        // 3. Obtain the participants from the tournament
        const participants = await this.registeredParticipantRepository.findAllByTournamentId(request.id);
        if (participants.length === 0) {
            throw new RegistratedParticipantsEmptyException();
        }
        if (participants.length < 2) {
            throw new RegistratedParticipantsNotEnoughException(2, participants.length);
        }

        // 4. Create the bracket (with the factory method)
        const bracket = Bracket.create(
            request.id,
            participants,
        );

        // 5. Persist the bracket in the DB
        await this.bracketRepository.create(bracket);

        // 6. Return the bracket data
        return BracketMapper.toResponse(bracket);
    }
}
