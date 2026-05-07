import { RegisteredParticipant } from '../../../../domain/entities/Participant.js';
import { ParticipantAlreadyRegisteredException } from '../../../../domain/exceptions/ParticipantExceptions.js';
import { InvalidRegisteredPlayerSeasonException, PlayerNotFoundException } from '../../../../domain/exceptions/PlayerExceptions.js';
import { TournamentNotFoundException } from '../../../../domain/exceptions/TournamentExceptions.js';
import { PlayerRepository } from '../../../../domain/repositories/PlayerRepository.js';
import { RegisteredParticipantRepository } from '../../../../domain/repositories/RegisteredParticipantRepository.js';
import { TournamentRepository } from '../../../../domain/repositories/TournamentRepository.js';
import { RegisterParticipantInTournamentRequestDTO } from '../../../dtos/tournament/TournamentDTOs.js';


export class RegisterParticipantInTournament {
    constructor(
        private readonly tournamentRepository: TournamentRepository,
        private readonly registeredParticipantRepository: RegisteredParticipantRepository,
        private readonly playerRepository: PlayerRepository,
    ) { }

    public async execute(request: RegisterParticipantInTournamentRequestDTO): Promise<void> {
        // 1. Rehydrate the tournament from the DB
        const tournament = await this.tournamentRepository.findById(request.id);
        if (!tournament) {
            throw new TournamentNotFoundException();
        }

        // 2. Check if the player exists
        const player = await this.playerRepository.findById(request.playerId);
        if (!player) {
            throw new PlayerNotFoundException();
        }

        // 3. Check if the player is registrated in the same season as the tournament
        if (
            player.getSeason().getStartYear() !== tournament.getInfo().getDateTime().getFullYear() &&
            player.getSeason().getEndYear() !== tournament.getInfo().getDateTime().getFullYear()
        ) {
            throw new InvalidRegisteredPlayerSeasonException();
        }

        // 4. Check if the participant is already registered in this tournament
        const existingParticipant = await this.registeredParticipantRepository.findByTournamentIdAndPlayerId(
            request.id,
            request.playerId,
        );
        if (existingParticipant) {
            throw new ParticipantAlreadyRegisteredException();
        }

        // 5. Register the participant in the tournament
        tournament.registerParticipant(request.playerId);

        // 6. Persist the changes in the DB
        // 6.1. Update the tournament registered participants ids
        await this.tournamentRepository.update(tournament);
        // 6.2. Create the new registered participant
        const newRegisteredParticipant = RegisteredParticipant.create(
            request.playerId,
        );
        await this.registeredParticipantRepository.create(
            tournament.getId(),
            newRegisteredParticipant,
        );
    }
}
