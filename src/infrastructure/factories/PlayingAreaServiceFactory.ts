import { prisma } from "../persistence/client.js";
import { PlayingAreaService } from '../../application/services/PlayingAreaService.js';
import { PrismaPlayingAreaRepository } from "../persistence/repositories/PrismaPlayingAreaRepository.js";
import { PrismaTournamentRepository } from "../persistence/repositories/PrismaTournamentRepository.js";

export default class PlayingAreaServiceFactory {
    private static instance: PlayingAreaService | null = null;

    public static getInstance(): PlayingAreaService {
        if (!this.instance) {
            const playingAreaRepository = new PrismaPlayingAreaRepository(prisma);
            const tournamentRepository = new PrismaTournamentRepository(prisma);

            this.instance = new PlayingAreaService(
                playingAreaRepository,
                tournamentRepository,
            );
        }
        return this.instance;
    }
}
