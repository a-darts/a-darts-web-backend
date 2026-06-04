import { prisma } from "../persistence/prismaClient.js";
import { PrismaTournamentRepository } from "../persistence/repositories/PrismaTournamentRepository.js";
import { PrismaBracketRepository } from "../persistence/repositories/PrismaBracketRepository.js";
import { TournamentService } from "../../application/services/TournamentService.js";
import { PrismaPlayerRepository } from "../persistence/repositories/PrismaPlayerRepository.js";
import { PrismaRegisteredParticipantRepository } from "../persistence/repositories/PrismaRegisteredParticipantRepository.js";
import { PrismaMatchRepository } from "../persistence/repositories/PrismaMatchRepository.js";
import { SingleEliminationMatchGenerator } from "../../domain/services/SingleEliminationMatchGenerator.js";
import { PrismaUnitOfWork } from "../persistence/PrismaUnitOfWork.js";
import { PrismaPlayingAreaRepository } from "../persistence/repositories/PrismaPlayingAreaRepository.js";
import { globalEventBus } from "../config/eventBus.js";
import { PrismaTournamentResultRepository } from "../persistence/repositories/PrismaTournamentResultRepository.js";


export default class TournamentServiceFactory {
    private static instance: TournamentService | null = null;

    public static getInstance(): TournamentService {
        if (!this.instance) {
            const tournamentRepository = new PrismaTournamentRepository(prisma);
            const bracketRepository = new PrismaBracketRepository(prisma);
            const registeredParticipantRepository = new PrismaRegisteredParticipantRepository(prisma);
            const playingAreaRepository = new PrismaPlayingAreaRepository(prisma);
            const tournamentResultRepository = new PrismaTournamentResultRepository(prisma);
            const matchRepository = new PrismaMatchRepository(prisma);
            const matchGenerator = new SingleEliminationMatchGenerator();
            const unitOfWork = new PrismaUnitOfWork(prisma);

            this.instance = new TournamentService(
                tournamentRepository,
                bracketRepository,
                registeredParticipantRepository,
                playingAreaRepository,
                tournamentResultRepository,
                matchRepository,
                matchGenerator,
                globalEventBus,
                unitOfWork,
            );
        }
        return this.instance;
    }
}
