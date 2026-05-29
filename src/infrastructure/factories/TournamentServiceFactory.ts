import { prisma } from "../persistence/client.js";
import { PrismaTournamentRepository } from "../persistence/repositories/PrismaTournamentRepository.js";
import { PrismaBracketRepository } from "../persistence/repositories/PrismaBracketRepository.js";
import { TournamentService } from "../../application/services/TournamentService.js";


export default class TournamentServiceFactory {
    private static instance: TournamentService | null = null;

    public static getInstance(): TournamentService {
        if (!this.instance) {
            const tournamentRepository = new PrismaTournamentRepository(prisma);
            const bracketRepository = new PrismaBracketRepository(prisma);

            this.instance = new TournamentService(
                tournamentRepository,
                bracketRepository,
            );
        }
        return this.instance;
    }
}
