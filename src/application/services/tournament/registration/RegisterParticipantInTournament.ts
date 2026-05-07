import { RegistrationStatus } from '../../../../domain/entities/Registration.js';
import { InvalidRegisteredPlayerSeasonException, PlayerNotFoundException } from '../../../../domain/exceptions/PlayerExceptions.js';
import { InvalidRegistrationStatusException } from '../../../../domain/exceptions/RegistrationExceptions.js';
import { TournamentNotFoundException } from '../../../../domain/exceptions/TournamentExceptions.js';
import { PlayerRepository } from '../../../../domain/repositories/PlayerRepository.js';
import { TournamentRepository } from '../../../../domain/repositories/TournamentRepository.js';
import { RegisterParticipantInTournamentRequestDTO } from '../../../dtos/tournament/TournamentDTOs.js';

export class RegisterParticipantInTournament {
    constructor(
        private readonly tournamentRepository: TournamentRepository,
        private readonly playerRepository: PlayerRepository,
    ) { }

    public async execute(request: RegisterParticipantInTournamentRequestDTO): Promise<void> {
        // 1. Rehydrate the tournament from the DB
        const tournament = await this.tournamentRepository.findById(request.id);
        if (!tournament) {
            throw new TournamentNotFoundException();
        }

        // 2. Check if the player exists
        const player = await this.playerRepository.findById(request.participantId);
        if (!player) {
            throw new PlayerNotFoundException();
        }

        // 3. Check if the player is registrated in the same season as the tournament
        if (
            player.getSeason().getStartYear() !== tournament.getInfo().getDateTime().getFullYear() ||
            player.getSeason().getEndYear() !== tournament.getInfo().getDateTime().getFullYear()
        ) {
            throw new InvalidRegisteredPlayerSeasonException();
        }

        // 4. Register the participant in the tournament
        tournament.registerParticipant(request.participantId);

        // 5. Persist the changes in the DB
        await this.tournamentRepository.update(tournament);
        // MIRAR: FALTA registrar al participante en la DB
    }
}
