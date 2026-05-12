import { Match } from '../../../../domain/entities/Match.js';
import { RegisteredParticipant } from '../../../../domain/entities/Participant.js';
import { ParticipantAlreadyRegisteredException, ParticipantNotRegisteredException } from '../../../../domain/exceptions/ParticipantExceptions.js';
import { InvalidRegisteredPlayerSeasonException, PlayerNotFoundException } from '../../../../domain/exceptions/PlayerExceptions.js';
import { TournamentNotFoundException } from '../../../../domain/exceptions/TournamentExceptions.js';
import { MatchRepository } from '../../../../domain/repositories/MatchRepository.js';
import { RegisteredParticipantRepository } from '../../../../domain/repositories/RegisteredParticipantRepository.js';
import { TournamentRepository } from '../../../../domain/repositories/TournamentRepository.js';
import { CreateMatchRequestDTO } from '../../../dtos/tournament/match/MatchDTOs.js';


export class CreateMatch {
    constructor(
        private readonly tournamentRepository: TournamentRepository,
        private readonly registeredParticipantRepository: RegisteredParticipantRepository,
        private readonly matchRepository: MatchRepository,
    ) { }

    public async execute(request: CreateMatchRequestDTO): Promise<void> {
        // 1. Rehydrate the tournament from the DB
        const tournament = await this.tournamentRepository.findById(request.id);
        if (!tournament) {
            throw new TournamentNotFoundException();
        }

        // 2. Check if the participants are registered in the tournament
        const isParticipant1Registered = await this.registeredParticipantRepository.findById(request.participant1Id);
        if (!isParticipant1Registered) {
            throw new ParticipantNotRegisteredException();
        }

        const isParticipant2Registered = await this.registeredParticipantRepository.findById(request.participant2Id);
        if (!isParticipant2Registered) {
            throw new ParticipantNotRegisteredException();
        }

        // 3. Create the match
        const match = Match.create(
            request.participant1Id,
            request.participant2Id,
            request.round,
            request.boardNumber ?? undefined,
        );

        // 4. Persist the match in the DB
        await this.matchRepository.create(match);
    }
}
