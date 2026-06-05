import { prisma } from "../persistence/prismaClient.js";
import { PrismaTournamentRepository } from "../persistence/repositories/PrismaTournamentRepository.js";
import { TournamentResultsService } from "../../application/services/TournamentResultsService.js";
import { PrismaTournamentResultRepository } from "../persistence/repositories/PrismaTournamentResultRepository.js";
import { PrismaPlayerRepository } from "../persistence/repositories/PrismaPlayerRepository.js";
import { PrismaUserRepository } from "../persistence/repositories/PrismaUserRepository.js";


export default class TournamentResultsServiceFactory {
    private static instance: TournamentResultsService | null = null;

    public static getInstance(): TournamentResultsService {
        if (!this.instance) {
            const tournamentRepository = new PrismaTournamentRepository(prisma);
            const tournamentResultRepository = new PrismaTournamentResultRepository(prisma);
            const playerRepository = new PrismaPlayerRepository(prisma);
            const userRepository = new PrismaUserRepository(prisma);

            this.instance = new TournamentResultsService(
                tournamentRepository,
                tournamentResultRepository,
                playerRepository,
                userRepository,
            );
        }
        return this.instance;
    }
}
