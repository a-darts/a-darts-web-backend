import { PlayerService } from '../../application/services/PlayerService.js';
import { prisma } from "../persistence/client.js";
import { PrismaUserRepository } from '../persistence/repositories/PrismaUserRepository.js';
import { PrismaPlayerRepository } from '../persistence/repositories/PrismaPlayerRepository.js';

export default class PlayerServiceFactory {
    private static instance: PlayerService | null = null;

    public static getInstance(): PlayerService {
        if (!this.instance) {
            const playerRepository = new PrismaPlayerRepository(prisma);
            const userRepository = new PrismaUserRepository(prisma);

            this.instance = new PlayerService(
                playerRepository,
                userRepository,
            );
        }
        return this.instance;
    }
}
