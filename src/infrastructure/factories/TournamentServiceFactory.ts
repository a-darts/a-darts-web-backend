import { prisma } from "../persistence/client.js";
import { PrismaTournamentRepository } from "../persistence/repositories/PrismaTournamentRepository.js";
import { PrismaBracketRepository } from "../persistence/repositories/PrismaBracketRepository.js";
import { TournamentService } from "../../application/services/TournamentService.js";
import { PrismaPlayerRepository } from "../persistence/repositories/PrismaPlayerRepository.js";
import { PrismaRegisteredParticipantRepository } from "../persistence/repositories/PrismaRegisteredParticipantRepository.js";
import { PrismaMatchRepository } from "../persistence/repositories/PrismaMatchRepository.js";
import { SingleEliminationMatchGenerator } from "../../domain/services/SingleEliminationMatchGenerator.js";
import { PrismaUnitOfWork } from "../persistence/PrismaUnitOfWork.js";


export default class TournamentServiceFactory {
    private static instance: TournamentService | null = null;

    public static getInstance(): TournamentService {
        if (!this.instance) {
            const tournamentRepository = new PrismaTournamentRepository(prisma);
            const bracketRepository = new PrismaBracketRepository(prisma);
            const registeredParticipantRepository = new PrismaRegisteredParticipantRepository(prisma);
            const matchRepository = new PrismaMatchRepository(prisma);
            const matchGenerator = new SingleEliminationMatchGenerator();
            const unitOfWork = new PrismaUnitOfWork(prisma);

            this.instance = new TournamentService(
                tournamentRepository,
                bracketRepository,
                registeredParticipantRepository,
                matchRepository,
                matchGenerator,
                unitOfWork,
            );
        }
        return this.instance;
    }
}
