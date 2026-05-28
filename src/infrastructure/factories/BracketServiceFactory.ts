import { BracketService } from '../../application/services/BracketService.js';
import { PrismaBracketRepository } from '../persistence/repositories/PrismaBracketRepository.js';
import { prisma } from "../persistence/client.js";
import { PrismaTournamentRepository } from '../persistence/repositories/PrismaTournamentRepository.js';
import { PrismaRegisteredParticipantRepository } from '../persistence/repositories/PrismaRegisteredParticipantRepository.js';
import { PrismaUnitOfWork } from '../persistence/PrismaUnitOfWork.js';
import { BracketSeedingService } from '../../domain/services/BracketSeedingService.js';

export default class BracketServiceFactory {
    private static instance: BracketService | null = null;

    public static getInstance(): BracketService {
        if (!this.instance) {
            const bracketRepository = new PrismaBracketRepository(prisma);
            const tournamentRepository = new PrismaTournamentRepository(prisma);
            const registeredParticipantRepository = new PrismaRegisteredParticipantRepository(prisma);
            
            const unitOfWork = new PrismaUnitOfWork(prisma);
            const bracketSeedingService = new BracketSeedingService(); 

            this.instance = new BracketService(
                bracketRepository,
                tournamentRepository,
                registeredParticipantRepository,
                unitOfWork,
                bracketSeedingService,
            );
        }
        return this.instance;
    }
}
