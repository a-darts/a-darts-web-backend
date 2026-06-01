import { UserService } from '../../application/services/UserService.js';
import { prisma } from "../persistence/prismaClient.js";
import { PrismaUserRepository } from '../persistence/repositories/PrismaUserRepository.js';
import { BcryptPasswordHasher } from '../security/BcryptPasswordHasher.js';
import { NodemailerMailer } from '../adapters/NodemailerMailer.js';

export default class UserServiceFactory {
    private static instance: UserService | null = null;

    public static getInstance(): UserService {
        if (!this.instance) {
            const userRepository = new PrismaUserRepository(prisma);
            const passwordHasher = new BcryptPasswordHasher();
            const mailer = new NodemailerMailer();

            this.instance = new UserService(
                userRepository,
                passwordHasher,
                mailer,
            );
        }
        return this.instance;
    }
}
