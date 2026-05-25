import { RegisteredParticipant } from '../../../../domain/entities/Participant.js';
import { ParticipantAlreadyRegisteredException } from '../../../../domain/exceptions/ParticipantExceptions.js';
import { InvalidRegisteredPlayerSeasonException, PlayerNotFoundException } from '../../../../domain/exceptions/PlayerExceptions.js';
import { TournamentAlreadyHasBracketException, TournamentNotFoundException } from '../../../../domain/exceptions/TournamentExceptions.js';
import { UserNotFoundException } from '../../../../domain/exceptions/UserExceptions.js';
import { BracketRepository } from '../../../../domain/repositories/BracketRepository.js';
import { PlayerRepository } from '../../../../domain/repositories/PlayerRepository.js';
import { RegisteredParticipantRepository } from '../../../../domain/repositories/RegisteredParticipantRepository.js';
import { TournamentRepository } from '../../../../domain/repositories/TournamentRepository.js';
import { UserRepository } from '../../../../domain/repositories/UserRepository.js';
import { RegisterParticipantInTournamentRequestDTO } from '../../../dtos/tournament/TournamentDTOs.js';


export class RegisterParticipantInTournament {
    constructor(
        private readonly tournamentRepository: TournamentRepository,
        private readonly bracketRepository: BracketRepository,
        private readonly registeredParticipantRepository: RegisteredParticipantRepository,
        private readonly playerRepository: PlayerRepository,
        private readonly userRepository: UserRepository,
    ) { }

    public async execute(request: RegisterParticipantInTournamentRequestDTO): Promise<void> {
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
}
