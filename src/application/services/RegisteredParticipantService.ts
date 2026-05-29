import { RegisteredParticipant } from "../../domain/entities/Participant.js";
import { ParticipantAlreadyRegisteredException, RegisteredParticipantNotFoundException } from "../../domain/exceptions/ParticipantExceptions.js";
import { InvalidRegisteredPlayerSeasonException, PlayerNotFoundException } from "../../domain/exceptions/PlayerExceptions.js";
import { TournamentAlreadyHasBracketException, TournamentNotFoundException } from "../../domain/exceptions/TournamentExceptions.js";
import { UserNotFoundException } from "../../domain/exceptions/UserExceptions.js";
import { IBracketRepository } from "../../domain/repositories/IBracketRepository.js";
import { PlayerRepository } from "../../domain/repositories/PlayerRepository.js";
import { RegisteredParticipantRepository } from "../../domain/repositories/RegisteredParticipantRepository.js";
import { TournamentRepository } from "../../domain/repositories/TournamentRepository.js";
import { UserRepository } from "../../domain/repositories/UserRepository.js";
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
        private readonly tournamentRepository: TournamentRepository,
        private readonly bracketRepository: IBracketRepository,
        private readonly registeredParticipantRepository: RegisteredParticipantRepository,
        private readonly playerRepository: PlayerRepository,
        private readonly userRepository: UserRepository,
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

        // 2. Check the tournament does not have a bracket
        const bracket = await this.bracketRepository.findByTournamentId(request.id);
        if (bracket) {
            throw new TournamentAlreadyHasBracketException();
        }

        // 3. Check if the player exists
        const player = await this.playerRepository.findById(request.playerId);
        if (!player) {
            throw new PlayerNotFoundException();
        }

        // 4. Check if the player is registrated in the same season as the tournament
        if (!player.getSeason().equals(tournament.getSeason())) {
            throw new InvalidRegisteredPlayerSeasonException();
        }

        // 5. Check if the participant is already registered in this tournament
        const existingParticipant = await this.registeredParticipantRepository.findByTournamentIdAndPlayerId(
            request.id,
            request.playerId,
        );
        if (existingParticipant) {
            throw new ParticipantAlreadyRegisteredException();
        }

        // 6. Get player alias
        const user = await this.userRepository.findById(player.getUserId());
        if (!user) {
            throw new UserNotFoundException();
        }

        // 7. Create the new registered participant
        const newRegisteredParticipant = RegisteredParticipant.create(
            request.playerId,
            request.id,
            user.getAlias(),
            player.getFederation(),
        );

        // 8. Register the participant in the tournament
        tournament.registerParticipant(newRegisteredParticipant.getId());

        // 9. Persist the changes in the DB
        await this.tournamentRepository.update(tournament);
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