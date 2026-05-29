import { prisma } from "../persistence/client.js";
import { PrismaTournamentRepository } from "../persistence/repositories/PrismaTournamentRepository.js";
import { TournamentResultsService } from "../../application/services/TournamentResultsService.js";
import { PrismaTournamentResultRepository } from "../persistence/repositories/PrismaTournamentResultRepository.js";


export default class TournamentResultsServiceFactory {
    private static instance: TournamentResultsService | null = null;

    public static getInstance(): TournamentResultsService {
        if (!this.instance) {
            const tournamentRepository = new PrismaTournamentRepository(prisma);
            const tournamentResultRepository = new PrismaTournamentResultRepository(prisma);

            this.instance = new TournamentResultsService(
                tournamentRepository,
                tournamentResultRepository,
            );
        }
        return this.instance;
    }
}
