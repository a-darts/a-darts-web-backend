import { Prisma } from '@prisma/client';
import { Match } from '../../../../domain/entities/Match.js';
import { ParticipantNotRegisteredInTournamentException } from '../../../../domain/exceptions/MatchExceptions.js';
import { TournamentNotFoundException } from '../../../../domain/exceptions/TournamentExceptions.js';
import { MatchRepository } from '../../../../domain/repositories/MatchRepository.js';
import { RegisteredParticipantRepository } from '../../../../domain/repositories/RegisteredParticipantRepository.js';
import { TournamentRepository } from '../../../../domain/repositories/TournamentRepository.js';
import { CreateMatchRequestDTO } from '../../../dtos/tournament/match/MatchDTOs.js';
import { MatchAlreadyExistsException } from '../../../../domain/exceptions/MatchExceptions.js';


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
            throw new ParticipantNotRegisteredInTournamentException(1);
        }

        const isParticipant2Registered = await this.registeredParticipantRepository.findById(request.participant2Id);
        if (!isParticipant2Registered) {
            throw new ParticipantNotRegisteredInTournamentException(2);
        }

        // 3. Check if the match already exists in this tournament
        const existingMatch = await this.matchRepository.findByParticipantsIdsAndTournamentId(
            request.participant1Id,
            request.participant2Id,
            request.id,
        );
        if (existingMatch) {
            throw new MatchAlreadyExistsException();
        }

        // 4. Create the match
        const match = Match.create(
            request.participant1Id,
            request.participant2Id,
            request.round,
            request.boardNumber ?? undefined,
        );

        // 5. Persist the match in the DB
        try {
            await this.matchRepository.create(request.id, match);
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
                throw new MatchAlreadyExistsException();
            }
            throw error;
        }
    }
}
