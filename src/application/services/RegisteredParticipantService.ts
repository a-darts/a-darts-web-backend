import { RegisteredParticipant } from "../../domain/entities/Participant.js";
import { ParticipantAlreadyRegisteredException, ParticipantNotRegisteredException, RegisteredParticipantNotFoundException } from "../../domain/exceptions/ParticipantExceptions.js";
import { InvalidRegisteredPlayerSeasonException, PlayerNotFoundException } from "../../domain/exceptions/PlayerExceptions.js";
import { RegistrationAlreadyClosedException } from "../../domain/exceptions/RegistrationExceptions.js";
import { TournamentAlreadyHasBracketException, TournamentMaxPlayersExceededException, TournamentNotFoundException } from "../../domain/exceptions/TournamentExceptions.js";
import { UserNotFoundException } from "../../domain/exceptions/UserExceptions.js";
import { IBracketRepository } from "../../domain/ports/repositories/IBracketRepository.js";
import { IPlayerRepository } from "../../domain/ports/repositories/IPlayerRepository.js";
import { IRegisteredParticipantRepository } from "../../domain/ports/repositories/IRegisteredParticipantRepository.js";
import { ITournamentRepository } from "../../domain/ports/repositories/ITournamentRepository.js";
import { IUserRepository } from "../../domain/ports/repositories/IUserRepository.js";
import { RegisteredParticipantsNameFederationDTO } from "../dtos/tournament/registeredParticipant/RegisteredParticipantDTOs.js";
import { RegisteredParticipantMapper } from "../dtos/tournament/registeredParticipant/RegisteredParticipantMapper.js";
import {
    DoCheckInParticipantRequestDTO,
    RegisterParticipantInTournamentRequestDTO,
    UndoCheckInParticipantRequestDTO,
    UnregisterParticipantInTournamentRequestDTO,
} from "../dtos/tournament/TournamentDTOs.js";


export class RegisteredParticipantService {
    constructor(
        private readonly tournamentRepository: ITournamentRepository,
        private readonly bracketRepository: IBracketRepository,
        private readonly registeredParticipantRepository: IRegisteredParticipantRepository,
        private readonly playerRepository: IPlayerRepository,
        private readonly userRepository: IUserRepository,
    ) { }


    public async getRegisteredParticipantsByTournamentId(id: string): Promise<RegisteredParticipantsNameFederationDTO[]> {
        // 1. Fetch the tournament in the DB
        const tournament = await this.tournamentRepository.findById(id);
        if (!tournament) {
            throw new TournamentNotFoundException();
        }

        // 2. Fetch the tournament participants in the DB
        const participants = await this.registeredParticipantRepository.findAllByTournamentId(id);
        if (!participants || participants.length === 0) {
            return [];
        }

        // 3. Map everything together
        return participants.map(p => RegisteredParticipantMapper.toResponse(p));
    }


    public async registerParticipantInTournament(request: RegisterParticipantInTournamentRequestDTO): Promise<void> {
        // 1. Rehydrate the tournament from the DB
        const tournament = await this.tournamentRepository.findById(request.id);
        if (!tournament) {
            throw new TournamentNotFoundException();
        }

        // 2. Check the tournament registration is open
        if (!tournament.isRegistrationOpen()) {
            throw new RegistrationAlreadyClosedException();
        }

        // 3. Check the tournament does not have a bracket
        const bracket = await this.bracketRepository.findByTournamentId(request.id);
        if (bracket) {
            throw new TournamentAlreadyHasBracketException();
        }

        // 4. Check the player exists
        const player = await this.playerRepository.findByIdWithUser(request.playerId);
        if (!player) {
            throw new PlayerNotFoundException();
        }

        // 5. Check the player is registrated in the same season as the tournament
        if (!player.player.getSeason().equals(tournament.getSeason())) {
            throw new InvalidRegisteredPlayerSeasonException();
        }

        // 6. Check the participant is not already registered in this tournament
        const existingParticipant = await this.registeredParticipantRepository.findByTournamentIdAndPlayerId(
            request.id,
            request.playerId,
        );
        if (existingParticipant) {
            throw new ParticipantAlreadyRegisteredException();
        }

        // 7. Check not exceed max players
        const maxPlayers = tournament.getInfo().getMaxPlayers();
        if (maxPlayers) {
            const registeredParticipantsCount = await this.registeredParticipantRepository.countByTournamentId(request.id);
            if (registeredParticipantsCount >= maxPlayers) {
                throw new TournamentMaxPlayersExceededException();
            }
        }

        // 8. Create the new registered participant
        const newRegisteredParticipant = RegisteredParticipant.create(
            request.playerId,
            request.id,
            player.user.getAlias(),
            player.player.getFederation(),
        );

        // 8. Persist the changes in the DB
        await this.registeredParticipantRepository.create(
            newRegisteredParticipant,
        );
    }


    public async unregisterParticipantFromTournament(request: UnregisterParticipantInTournamentRequestDTO): Promise<void> {
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
            throw new ParticipantNotRegisteredException();
        }

        // 4. Persist the changes in the DB
        await this.registeredParticipantRepository.delete(
            request.participantId,
        );
    }


    public async doCheckInParticipant(request: DoCheckInParticipantRequestDTO): Promise<void> {
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
        registeredParticipant.doCheckIn();

        // 5. Persist the changes in the DB
        await this.registeredParticipantRepository.update(
            registeredParticipant,
        );
    }


    public async undoCheckInParticipant(request: UndoCheckInParticipantRequestDTO): Promise<void> {
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