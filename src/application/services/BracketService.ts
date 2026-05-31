import { Bracket } from "../../domain/entities/Bracket.js";
import { EmptyParticipant, ByeParticipant, IParticipant } from '../../domain/entities/Participant.js';

import { RegistrationNotClosedException } from "../../domain/exceptions/RegistrationExceptions.js";
import { TournamentNotFoundException } from "../../domain/exceptions/TournamentExceptions.js";
import { BracketNotFoundException } from "../../domain/exceptions/BracketExceptions.js";
import { RegisteredParticipantNotFoundException } from '../../domain/exceptions/ParticipantExceptions.js';

import { IBracketRepository } from "../../domain/repositories/IBracketRepository.js";
import { IRegisteredParticipantRepository } from "../../domain/repositories/IRegisteredParticipantRepository.js";
import { ITournamentRepository } from "../../domain/repositories/ITournamentRepository.js";

import { UnitOfWork } from "../../domain/repositories/UnitOfWork.js";
import { BracketSeedingService } from "../../domain/services/BracketSeedingService.js";

import {
    BracketResponseDTO,
    CreateBracketRequestDTO,
    AssignParticipantToBracketPositionRequestDTO,
    ReshuffleBracketRequestDTO,
} from "../dtos/bracket/BracketDTOs.js";
import { BracketMapper } from "../dtos/bracket/BracketMapper.js";



export class BracketService {
    constructor(
        private readonly bracketRepository: IBracketRepository,
        private readonly tournamentRepository: ITournamentRepository,
        private readonly registeredParticipantRepository: IRegisteredParticipantRepository,
        private readonly unitOfWork: UnitOfWork,
        private readonly seedingService: BracketSeedingService,
    ) { }

    public async getByTournamentId(id: string): Promise<BracketResponseDTO> {
        // 1. Fetch the tournament in the DB
        const tournament = await this.tournamentRepository.findById(id);
        if (!tournament) {
            throw new TournamentNotFoundException();
        }

        // 2. Fetch the bracket in the DB
        const bracket = await this.bracketRepository.findByTournamentId(id);
        if (!bracket) {
            throw new BracketNotFoundException();
        }

        // 3. Return the tournament data
        return BracketMapper.toResponse(bracket);
    }


    public async createManually(request: CreateBracketRequestDTO): Promise<BracketResponseDTO> {
        // 1. Rehydrate the tournament object
        const tournament = await this.tournamentRepository.findById(request.id);
        if (!tournament) {
            throw new TournamentNotFoundException();
        }

        // 2. Check tournament registration is closed
        if (!tournament.isRegistrationClosed()) {
            throw new RegistrationNotClosedException();
        }

        const participantsCount = await this.registeredParticipantRepository.countByTournamentId(request.id);

        // 3. Create the bracket (with manual factory method)
        const bracket = Bracket.createManualEmpty(
            request.id,
            participantsCount,
            this.seedingService,
        );

        // 4. Persist the changes in the DB
        await this.unitOfWork.transaction(async () => {
            await this.bracketRepository.create(bracket);
            await this.tournamentRepository.update(tournament);
        });

        // 5. Return the bracket data
        return BracketMapper.toResponse(bracket);
    }

    public async createAutomatically(request: CreateBracketRequestDTO): Promise<BracketResponseDTO> {
        // 1. Rehydrate the tournament object
        const tournament = await this.tournamentRepository.findById(request.id);
        if (!tournament) {
            throw new TournamentNotFoundException();
        }

        // 2. Check tournament registration is closed
        if (!tournament.isRegistrationClosed()) {
            throw new RegistrationNotClosedException();
        }

        // 3. Obtain the participants from the tournament
        const participants = await this.registeredParticipantRepository.findAllByTournamentId(request.id);

        // 4. Create the bracket (with auto factory method)
        const bracket = Bracket.createAutomatically(
            request.id,
            participants,
            this.seedingService,
        );

        // 4. Persist the changes in the DB
        await this.unitOfWork.transaction(async () => {
            await this.bracketRepository.create(bracket);
            await this.tournamentRepository.update(tournament);
        });

        // 5. Return the bracket data
        return BracketMapper.toResponse(bracket);
    }

    public async delete(id: string): Promise<void> {
        // 1. Rehydrate the bracket from the DB
        const bracket = await this.bracketRepository.findById(id);
        if (!bracket) {
            throw new BracketNotFoundException();
        }

        // 2. Delete the bracket
        bracket.delete();

        // 3. Delte the bracket in the DB
        await this.bracketRepository.delete(id);
    }

    public async assignParticipantToBracketPosition(request: AssignParticipantToBracketPositionRequestDTO): Promise<void> {
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

    public async reshuffle(request: ReshuffleBracketRequestDTO): Promise<BracketResponseDTO> {
        // 1. Rehydrate the bracket from the DB
        const bracket = await this.bracketRepository.findById(request.id);
        if (!bracket) {
            throw new BracketNotFoundException();
        }

        // 2. Swap the positions in the bracket
        bracket.reshuffle(this.seedingService);

        // 3. Persist the changes in the DB
        await this.bracketRepository.update(bracket);

        // 4. Return the updated bracket data
        return BracketMapper.toResponse(bracket);
    }

    public async publish(id: string): Promise<void> {
        // 1. Rehydrate the bracket from the DB
        const bracket = await this.bracketRepository.findById(id);
        if (!bracket) {
            throw new BracketNotFoundException();
        }

        // 2. Update the status in the bracket object
        bracket.publish();

        // 3. Persist the changes in the DB
        await this.bracketRepository.update(bracket);
    }

    public async unpublish(id: string): Promise<void> {
        // 1. Rehydrate the bracket from the DB
        const bracket = await this.bracketRepository.findById(id);
        if (!bracket) {
            throw new BracketNotFoundException();
        }

        // 2. Update the status in the bracket object
        bracket.unpublish();

        // 3. Persist the changes in the DB
        await this.bracketRepository.update(bracket);
    }
}