import { PlayerService } from '../../application/services/PlayerService.js';
import { prisma } from "../persistence/prismaClient.js";
import { PrismaUserRepository } from '../persistence/repositories/PrismaUserRepository.js';
import { PrismaPlayerRepository } from '../persistence/repositories/PrismaPlayerRepository.js';
import { PrismaTournamentRepository } from '../persistence/repositories/PrismaTournamentRepository.js';
import { PrismaRegisteredParticipantRepository } from '../persistence/repositories/PrismaRegisteredParticipantRepository.js';

export default class PlayerServiceFactory {
    private static instance: PlayerService | null = null;

    public static getInstance(): PlayerService {
        if (!this.instance) {
            const playerRepository = new PrismaPlayerRepository(prisma);
            const userRepository = new PrismaUserRepository(prisma);
            const tournamentRepository = new PrismaTournamentRepository(prisma);
            const registeredParticipantRepository = new PrismaRegisteredParticipantRepository(prisma);

            this.instance = new PlayerService(
                playerRepository,
                userRepository,
                tournamentRepository,
                registeredParticipantRepository,
            );
        }
        return this.instance;
    }
}
