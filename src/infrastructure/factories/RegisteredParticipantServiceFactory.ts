import { prisma } from "../persistence/client.js";
import { PrismaTournamentRepository } from "../persistence/repositories/PrismaTournamentRepository.js";
import { PrismaBracketRepository } from "../persistence/repositories/PrismaBracketRepository.js";
import { PrismaRegisteredParticipantRepository } from "../persistence/repositories/PrismaRegisteredParticipantRepository.js";
import { PrismaPlayerRepository } from "../persistence/repositories/PrismaPlayerRepository.js";
import { PrismaUserRepository } from "../persistence/repositories/PrismaUserRepository.js";
import { RegisteredParticipantService } from "../../application/services/RegisteredParticipantService.js";


export default class RegisteredParticipantServiceFactory {
    private static instance: RegisteredParticipantService | null = null;

    public static getInstance(): RegisteredParticipantService {
        if (!this.instance) {
            const tournamentRepository = new PrismaTournamentRepository(prisma);
            const bracketRepository = new PrismaBracketRepository(prisma);
            const registeredParticipantRepository = new PrismaRegisteredParticipantRepository(prisma);
            const playerRepository = new PrismaPlayerRepository(prisma);
            const userRepository = new PrismaUserRepository(prisma);

            this.instance = new RegisteredParticipantService(
                tournamentRepository,
                bracketRepository,
                registeredParticipantRepository,
                playerRepository,
                userRepository,
            );
        }
        return this.instance;
    }
}
