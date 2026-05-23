import { Bracket } from '../../../domain/entities/Bracket.js';
import { CreateBracketRequestDTO, BracketResponseDTO } from '../../dtos/bracket/BracketDTOs.js';
import { BracketMapper } from '../../dtos/bracket/BracketMapper.js';
import { BracketRepository } from '../../../domain/repositories/BracketRepository.js';
import { TournamentRepository } from '../../../domain/repositories/TournamentRepository.js';
import { TournamentNotFoundException } from '../../../domain/exceptions/TournamentExceptions.js';
import { UnitOfWork } from '../../../domain/repositories/UnitOfWork.js';
import { BracketSeedingService } from '../../../domain/services/BracketSeedingService.js';

export class CreateBracketManually {
    constructor(
        private readonly unitOfWork: UnitOfWork,
        private readonly bracketRepository: BracketRepository,
        private readonly tournamentRepository: TournamentRepository,
        private readonly seedingService: BracketSeedingService,
    ) { }

    public async execute(request: CreateBracketRequestDTO): Promise<BracketResponseDTO> {
        // 1. Rehydrate the tournament object
        const tournament = await this.tournamentRepository.findById(request.id);
        if (!tournament) {
            throw new TournamentNotFoundException();
        }

        // 3. Create the bracket (with manual factory method)
        const bracket = Bracket.createManualEmpty(
            request.id,
            tournament.getRegistration().getRegisteredParticipantsCount(),
            this.seedingService,
        );
        tournament.bracketGenerated();

        // 4. Persist the changes in the DB
        await this.unitOfWork.transaction(async () => {
            await this.bracketRepository.create(bracket);
            await this.tournamentRepository.update(tournament);
        });

        // 5. Return the bracket data
        return BracketMapper.toResponse(bracket);
    }
}
