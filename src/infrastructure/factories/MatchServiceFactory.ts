import { MatchService } from "../../application/services/MatchService.js";
import { prisma } from "../persistence/prismaClient.js";
import { RedisMatchCacheRepository } from "../persistence/repositories/RedisMatchCacheRepository.js";
import { PrismaMatchRepository } from "../persistence/repositories/PrismaMatchRepository.js";
import { PrismaTournamentRepository } from "../persistence/repositories/PrismaTournamentRepository.js";
import { PrismaPlayingAreaRepository } from "../persistence/repositories/PrismaPlayingAreaRepository.js";
import { PrismaBracketRepository } from "../persistence/repositories/PrismaBracketRepository.js";
import { PrismaUnitOfWork } from "../persistence/PrismaUnitOfWork.js";
import { SingleEliminationMatchGenerator } from "../../domain/services/SingleEliminationMatchGenerator.js";
import { globalEventBus } from "../config/eventBus.js";

export default class MatchServiceFactory {
    private static instance: MatchService | null = null;

    public static getInstance(): MatchService {
        if (!this.instance) {
            const matchRepository = new PrismaMatchRepository(prisma);
            const bracketRepository = new PrismaBracketRepository(prisma);
            const tournamentRepository = new PrismaTournamentRepository(prisma);
            const playingAreaRepository = new PrismaPlayingAreaRepository(prisma);
            const matchCacheRepository = new RedisMatchCacheRepository();
            const unitOfWork = new PrismaUnitOfWork(prisma);
            const matchGenerator = new SingleEliminationMatchGenerator();

            this.instance = new MatchService(
                matchRepository,
                bracketRepository,
                tournamentRepository,
                playingAreaRepository,
                matchCacheRepository,
                matchGenerator,
                globalEventBus,
                unitOfWork,
            );
        }
        return this.instance;
    }
}
