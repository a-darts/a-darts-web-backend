import { prisma } from "../persistence/prismaClient.js";
import { PlayingAreaService } from '../../application/services/PlayingAreaService.js';
import { PrismaPlayingAreaRepository } from "../persistence/repositories/PrismaPlayingAreaRepository.js";
import { PrismaTournamentRepository } from "../persistence/repositories/PrismaTournamentRepository.js";
import { RedisMatchCacheRepository } from "../persistence/repositories/RedisMatchCacheRepository.js";

export default class PlayingAreaServiceFactory {
    private static instance: PlayingAreaService | null = null;

    public static getInstance(): PlayingAreaService {
        if (!this.instance) {
            const playingAreaRepository = new PrismaPlayingAreaRepository(prisma);
            const tournamentRepository = new PrismaTournamentRepository(prisma);
            const matchCacheRepository = new RedisMatchCacheRepository();

            this.instance = new PlayingAreaService(
                playingAreaRepository,
                tournamentRepository,
                matchCacheRepository,
            );
        }
        return this.instance;
    }
}
